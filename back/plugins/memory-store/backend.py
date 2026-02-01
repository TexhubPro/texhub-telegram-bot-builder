import os
import sqlite3


def get_db_path():
    return os.getenv("BOT_DB", "bot_builder.db")


def ensure_table(conn):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS plugin_memory (
            bot_id TEXT NOT NULL,
            mem_key TEXT NOT NULL,
            mem_value TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (bot_id, mem_key)
        )
        """
    )


def get_value(conn, bot_id: str, key: str):
    row = conn.execute(
        "SELECT mem_value FROM plugin_memory WHERE bot_id = ? AND mem_key = ?",
        (bot_id, key),
    ).fetchone()
    return row[0] if row else ""


def set_value(conn, bot_id: str, key: str, value: str):
    conn.execute(
        """
        INSERT INTO plugin_memory (bot_id, mem_key, mem_value)
        VALUES (?, ?, ?)
        ON CONFLICT(bot_id, mem_key) DO UPDATE SET
            mem_value = excluded.mem_value,
            updated_at = CURRENT_TIMESTAMP
        """,
        (bot_id, key, value),
    )


def clear_value(conn, bot_id: str, key: str):
    conn.execute(
        "DELETE FROM plugin_memory WHERE bot_id = ? AND mem_key = ?",
        (bot_id, key),
    )


async def run(ctx):
    bot_id = ctx.get("bot_id")
    if not bot_id:
        return {"output": "false", "vars": {"memory": ""}}

    values = ctx.get("values") or {}
    key = (values.get("key") or "").strip()
    action = (values.get("action") or "set").strip()
    value_raw = values.get("value") or ""
    compare_op = (values.get("compareOp") or "none").strip()
    compare_value = values.get("compareValue") or ""

    if not key:
        return {"output": "false", "vars": {"memory": ""}}

    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    try:
        ensure_table(conn)
        if action == "set":
            rendered = ctx["render"](value_raw)
            set_value(conn, str(bot_id), key, rendered)
            memory_value = rendered
        elif action == "append":
            current = get_value(conn, str(bot_id), key)
            rendered = ctx["render"](value_raw)
            next_value = (current or "") + rendered
            set_value(conn, str(bot_id), key, next_value)
            memory_value = next_value
        elif action == "clear":
            clear_value(conn, str(bot_id), key)
            memory_value = ""
        else:
            memory_value = get_value(conn, str(bot_id), key)
        conn.commit()
    finally:
        conn.close()

    passed = True
    if compare_op == "eq":
        passed = memory_value == str(compare_value)
    elif compare_op == "contains":
        passed = str(compare_value) in (memory_value or "")

    output = "true" if passed else "false"
    return {"output": output, "vars": {"memory": memory_value}}
