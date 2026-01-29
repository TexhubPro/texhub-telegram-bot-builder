from __future__ import annotations

import asyncio
import json
import os
import sqlite3
import uuid
from typing import Dict, List, Optional, Tuple

from aiogram import Bot as TelegramBot
from aiogram import Dispatcher
from aiogram.filters import Command
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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


def extract_command_routes(flow: Flow) -> List[Tuple[str, str]]:
    nodes_by_id = {node.get("id"): node for node in flow.nodes}
    routes: List[Tuple[str, str]] = []
    for node in flow.nodes:
        data = node.get("data", {})
        if data.get("kind") != "command":
            continue
        command_text = (data.get("commandText") or "/start").strip()
        if not command_text:
            continue
        command = command_text.lstrip("/").strip().lower()
        if not command:
            continue
        message_node = None
        for edge in flow.edges:
            if edge.get("source") == node.get("id"):
                target_node = nodes_by_id.get(edge.get("target"))
                if not target_node:
                    continue
                target_data = target_node.get("data", {})
                if target_data.get("kind") == "message":
                    message_node = target_node
                    break
        if message_node:
            routes.append((command, message_node.get("id") or ""))
    return routes


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


def find_message_node_for_command(flow: Flow, command: str) -> Optional[dict]:
    command_lower = command.lower()
    routes = extract_command_routes(flow)
    nodes_by_id = {node.get("id"): node for node in flow.nodes}
    for cmd, message_id in routes:
        if cmd == command_lower:
            return nodes_by_id.get(message_id)
    return None


def find_message_target_from_source(flow: Flow, source_id: str) -> Optional[dict]:
    nodes_by_id = {node.get("id"): node for node in flow.nodes}
    for edge in flow.edges:
        if edge.get("source") != source_id:
            continue
        target_node = nodes_by_id.get(edge.get("target"))
        if not target_node:
            continue
        target_data = target_node.get("data", {})
        if target_data.get("kind") == "message":
            return target_node
    return None


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


def build_reply_markup(flow: Flow, message_node_id: str):
    nodes_by_id = {node.get("id"): node for node in flow.nodes}
    inline_buttons: List[Tuple[str, str]] = []
    reply_buttons: List[str] = []
    for edge in flow.edges:
        if edge.get("source") != message_node_id:
            continue
        target_node = nodes_by_id.get(edge.get("target"))
        if not target_node:
            continue
        target_data = target_node.get("data", {})
        kind = target_data.get("kind")
        button_text = (target_data.get("buttonText") or target_data.get("label") or "").strip()
        if not button_text:
            continue
        if kind == "message_button":
            inline_buttons.append((button_text, target_node.get("id") or ""))
        elif kind == "reply_button":
            reply_buttons.append(button_text)

    if inline_buttons:
        return InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text=text,
                        callback_data=f"btn:{node_id}"[:64],
                    )
                ]
                for text, node_id in inline_buttons
            ]
        )

    if reply_buttons:
        return ReplyKeyboardMarkup(
            keyboard=[[KeyboardButton(text=text)] for text in reply_buttons],
            resize_keyboard=True,
        )

    return None


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
            message_node = find_message_node_for_command(flow, command)
            if message_node:
                data = message_node.get("data", {})
                message_text = (data.get("messageText") or "").strip()
                if not message_text:
                    return
                reply_markup = build_reply_markup(flow, message_node.get("id") or "")
                await message.answer(message_text, reply_markup=reply_markup)
            return
        reply_button = find_reply_button_by_text(flow, message.text)
        if reply_button:
            target_message = find_message_target_from_source(flow, reply_button.get("id") or "")
            if target_message:
                payload = target_message.get("data", {})
                message_text = (payload.get("messageText") or "").strip()
                if message_text:
                    reply_markup = build_reply_markup(flow, target_message.get("id") or "")
                    await message.answer(message_text, reply_markup=reply_markup)

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
            target_message = find_message_target_from_source(flow, button_id)
            if target_message:
                payload = target_message.get("data", {})
                message_text = (payload.get("messageText") or "").strip()
                if message_text:
                    reply_markup = build_reply_markup(flow, target_message.get("id") or "")
                    await query.message.answer(message_text, reply_markup=reply_markup)
                    return
        if data.startswith("/"):
            flow = FLOW_CACHE.get(bot.id) or bot.flow
            command = normalize_command(data)
            if command:
                message_node = find_message_node_for_command(flow, command)
                if message_node:
                    payload = message_node.get("data", {})
                    message_text = (payload.get("messageText") or "").strip()
                    if message_text:
                        reply_markup = build_reply_markup(flow, message_node.get("id") or "")
                        await query.message.answer(message_text, reply_markup=reply_markup)
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
