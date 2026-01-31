# Плагины для нод (интеграции)

Эта система позволяет добавлять свои ноды без правок основного кода.
Вы кладете папку плагина в `plugins/`, и ноды появятся в интерфейсе автоматически.

Важно:
- Файлы пишите в UTF‑8 (иначе русские символы будут ломаться).
- После добавления/изменения плагина перезапустите backend.

## 1) Структура папки плагина

```
plugins/
  my-plugin/
    plugin.json
    backend.py        (опционально, если нужен Python‑код)
    requirements.txt  (опционально)
```

## 2) plugin.json (минимальный пример)

```json
{
  "id": "chatgpt",
  "name": "ChatGPT",
  "version": "1.0.0",
  "description": "Ответы ChatGPT",
  "backend": {
    "module": "backend.py",
    "handler": "run"
  },
  "nodes": [
    {
      "kind": "plugin_chatgpt",
      "title": "ChatGPT",
      "subtitle": "Сгенерировать ответ",
      "group": "Интеграции",
      "color": "#E0F2FE",
      "inputs": [
        { "key": "prompt", "label": "Промпт", "type": "textarea", "placeholder": "Например: Привет, {text}" }
      ],
      "outputs": ["true", "false"]
    }
  ]
}
```

### Поля ноды
- `kind` — уникальный ключ ноды (обязателен).
- `title` — название ноды.
- `subtitle` — подпись (опционально).
- `group` — группа в сайдбаре (опционально).
- `color` — цвет карточки (опционально).
- `inputs` — поля для редактирования в правой панели.
- `outputs` — список выходов (если 2 значения, появятся 2 коннектора).
- `noInput` — если `true`, у ноды не будет входного коннектора.

### Типы полей (`inputs[].type`)
- `text`
- `textarea`
- `number`
- `select`
- `checkbox`

Для `select` используйте:
```json
{
  "key": "mode",
  "label": "Режим",
  "type": "select",
  "options": [
    { "value": "fast", "label": "Быстро" },
    { "value": "quality", "label": "Качество" }
  ]
}
```

## 3) backend.py (пример обработчика)

```python
async def run(ctx):
    # ctx содержит:
    # ctx["values"]      -> значения полей из UI
    # ctx["message"]     -> входящее сообщение (если есть)
    # ctx["bot"]         -> объект aiogram Bot
    # ctx["render"]      -> функция для шаблонов
    # ctx["variables"]   -> переменные из предыдущих плагинов
    # ctx["row"]         -> строка из file_search (если есть)

    prompt = ctx["values"].get("prompt", "")
    # можно использовать шаблоны:
    prompt = ctx["render"](prompt)

    # пример: записываем результат в переменные
    return {
        "output": "true",     # какой выход использовать (sourceHandle)
        "vars": {
            "gpt_text": prompt
        }
    }
```

### Доступные переменные в шаблоне
Можно использовать в тексте сообщений и в `ctx["render"]`:

- `{text}`, `{name}`, `{first_name}`, `{last_name}`, `{username}`, `{full_name}`
- `{chat_id}`, `{message_id}`
- `{photo_id}`, `{video_id}`, `{audio_id}`, `{voice_id}`, `{document_id}`, `{sticker_id}`
- `{contact_phone}`, `{location_lat}`, `{location_lon}`
- `{row[колонка]}` (из file_search)
- `{var.key}` — переменные плагина (из `vars`)

## 4) requirements.txt (опционально)
Если плагину нужны библиотеки, добавьте `requirements.txt` в папку плагина
и установите зависимости:

```
pip install -r plugins/my-plugin/requirements.txt
```

## 5) Как плагин попадает во фронтенд
Фронтенд читает список плагинов через endpoint:

```
GET /plugins
```

Если ноды не появились:
1) проверьте, что `plugin.json` валиден (JSON без ошибок),
2) перезапустите backend,
3) убедитесь, что backend видит папку `plugins/`.
