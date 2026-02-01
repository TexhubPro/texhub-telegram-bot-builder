import os
import sqlite3


def get_db_path():
    return os.getenv("BOT_DB", "bot_builder.db")


def ensure_table(conn):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS plugin_counter (
            bot_id TEXT NOT NULL,
            counter_key TEXT NOT NULL,
            counter_value INTEGER NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (bot_id, counter_key)
        )
        """
    )


def get_value(conn, bot_id: str, key: str):
    row = conn.execute(
        "SELECT counter_value FROM plugin_counter WHERE bot_id = ? AND counter_key = ?",
        (bot_id, key),
    ).fetchone()
    return int(row[0]) if row else None


def set_value(conn, bot_id: str, key: str, value: int):
    conn.execute(
        """
        INSERT INTO plugin_counter (bot_id, counter_key, counter_value)
        VALUES (?, ?, ?)
        ON CONFLICT(bot_id, counter_key) DO UPDATE SET
            counter_value = excluded.counter_value,
            updated_at = CURRENT_TIMESTAMP
        """,
        (bot_id, key, int(value)),
    )


async def run(ctx):
    bot_id = ctx.get("bot_id")
    if not bot_id:
        return {"output": "false", "vars": {"counter": 0}}

    values = ctx.get("values") or {}
    key = (values.get("key") or "").strip()
    action = (values.get("action") or "inc").strip()

    try:
        start_value = int(values.get("start") or 0)
    except Exception:
        start_value = 0
    try:
        step = int(values.get("step") or 1)
    except Exception:
        step = 1
    compare_op = (values.get("compareOp") or "none").strip()
    try:
        compare_value = int(values.get("compareValue") or 0)
    except Exception:
        compare_value = 0

    if not key:
        return {"output": "false", "vars": {"counter": 0}}

    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    try:
        ensure_table(conn)
        current = get_value(conn, str(bot_id), key)
        if current is None:
            current = start_value
        if action == "init":
            current = start_value
        elif action == "set":
            current = start_value
        elif action == "inc":
            current = current + step
        elif action == "dec":
            current = current - step
        elif action == "reset":
            current = 0
        set_value(conn, str(bot_id), key, current)
        conn.commit()
    finally:
        conn.close()

    passed = True
    if compare_op == "eq":
        passed = current == compare_value
    elif compare_op == "gte":
        passed = current >= compare_value
    elif compare_op == "lt":
        passed = current < compare_value

    output = "true" if passed else "false"
    return {"output": output, "vars": {"counter": current}}
