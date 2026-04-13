# Phase 7: Proxy Server & App Integration - Discussion Log

> **Audit trail only.**

**Date:** 2026-04-11
**Phase:** 07-proxy-server-app-integration
**Areas discussed:** Proxy deployment, API modification, Fallback behavior, Environment variables
**Mode:** Auto (--auto flag)

---

## Proxy Deployment Method

| Option | Description | Selected |
|--------|-------------|----------|
| Local setup + hosted docs | Clone and run locally, document Railway/Fly.io | ✓ |
| Deploy to Railway immediately | Full hosted deployment required | |
| Docker Compose only | Containerized local-only | |

**User's choice:** [auto] Local setup + hosted docs (recommended default)

## API Modification Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Configurable baseURL via createAnthropic | Single import swap + env var | ✓ |
| Custom fetch wrapper | Manual HTTP calls to proxy | |
| Separate proxy endpoint | New /api/proxy route | |

**User's choice:** [auto] Configurable baseURL (recommended default)

## Fallback Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Graceful fallback to direct Anthropic | No proxy URL = direct calls | ✓ |
| Require proxy always | Error if no proxy URL | |
| Try proxy then fallback | Attempt proxy, fall back on failure | |

**User's choice:** [auto] Graceful fallback (recommended default)

## Environment Variable Design

| Option | Description | Selected |
|--------|-------------|----------|
| Single ANTHROPIC_BASE_URL | One new env var, server-side only | ✓ |
| Multiple vars (URL + mode) | Separate toggle + URL | |
| Config file approach | JSON config for proxy settings | |

**User's choice:** [auto] Single ANTHROPIC_BASE_URL (recommended default)

## Claude's Discretion

- Docker Compose inclusion, health check endpoint, proxy config structure

## Deferred Ideas

None
