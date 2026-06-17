# Local Setup

## Primary App

The live app is:

`apps/quoteflow`

## Fast Start

From the repo root:

```powershell
npm.cmd run dev
```

Or use:

`QUICK_LAUNCH/start-quoteflow.bat`

## Direct App Commands

```powershell
cd apps\quoteflow
npm.cmd install
npm.cmd run db:generate
npm.cmd run dev
```

## Environment Files

Keep them in:

- `apps/quoteflow/.env`
- `apps/quoteflow/.env.local`
