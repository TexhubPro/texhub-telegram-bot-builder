def get_by_path(root, path: str):
    if root is None:
        return None
    if not path:
        return root
    parts = path.replace("[", ".[").split(".")
    current = root
    for part in parts:
        if part == "":
            continue
        if part.startswith("[") and part.endswith("]"):
            try:
                idx = int(part[1:-1])
            except Exception:
                return None
            if not isinstance(current, list) or idx >= len(current):
                return None
            current = current[idx]
            continue
        if isinstance(current, dict):
            current = current.get(part)
        else:
            return None
    return current


def render_item_template(template: str, item, index: int) -> str:
    if template is None:
        return ""
    text = str(template)
    if "{index}" in text:
        text = text.replace("{index}", str(index))
    if isinstance(item, dict):
        for key, value in item.items():
            text = text.replace("{item." + str(key) + "}", "" if value is None else str(value))
    if "{item}" in text:
        text = text.replace("{item}", "" if item is None else str(item))
    return text


def normalize_output_key(value: str) -> str:
    key = (value or "").strip()
    if not key:
        return "item"
    if key.startswith("{var.") and key.endswith("}"):
        key = key[5:-1].strip()
    if key.startswith("var."):
        key = key[4:].strip()
    return key or "item"


async def run(ctx):
    values = ctx.get("values") or {}
    source = (values.get("source") or "array").strip()
    mode = (values.get("mode") or "item").strip()
    index_raw = values.get("index")
    try:
        index = int(index_raw) if index_raw is not None and str(index_raw).strip() != "" else 0
    except Exception:
        index = 0
    field = (values.get("field") or "").strip()
    output_key = normalize_output_key(values.get("outputKey") or "item")
    join_template = values.get("joinTemplate") or ""
    join_separator = values.get("joinSeparator") if values.get("joinSeparator") is not None else "\\n"
    if join_separator == "\\n":
        join_separator = "\n"

    variables = ctx.get("variables") or {}
    payload = variables.get("payload")
    array_root = variables.get(source)
    if array_root is None and payload is not None:
        array_root = get_by_path(payload, source)
    if array_root is None:
        array_root = variables.get("array")

    if mode == "join":
        if isinstance(array_root, list) and array_root:
            lines = []
            for idx, item in enumerate(array_root):
                if join_template:
                    line = render_item_template(join_template, item, idx)
                elif field and isinstance(item, dict):
                    line = "" if item.get(field) is None else str(item.get(field))
                else:
                    line = "" if item is None else str(item)
                if line != "":
                    lines.append(line)
            joined = join_separator.join(lines)
        else:
            joined = ""
        result_vars = {output_key: joined}
        output = "true" if joined != "" else "false"
        return {"output": output, "vars": result_vars}

    item = None
    if isinstance(array_root, list) and array_root:
        if -len(array_root) <= index < len(array_root):
            item = array_root[index]
    if field and isinstance(item, dict):
        item_value = item.get(field)
    else:
        item_value = item

    result_vars = {output_key: "" if item_value is None else item_value}
    output = "true" if item_value is not None else "false"
    return {"output": output, "vars": result_vars}
