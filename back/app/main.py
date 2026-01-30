from __future__ import annotations

import asyncio
import json
import os
import sqlite3
import uuid
from urllib.parse import urlparse
from typing import Dict, List, Optional, Tuple

from aiogram import Bot as TelegramBot
from aiogram import Dispatcher
from aiogram.filters import Command
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputMediaPhoto,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    FSInputFile,
)
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(title="Bot Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.getenv("BOT_DB", "bot_builder.db")
UPLOAD_DIR = os.getenv("BOT_UPLOADS", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class Flow(BaseModel):
    nodes: List[dict] = Field(default_factory=list)
    edges: List[dict] = Field(default_factory=list)


class BotCreate(BaseModel):
    name: str = Field(min_length=1)
    token: Optional[str] = None


class BotUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    token: Optional[str] = None
    status: Optional[str] = None


class Bot(BaseModel):
    id: str
    name: str
    token: Optional[str] = None
    status: str = "stopped"
    flow: Flow = Field(default_factory=Flow)


RUNNING_BOTS: Dict[str, Dict[str, object]] = {}
FLOW_CACHE: Dict[str, Flow] = {}


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS bots (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                token TEXT,
                status TEXT NOT NULL,
                flow TEXT NOT NULL
            )
            """
        )
        conn.commit()


init_db()


def row_to_bot(row: sqlite3.Row) -> Bot:
    flow = json.loads(row["flow"]) if row["flow"] else {"nodes": [], "edges": []}
    return Bot(
        id=row["id"],
        name=row["name"],
        token=row["token"],
        status=row["status"],
        flow=Flow(**flow),
    )


def get_bot_or_404(bot_id: str) -> Bot:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM bots WHERE id = ?", (bot_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Bot not found")
    return row_to_bot(row)


def update_bot_row(bot: Bot) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE bots SET name = ?, token = ?, status = ?, flow = ? WHERE id = ?",
            (
                bot.name,
                bot.token,
                bot.status,
                json.dumps(bot.flow.model_dump()),
                bot.id,
            ),
        )
        conn.commit()


def normalize_command(text: str) -> str:
    cleaned = text.strip()
    if not cleaned.startswith("/"):
        return ""
    value = cleaned[1:]
    if not value:
        return ""
    value = value.split()[0]
    value = value.split("@")[0]
    return value.lower()


def find_command_node(flow: Flow, command: str) -> Optional[dict]:
    command_lower = command.lower()
    for node in flow.nodes:
        data = node.get("data", {})
        if data.get("kind") != "command":
            continue
        command_text = (data.get("commandText") or "/start").strip()
        if not command_text:
            continue
        normalized = command_text.lstrip("/").strip().lower()
        if not normalized:
            continue
        if normalized == command_lower:
            return node
    return None


def parse_timer_seconds(node: dict) -> float:
    data = node.get("data", {})
    raw = data.get("timerSeconds") or 0
    try:
        value = float(raw)
    except (TypeError, ValueError):
        value = 0.0
    return max(0.0, value)


def collect_content_targets_with_delay(flow: Flow, source_id: str) -> List[Tuple[dict, float]]:
    nodes_by_id = {node.get("id"): node for node in flow.nodes}
    results: List[Tuple[dict, float]] = []
    seen_targets: set[str] = set()
    visited: set[str] = set()
    queue: List[Tuple[str, float]] = [(source_id, 0.0)]
    while queue:
        current_id, delay = queue.pop(0)
        if not current_id or current_id in visited:
            continue
        visited.add(current_id)
        for edge in flow.edges:
            if edge.get("source") != current_id:
                continue
            target_node = nodes_by_id.get(edge.get("target"))
            if not target_node:
                continue
            kind = target_node.get("data", {}).get("kind")
            if kind in ("message", "image"):
                target_id = target_node.get("id") or ""
                if target_id and target_id not in seen_targets:
                    seen_targets.add(target_id)
                    results.append((target_node, delay))
            elif kind == "timer":
                next_delay = delay + parse_timer_seconds(target_node)
                queue.append((target_node.get("id") or "", next_delay))
    return results


def find_reply_button_by_text(flow: Flow, text: str) -> Optional[dict]:
    needle = text.strip().lower()
    if not needle:
        return None
    for node in flow.nodes:
        data = node.get("data", {})
        if data.get("kind") != "reply_button":
            continue
        label = (data.get("buttonText") or data.get("label") or "").strip().lower()
        if label == needle:
            return node
    return None


def collect_button_rows(flow: Flow, content_node_id: str) -> Tuple[List[List[dict]], List[List[dict]]]:
    nodes_by_id = {node.get("id"): node for node in flow.nodes}
    row_edges = [edge for edge in flow.edges if edge.get("source") == content_node_id]
    row_nodes = []
    direct_buttons = []
    for edge in row_edges:
        target_node = nodes_by_id.get(edge.get("target"))
        if not target_node:
            continue
        kind = target_node.get("data", {}).get("kind")
        if kind == "button_row":
            row_nodes.append(target_node)
        elif kind in ("message_button", "reply_button"):
            direct_buttons.append(target_node)

    inline_rows: List[List[dict]] = []
    reply_rows: List[List[dict]] = []

    if row_nodes:
        for row_node in row_nodes:
            row_buttons = [
                nodes_by_id.get(edge.get("target"))
                for edge in flow.edges
                if edge.get("source") == row_node.get("id")
            ]
            row_buttons = [btn for btn in row_buttons if btn]
            inline = [btn for btn in row_buttons if btn.get("data", {}).get("kind") == "message_button"]
            reply = [btn for btn in row_buttons if btn.get("data", {}).get("kind") == "reply_button"]
            if inline:
                inline_rows.append(inline)
            if reply:
                reply_rows.append(reply)
    else:
        for btn in direct_buttons:
            kind = btn.get("data", {}).get("kind")
            if kind == "message_button":
                inline_rows.append([btn])
            elif kind == "reply_button":
                reply_rows.append([btn])

    return inline_rows, reply_rows


def build_reply_markup(flow: Flow, content_node_id: str):
    nodes_by_id = {node.get("id"): node for node in flow.nodes}
    inline_rows, reply_rows = collect_button_rows(flow, content_node_id)
    has_clear = any(
        nodes_by_id.get(edge.get("target"), {}).get("data", {}).get("kind") == "reply_clear"
        for edge in flow.edges
        if edge.get("source") == content_node_id
    )

    if inline_rows:
        return InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text=(btn.get("data", {}).get("buttonText") or btn.get("data", {}).get("label") or "").strip(),
                        callback_data=f"btn:{btn.get('id') or ''}"[:64],
                    )
                    for btn in row
                    if (btn.get("data", {}).get("buttonText") or btn.get("data", {}).get("label") or "").strip()
                ]
                for row in inline_rows
            ]
        )

    if has_clear:
        return ReplyKeyboardRemove(remove_keyboard=True)

    if reply_rows:
        return ReplyKeyboardMarkup(
            keyboard=[
                [
                    KeyboardButton(
                        text=(btn.get("data", {}).get("buttonText") or btn.get("data", {}).get("label") or "").strip()
                    )
                    for btn in row
                    if (btn.get("data", {}).get("buttonText") or btn.get("data", {}).get("label") or "").strip()
                ]
                for row in reply_rows
            ],
            resize_keyboard=True,
        )

    return None


@app.post("/uploads/images")
async def upload_images(files: List[UploadFile] = File(...)) -> dict:
    urls: List[str] = []
    for upload in files:
        ext = os.path.splitext(upload.filename or "")[1].lower() or ".jpg"
        name = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(UPLOAD_DIR, name)
        content = await upload.read()
        with open(path, "wb") as file_obj:
            file_obj.write(content)
        urls.append(f"/uploads/{name}")
    return {"urls": urls}


app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


def collect_image_urls(flow: Flow, source_id: str) -> List[str]:
    nodes_by_id = {node.get("id"): node for node in flow.nodes}
    urls: List[str] = []
    for edge in flow.edges:
        if edge.get("source") != source_id:
            continue
        target_node = nodes_by_id.get(edge.get("target"))
        if not target_node:
            continue
        target_data = target_node.get("data", {})
        if target_data.get("kind") != "image":
            continue
        image_list = target_data.get("imageUrls") or []
        for item in image_list:
            if isinstance(item, str) and item.strip():
                urls.append(item.strip())
    return urls


def resolve_image_source(url: str):
    if not isinstance(url, str):
        return None
    cleaned = url.strip()
    if not cleaned:
        return None
    if cleaned.startswith("/uploads/"):
        filename = os.path.basename(cleaned)
        path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(path):
            return FSInputFile(path)
        return cleaned
    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        parsed = urlparse(cleaned)
        if parsed.hostname in ("localhost", "127.0.0.1"):
            filename = os.path.basename(parsed.path)
            path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(path):
                return FSInputFile(path)
        return cleaned
    path = os.path.join(UPLOAD_DIR, os.path.basename(cleaned))
    if os.path.exists(path):
        return FSInputFile(path)
    return cleaned


async def send_images(message: Message, urls: List[str], caption: str = "", reply_markup=None) -> bool:
    sources = [resolve_image_source(url) for url in urls]
    sources = [source for source in sources if source]
    if not sources:
        return False
    if len(sources) == 1:
        await message.answer_photo(sources[0], caption=caption or None, reply_markup=reply_markup)
        return True
    media = []
    for idx, source in enumerate(sources):
        if idx == 0 and caption:
            media.append(InputMediaPhoto(media=source, caption=caption))
        else:
            media.append(InputMediaPhoto(media=source))
    await message.answer_media_group(media)
    return True


async def send_content_node(flow: Flow, message: Message, target_node: dict) -> None:
    payload = target_node.get("data", {})
    kind = payload.get("kind")
    if kind == "image":
        urls = payload.get("imageUrls") or []
        reply_markup = build_reply_markup(flow, target_node.get("id") or "")
        await send_images(message, urls, reply_markup=reply_markup)
        return
    message_text = (payload.get("messageText") or "").strip()
    image_urls = collect_image_urls(flow, target_node.get("id") or "")
    reply_markup = build_reply_markup(flow, target_node.get("id") or "")
    if image_urls:
        sent = await send_images(message, image_urls, caption=message_text, reply_markup=reply_markup)
        if message_text and not sent:
            await message.answer(message_text, reply_markup=reply_markup)
        elif message_text and len(image_urls) > 1:
            await message.answer(message_text, reply_markup=reply_markup)
    else:
        if message_text:
            await message.answer(message_text, reply_markup=reply_markup)


async def send_targets_with_delay(flow: Flow, message: Message, targets: List[Tuple[dict, float]]) -> None:
    if not targets:
        return
    ordered = sorted(targets, key=lambda item: item[1])
    elapsed = 0.0
    for target_node, delay in ordered:
        wait_time = delay - elapsed
        if wait_time > 0:
            await asyncio.sleep(wait_time)
            elapsed = delay
        await send_content_node(flow, message, target_node)


async def run_bot_polling(bot: Bot) -> None:
    if not bot.token:
        return
    dispatcher = Dispatcher()
    async def handler(message: Message) -> None:
        if not message.text:
            return
        command = normalize_command(message.text)
        flow = FLOW_CACHE.get(bot.id) or bot.flow
        if command:
            command_node = find_command_node(flow, command)
            if command_node:
                targets = collect_content_targets_with_delay(flow, command_node.get("id") or "")
                await send_targets_with_delay(flow, message, targets)
            return
        reply_button = find_reply_button_by_text(flow, message.text)
        if reply_button:
            targets = collect_content_targets_with_delay(flow, reply_button.get("id") or "")
            await send_targets_with_delay(flow, message, targets)

    dispatcher.message()(handler)

    async def callback_handler(query: CallbackQuery) -> None:
        data = (query.data or "").strip()
        await query.answer()
        if not data:
            return
        if not query.message:
            return
        flow = FLOW_CACHE.get(bot.id) or bot.flow
        if data.startswith("btn:"):
            button_id = data[4:]
            targets = collect_content_targets_with_delay(flow, button_id)
            await send_targets_with_delay(flow, query.message, targets)
            return
        if data.startswith("/"):
            flow = FLOW_CACHE.get(bot.id) or bot.flow
            command = normalize_command(data)
            if command:
                command_node = find_command_node(flow, command)
                if command_node:
                    targets = collect_content_targets_with_delay(flow, command_node.get("id") or "")
                    await send_targets_with_delay(flow, query.message, targets)
                return
        await query.message.answer(data)

    dispatcher.callback_query()(callback_handler)

    stop_event = asyncio.Event()
    RUNNING_BOTS[bot.id] = {"task": asyncio.current_task(), "stop": stop_event}

    try:
        telegram_bot = TelegramBot(bot.token)
        await telegram_bot.delete_webhook(drop_pending_updates=True)
        await dispatcher.start_polling(telegram_bot, stop_event=stop_event)
    finally:
        await telegram_bot.session.close()
        RUNNING_BOTS.pop(bot.id, None)


async def stop_bot_task(bot_id: str) -> None:
    entry = RUNNING_BOTS.get(bot_id)
    if not entry:
        return
    stop_event = entry.get("stop")
    task = entry.get("task")
    if isinstance(stop_event, asyncio.Event):
        stop_event.set()
    if isinstance(task, asyncio.Task):
        try:
            await asyncio.wait_for(task, timeout=5)
        except asyncio.TimeoutError:
            task.cancel()
        except Exception:
            pass
    RUNNING_BOTS.pop(bot_id, None)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/bots", response_model=Bot)
def create_bot(payload: BotCreate) -> Bot:
    bot_id = str(uuid.uuid4())
    flow = Flow().model_dump()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO bots (id, name, token, status, flow) VALUES (?, ?, ?, ?, ?)",
            (bot_id, payload.name, payload.token, "stopped", json.dumps(flow)),
        )
        conn.commit()
    return get_bot_or_404(bot_id)


@app.get("/bots", response_model=List[Bot])
def list_bots() -> List[Bot]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM bots ORDER BY rowid DESC").fetchall()
    return [row_to_bot(row) for row in rows]


@app.get("/bots/{bot_id}", response_model=Bot)
def get_bot(bot_id: str) -> Bot:
    return get_bot_or_404(bot_id)


@app.patch("/bots/{bot_id}", response_model=Bot)
def update_bot(bot_id: str, payload: BotUpdate) -> Bot:
    bot = get_bot_or_404(bot_id)
    data = bot.model_dump()
    update = payload.model_dump(exclude_unset=True)
    data.update(update)
    updated = Bot(**data)
    update_bot_row(updated)
    return updated


@app.delete("/bots/{bot_id}")
def delete_bot(bot_id: str) -> dict:
    with get_connection() as conn:
        row = conn.execute("SELECT 1 FROM bots WHERE id = ?", (bot_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Bot not found")
        conn.execute("DELETE FROM bots WHERE id = ?", (bot_id,))
        conn.commit()
    asyncio.create_task(stop_bot_task(bot_id))
    return {"deleted": True}


@app.post("/bots/{bot_id}/flow", response_model=Bot)
async def save_flow(bot_id: str, flow: Flow) -> Bot:
    bot = get_bot_or_404(bot_id)
    updated = bot.model_copy(update={"flow": flow})
    update_bot_row(updated)
    FLOW_CACHE[bot_id] = flow
    return updated


@app.post("/bots/{bot_id}/start", response_model=Bot)
async def start_bot(bot_id: str) -> Bot:
    bot = get_bot_or_404(bot_id)
    if not bot.token:
        raise HTTPException(status_code=400, detail="Bot token is required")
    FLOW_CACHE[bot_id] = bot.flow
    if bot_id in RUNNING_BOTS:
        updated = bot.model_copy(update={"status": "running"})
        update_bot_row(updated)
        return updated
    await stop_bot_task(bot_id)
    updated = bot.model_copy(update={"status": "running"})
    update_bot_row(updated)
    asyncio.create_task(run_bot_polling(updated))
    return updated


@app.post("/bots/{bot_id}/stop", response_model=Bot)
async def stop_bot(bot_id: str) -> Bot:
    bot = get_bot_or_404(bot_id)
    await stop_bot_task(bot_id)
    updated = bot.model_copy(update={"status": "stopped"})
    update_bot_row(updated)
    return updated
