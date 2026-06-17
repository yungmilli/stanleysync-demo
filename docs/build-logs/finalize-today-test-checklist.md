# Finalize Today Test Checklist

Date: 2026-05-11

## Launch

- [ ] Run `QUICK_LAUNCH/start-stanleysync.bat`.
- [ ] Confirm browser opens `http://localhost:3000/admin`.
- [ ] Confirm duplicate server protection opens the app if port 3000 is already running.

## Public Quote Intake

- [ ] Open `http://localhost:3000/quote`.
- [ ] Submit a General service quote.
- [ ] Submit an Auto repair quote.
- [ ] Submit a Calibration lab quote.
- [ ] Confirm each quote saves successfully.

## Admin Review

- [ ] Log in at `http://localhost:3000/login`.
- [ ] Open `Quotes`.
- [ ] Open a quote detail page.
- [ ] Save review fields.
- [ ] Add an internal note.

## Conversion

- [ ] Convert a general quote to a WorkFlow job.
- [ ] Open the generated WorkFlow job.
- [ ] Convert a calibration quote to a CalOps work order.
- [ ] Open the generated CalOps work order.
- [ ] Create or export a Work Order Draft handoff.

## Exports

- [ ] Download Quote PDF.
- [ ] Download WorkFlow work package PDF.
- [ ] Download calibration work package PDF.
- [ ] Download certificate PDF.
- [ ] Export calibration work order JSON from work order detail.
- [ ] Export calibration work order JSON from `Apps` → `CalOps` → `CalOps I/O`.

## Workspace And Modules

- [ ] Switch between General Service, Auto Repair, and Calibration Lab workspaces.
- [ ] Confirm CalOps menus are hidden for general business workspaces.
- [ ] Confirm CalOps module appears for the Calibration Lab workspace.
- [ ] Confirm `Apps` launcher only exposes enabled modules.

## Dashboard

- [ ] Confirm dashboard widgets render.
- [ ] Hide/show at least one widget.
- [ ] Change widget order.
- [ ] Save widget layout.
- [ ] Refresh and confirm preferences persist.

## Quick Launch Scripts

- [ ] `start-stanleysync.bat`
- [ ] `start-quoteflow.bat`
- [ ] `start-calops-mode.bat`
- [ ] `run-migrations.bat`
- [ ] `seed-database.bat`
- [ ] `open-project-folder.bat`

## Calibration Software Readiness

- [ ] Open `CalOps I/O`.
- [ ] Export calibration JSON package.
- [ ] Confirm JSON contains customer, contact, service, equipment, documentation, quote/work order references, dates, and status.
- [ ] Confirm no external calibration software is required.
