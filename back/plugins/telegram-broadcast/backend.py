import os
import sqlite3
import asyncio


def get_db_path():
    return os.getenv("BOT_DB", "bot_builder.db")


def list_user_ids(bot_id: str):
    db_path = get_db_path()
    if not os.path.exists(db_path):
        return []
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            "SELECT user_id FROM user_status WHERE bot_id = ? ORDER BY user_id ASC",
            (bot_id,),
        ).fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()


def list_user_entries(bot_id: str):
    db_path = get_db_path()
    if not os.path.exists(db_path):
        return []
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            "SELECT user_id, username, first_name, last_name, status FROM user_status WHERE bot_id = ?",
            (bot_id,),
        ).fetchall()
        return [
            {
                "id": row[0],
                "username": row[1],
                "first_name": row[2],
                "last_name": row[3],
                "status": row[4],
            }
            for row in rows
        ]
    finally:
        conn.close()


def find_message_text(ctx):
    flow = ctx.get("flow")
    node = ctx.get("node") or {}
    if not flow or not node:
        return ""
    node_id = node.get("id")
    if not node_id:
        return ""
    nodes_by_id = {n.get("id"): n for n in (flow.nodes or [])}
    for edge in flow.edges or []:
        if edge.get("source") != node_id:
            continue
        target = nodes_by_id.get(edge.get("target"))
        if not target:
            continue
        data = target.get("data") or {}
        if data.get("kind") == "message":
            return data.get("messageText") or ""
    return ""


def find_condition_node(ctx):
    flow = ctx.get("flow")
    node = ctx.get("node") or {}
    if not flow or not node:
        return None
    node_id = node.get("id")
    if not node_id:
        return None
    nodes_by_id = {n.get("id"): n for n in (flow.nodes or [])}
    for edge in flow.edges or []:
        if edge.get("target") != node_id:
            continue
        source = nodes_by_id.get(edge.get("source"))
        if not source:
            continue
        if (source.get("data") or {}).get("kind") == "condition":
            return source
    return None


def match_status_condition(condition_node, entry):
    data = condition_node.get("data") or {}
    condition_type = (data.get("conditionType") or "").strip()
    if condition_type != "status":
        return True
    condition_text = (data.get("conditionText") or "").strip().lower()
    if not condition_text:
        return False
    status_value = (entry.get("status") or "").strip().lower()
    return status_value == condition_text


def render_for_entry(text, entry):
    first_name = entry.get("first_name") or ""
    last_name = entry.get("last_name") or ""
    username = entry.get("username") or ""
    chat_id = entry.get("id") or ""
    full_name = " ".join(part for part in [first_name, last_name] if part)
    result = text
    replacements = {
        "{name}": first_name,
        "{first_name}": first_name,
        "{last_name}": last_name,
        "{username}": f"@{username}" if username else "",
        "{full_name}": full_name,
        "{chat_id}": str(chat_id),
    }
    for key, value in replacements.items():
        result = result.replace(key, value)
    return result


async def run(ctx):
    bot = ctx.get("bot")
    bot_id = ctx.get("bot_id")
    if not bot or not bot_id:
        return {"output": "out", "vars": {"sent": 0, "failed": 0}}

    text = find_message_text(ctx)
    if not text:
        return {"output": "out", "vars": {"sent": 0, "failed": 0}}

    entries = list_user_entries(str(bot_id))
    if not entries:
        return {"output": "out", "vars": {"sent": 0, "failed": 0}}

    condition_node = find_condition_node(ctx)

    sent = 0
    failed = 0
    for entry in entries:
        chat_id = entry.get("id")
        if not chat_id:
            continue
        if condition_node and not match_status_condition(condition_node, entry):
            continue
        try:
            rendered = render_for_entry(text, entry)
            if rendered:
                await bot.send_message(chat_id, rendered)
                sent += 1
        except Exception:
            failed += 1
        await asyncio.sleep(0)

    return {"output": "out", "vars": {"sent": sent, "failed": failed}}
