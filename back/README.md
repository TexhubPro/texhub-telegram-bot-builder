# Back-end (Python)

This folder contains a minimal FastAPI backend for the Telegram bot builder.

## Setup

```bash
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
```

## Run

```bash
.\.venv\Scripts\uvicorn app.main:app --reload --port 8001
```

## Notes

- The API stores bots and flows in memory for now.
- Use `/bots/{id}/flow` to save node/edge graphs.
