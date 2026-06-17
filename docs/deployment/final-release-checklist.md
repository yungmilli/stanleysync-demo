# StanleySync Final Release Checklist

Run this before sending StanleySync App to a tester or first customer.

## Build Verification

- [ ] `npm install`
- [ ] `npm run db:generate`
- [ ] `npm run prisma:validate`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`

## App Smoke Test

- [ ] Login works.
- [ ] First-run setup opens at `/admin/first-run`.
- [ ] Company branding saves.
- [ ] Settings save.
- [ ] User creation works.
- [ ] User edit works.
- [ ] User disable/reactivate works.
- [ ] Temporary password reset works.
- [ ] Role assignment works.
- [ ] Workspace assignment works.
- [ ] Quote intake works.
- [ ] Quote appears in admin.
- [ ] Quote PDF exports.
- [ ] Quote converts to job / work order.
- [ ] Work order PDF exports.
- [ ] Job status updates.
- [ ] Invoice creation works.
- [ ] Payment link saves.
- [ ] Payment link copies.
- [ ] Invoice PDF exports with payment instructions.
- [ ] Demo mode badge appears when `DEMO_MODE=true`.
- [ ] Demo user cannot access owner/admin controls.

## Installer Verification

- [ ] Inno Setup 6 installed on packaging machine.
- [ ] `scripts\installer\build-windows-installer.ps1` completes.
- [ ] `release\StanleySync-App-Setup.exe` exists.
- [ ] Installer creates Desktop shortcut when selected.
- [ ] Installer creates Start Menu shortcut.
- [ ] `Initialize StanleySync Database` runs against configured `.env`.
- [ ] Production server starts from installed shortcut.
- [ ] Browser opens `http://localhost:3000`.

## Release Decision

Do not send to customers if any of these fail:

- Login
- Database initialization
- Quote submission
- Invoice creation
- PDF export
- User role restrictions
