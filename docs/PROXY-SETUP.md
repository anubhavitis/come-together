# Proxy Setup Guide

Route AI requests through [claude-code-proxy](https://github.com/fuergaosi233/claude-code-proxy) to use alternative LLM backends (OpenAI, Azure, Ollama, DeepSeek, etc.) without changing application code.

## Overview

```
App (api/chat.ts)                claude-code-proxy              Backend LLM
     |                                |                            |
     |-- POST /v1/messages ---------->|                            |
     |   (Anthropic Claude format)    |                            |
     |                                |-- POST /v1/chat/completions ->
     |                                |   (OpenAI format)          |
     |                                |<-- OpenAI response --------|
     |<-- Claude-format response -----|                            |
```

The proxy accepts requests in **Anthropic Claude API format** and translates them to **OpenAI-compatible format** before forwarding. Responses are converted back to Claude format. The app never knows it is talking to a non-Anthropic backend.

**When you need this:** You want to use a non-Anthropic model (GPT-4o, Llama, Mistral, etc.) as the AI backend.

**When you do NOT need this:** If you are using Anthropic directly, skip the proxy entirely. It adds latency (50-200ms) with no benefit.

## Quick Start (Local Development)

### 1. Clone the proxy

```bash
git clone https://github.com/fuergaosi233/claude-code-proxy.git
cd claude-code-proxy
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

Or with a virtual environment:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure proxy environment variables

Create a `.env` file in the proxy directory:

```bash
# Required: API key for the backend provider
OPENAI_API_KEY=sk-your-backend-api-key

# Required: Backend endpoint URL
OPENAI_BASE_URL=https://api.openai.com/v1

# Optional: Model routing (proxy maps Claude model names to these)
SMALL_MODEL=gpt-4o-mini    # Used when app requests a "haiku" model
MIDDLE_MODEL=gpt-4o        # Used when app requests a "sonnet" model
BIG_MODEL=gpt-4o           # Used when app requests an "opus" model

# Optional: Shared secret for client authentication
# If set, the app must send this as ANTHROPIC_API_KEY
ANTHROPIC_API_KEY=your-shared-secret

# Optional: Server port (default: 8082)
PORT=8082
```

### 4. Run the proxy

```bash
uvicorn app:app --host 0.0.0.0 --port 8082
```

### 5. Verify the proxy is running

```bash
curl http://localhost:8082/health
```

You should get a 200 response. You can also check connectivity to the backend:

```bash
curl http://localhost:8082/test-connection
```

## Environment Variables (Proxy Server)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | API key for the backend LLM provider |
| `OPENAI_BASE_URL` | Yes | - | Backend endpoint URL (e.g., `https://api.openai.com/v1`) |
| `SMALL_MODEL` | No | `gpt-4o-mini` | Model used when the app requests a "haiku" model |
| `MIDDLE_MODEL` | No | `gpt-4o` | Model used when the app requests a "sonnet" model |
| `BIG_MODEL` | No | `gpt-4o` | Model used when the app requests an "opus" model |
| `ANTHROPIC_API_KEY` | No | - | Shared secret for client auth validation. If unset, proxy accepts any key |
| `PORT` | No | `8082` | Server port |

## Connecting the App

Once the proxy is running, point the app at it:

1. In your app's `.env` file, set:

```bash
ANTHROPIC_BASE_URL=http://localhost:8082/v1
```

If you configured `ANTHROPIC_API_KEY` on the proxy, set the same value in the app's env:

```bash
ANTHROPIC_API_KEY=your-shared-secret
```

2. Restart the dev server:

```bash
bun dev
```

3. Start a Phase 1 conversation and confirm the AI responds. Check the proxy terminal for request logs to verify traffic is flowing through.

When `ANTHROPIC_BASE_URL` is unset (or removed), the app falls back to direct Anthropic API calls with no behavior change.

## Production Deployment

The proxy is a Python FastAPI server. It needs persistent hosting (not a serverless function).

### Railway

```bash
# From the claude-code-proxy directory
railway login
railway init
railway up
```

Set `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `SMALL_MODEL` as Railway environment variables. Use the Railway-provided URL as `ANTHROPIC_BASE_URL` in your app's Vercel environment.

### Fly.io

```bash
fly launch
fly secrets set OPENAI_API_KEY=sk-... OPENAI_BASE_URL=https://api.openai.com/v1 SMALL_MODEL=gpt-4o-mini
fly deploy
```

Use the Fly.io-provided URL (e.g., `https://your-app.fly.dev/v1`) as `ANTHROPIC_BASE_URL`.

## Troubleshooting

**Proxy unreachable (connection refused)**
- Verify the proxy is running: `curl http://localhost:8082/health`
- Check `ANTHROPIC_BASE_URL` includes the `/v1` path suffix
- Check firewall or network settings if hosted remotely

**Authentication error (401/403)**
- If the proxy has `ANTHROPIC_API_KEY` set, the app must send the same key
- Ensure both the proxy and the app `.env` have matching `ANTHROPIC_API_KEY` values

**Wrong model or unexpected responses**
- Check `SMALL_MODEL` on the proxy. The app sends `claude-3-5-haiku-20241022` and the proxy maps "haiku" to `SMALL_MODEL`
- Verify `OPENAI_BASE_URL` points to the correct backend

**Score extraction issues**
- The `<!--SCORES:...-->` blocks in system prompts rely on the model following precise output formatting
- Non-Claude models may not follow these instructions as reliably
- Check AI responses for missing or malformed score blocks

## Important Notes

- The proxy converts Claude API format to OpenAI format. If your backend IS Anthropic, the proxy is unnecessary and adds 50-200ms latency per request.
- Model routing is string-based: the proxy checks if the model name contains "haiku", "sonnet", or "opus" and maps accordingly.
- Score extraction (`<!--SCORES:...-->`) depends on the backend model following system prompt instructions precisely. Results may vary with non-Claude models.
- The proxy does not persist any data. All conversation state remains in the app and Supabase.
