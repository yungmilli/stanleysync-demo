# Tester Package Plan

INTERNAL ONLY.

Developer setup and local installer experiment. Not for customers yet.

## Goal

Create a simple folder that can be handed to a beta tester or business owner without exposing unnecessary technical details.

Target folder:

```text
StanleySync Demo/
├── Start StanleySync.bat
├── Setup Guide.pdf
├── Login Info.pdf
└── StanleySync Files/
```

## Folder Contents

### Start StanleySync.bat

Purpose:

- Starts StanleySync
- Opens the browser to `http://localhost:3000`
- Keeps the command window open

This should point into:

`StanleySync Files/StanleySync_Suite`

### Setup Guide.pdf

Should explain:

- Install Node.js
- Install PostgreSQL
- Configure `.env`
- Run database initialization
- Start StanleySync
- Open the Welcome Screen

Keep this written for non-technical users.

### Login Info.pdf

Should include:

- Demo URL
- Demo login email
- Demo password
- What to test
- Where to submit feedback

Do not include production passwords.

### StanleySync Files/

Should contain:

- `StanleySync_Suite/`
- required package files
- docs
- scripts
- app source
- `.env.example`

Do not include:

- real secrets
- real customer data
- OneDrive copies
- temporary build logs
- large local caches unless needed

## Recommended Web-First Flow

Use hosted web demo first:

1. Send `/demo/start`.
2. Provide demo login separately.
3. Ask tester to submit `/demo/feedback`.

Use USB/local package second when:

- tester cannot access hosted demo
- a local Windows demo is required
- internet access is unreliable

## Current Limitation

This plan hides technical complexity from the tester, but the package still depends on a configured local database and Node.js runtime unless a future installer bundles those prerequisites.
