def normalize_output_key(value: str) -> str:
    key = (value or "").strip()
    if not key:
        return "command_arg"
    if key.startswith("{var.") and key.endswith("}"):
        key = key[5:-1].strip()
    if key.startswith("var."):
        key = key[4:].strip()
    return key or "command_arg"


def normalize_command(value: str) -> str:
    cleaned = (value or "").strip()
    if not cleaned:
        return ""
    if not cleaned.startswith("/"):
        cleaned = "/" + cleaned
    cleaned = cleaned.split()[0]
    cleaned = cleaned.split("@")[0]
    return cleaned


async def run(ctx):
    values = ctx.get("values") or {}
    command_filter = normalize_command(values.get("command") or "")
    output_key = normalize_output_key(values.get("outputKey") or "command_arg")
    default_value = values.get("defaultValue") or ""
    index_raw = values.get("index")
    try:
        index = int(index_raw) if index_raw is not None and str(index_raw).strip() != "" else 0
    except Exception:
        index = 0

    message = ctx.get("message")
    text = ""
    if message:
        text = (getattr(message, "text", None) or getattr(message, "caption", None) or "").strip()
    if not text.startswith("/"):
        return {"output": "false", "vars": {output_key: default_value}}

    parts = text.split()
    command = normalize_command(parts[0])
    if command_filter and command != command_filter:
        return {"output": "false", "vars": {output_key: default_value}}

    args = parts[1:]
    value = ""
    if -len(args) <= index < len(args):
        value = args[index]
    if not value:
        value = default_value

    output = "true" if value else "false"
    return {"output": output, "vars": {output_key: value}}
