# Pilot Release Checklist

Run this checklist before sending StanleySync App to testers.

## Environment Flags

Recommended web pilot:

```env
DEMO_MODE=true
PILOT_MODE=true
ENABLE_LABS_MODULE=false
ENABLE_PUBLIC_SIGNUP=false
```

## Build Verification

- [ ] `npm install`
- [ ] `npm run db:generate`
- [ ] `npm run prisma:validate`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run start:production`

## Web Routes

- [ ] `/`
- [ ] `/quote`
- [ ] `/login`
- [ ] `/demo/start`
- [ ] `/demo/feedback`
- [ ] `/admin`
- [ ] `/admin/pilot-checklist`
- [ ] `/admin/quotes`
- [ ] `/admin/tickets`
- [ ] `/admin/invoices`

## Demo User Restrictions

- [ ] Demo user logs in.
- [ ] Demo user lands in StanleySync Demo.
- [ ] Demo user does not see workspace switcher.
- [ ] Demo user does not see Settings in the top nav.
- [ ] Demo user cannot access Users & Roles.
- [ ] Demo user cannot access StanleySync Labs.

## Workflow

- [ ] Public quote intake submits a quote.
- [ ] Admin can review quote detail.
- [ ] Admin can convert quote to job.
- [ ] Job comment can be added and appears in activity history.
- [ ] Job status, priority, assignee, cost, hours, and notes show unsaved changes until Save changes is clicked.
- [ ] Cancel changes reverts unsaved job edits.
- [ ] Invoice can be created.
- [ ] Payment link field saves.
- [ ] Invoice can be marked Sent.
- [ ] Invoice can be moved to Pending Payment and the linked job shows Invoice Pending.
- [ ] Invoice can be marked Paid and the linked job closes.
- [ ] Quote PDF exports.
- [ ] Work order PDF exports.
- [ ] Invoice PDF exports.
- [ ] Invoice PDF includes payment instructions and payment link when present.
- [ ] Feedback form submits.

## Final Demo Test Path

Quote -> Review -> Convert to Job -> Add Job Comment -> Change Job Status -> Create Invoice -> Add Payment Link -> Export Invoice PDF -> Mark Paid -> Confirm Job Closed.

## Local Installer / USB

- [ ] `START_STANLEYSYNC.bat` starts local dev mode.
- [ ] `scripts/local/production-build.bat` builds production app.
- [ ] `scripts/local/production-start.bat` starts production app.
- [ ] `scripts/installer/build-windows-installer.ps1` is documented.
- [ ] `docs/deployment/windows-installer-plan.md` is current.
- [ ] `docs/deployment/usb-demo-package-plan.md` is current.

## Release Decision

Ready for pilot when:

- Web demo routes pass.
- Demo restrictions pass.
- Quote to invoice workflow passes.
- PDFs open in browser.
- Tester docs are current.
