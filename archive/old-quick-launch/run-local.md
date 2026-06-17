# Run StanleySync Locally

Use the local app copy at:

`C:\Users\mcsta\AppData\Local\StanleySyncApp`

The application suite is organized under:

`C:\Users\mcsta\AppData\Local\StanleySyncApp\StanleySync_Suite`

## Fastest Windows path

1. Open `C:\Users\mcsta\AppData\Local\StanleySyncApp\QUICK_LAUNCH`
2. Run `start-stanleysync.bat`, `start-quoteflow.bat`, or `start-calops-mode.bat`
3. The selected localhost page opens automatically.

## Database helpers

- Run migrations:
  `QUICK_LAUNCH/run-migrations.bat`
- Seed sample data:
  `QUICK_LAUNCH/seed-database.bat`

## Root command equivalents

```powershell
npm.cmd run dev
npm.cmd run db:generate
npm.cmd run db:seed
npm.cmd run build
```

Run root commands from `StanleySync_Suite`. Those wrapper commands forward into `apps/quoteflow`.
