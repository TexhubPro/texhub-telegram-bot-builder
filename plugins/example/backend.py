async def run(ctx):
    text = ctx["values"].get("text", "")
    rendered = ctx["render"](text)
    if rendered:
        return {"output": "true", "vars": {"example_text": rendered}}
    return {"output": "false", "vars": {"example_text": ""}}
