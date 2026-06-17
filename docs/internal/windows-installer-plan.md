# StanleySync Windows Installer Plan

INTERNAL ONLY.

Developer setup and local installer experiment. Not for customers yet.

## Goal

Package StanleySync App as a Windows executable installer for first customer testing.

The installer should provide:

- Windows `.exe` installer
- Desktop shortcut
- Start Menu shortcut
- Local database initialization helper
- First-run setup wizard at `/admin/first-run`

## Dependencies

Target machine requirements:

- Windows 10 or newer
- Node.js LTS
- PostgreSQL
- A configured `.env` file
- Browser access to `http://localhost:3000`

Packaging machine requirements:

- Node.js LTS
- Inno Setup 6
- PowerShell

## Installer Files

Installer assets live in:

`scripts/installer/`

Files:

- `StanleySyncInstaller.iss`
- `build-windows-installer.ps1`
- `START_STANLEYSYNC_INSTALLED.bat`
- `INITIALIZE_LOCAL_DATABASE.bat`

## Build The Installer

From `StanleySync_Suite`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\installer\build-windows-installer.ps1
```

Expected output:

`release\StanleySync-App-Setup.exe`

If Inno Setup is not installed, the script still validates/builds the app and prints the missing installer dependency.

## Install Flow

1. Run `StanleySync-App-Setup.exe`.
2. Choose whether to create a desktop shortcut.
3. After install, optionally run `Initialize StanleySync Database`.
4. Confirm `.env` exists and points to the local PostgreSQL database.
5. Start StanleySync from Desktop or Start Menu.
6. Open `http://localhost:3000/admin/first-run`.
7. Complete company profile setup.

Recommended pilot `.env` flags:

```env
DEMO_MODE=true
PILOT_MODE=true
ENABLE_LABS_MODULE=false
ENABLE_PUBLIC_SIGNUP=false
```

## Local Database Initialization

The initializer runs:

```powershell
npm install
npm run db:generate
npm run prisma:validate
npm run db:deploy
npm run build:production
```

It does not seed demo data automatically.

Seed demo data only when intentionally preparing a demo environment:

```powershell
npm run db:seed
```

## Shortcuts

The installer creates:

- Start Menu: `StanleySync App`
- Start Menu: `Initialize StanleySync Database`
- Optional Desktop: `StanleySync App`

The app shortcut starts the production server and opens:

`http://localhost:3000`

## First-Run Wizard

Route:

`http://localhost:3000/admin/first-run`

Prompts for:

- Business Name
- Logo Upload
- Phone
- Email
- Address
- Invoice Terms
- Quote Terms

The saved workspace profile is used by:

- Quote PDFs
- Work order PDFs
- Invoice PDFs
- Email templates and future SMTP delivery

## Current Limitation

This installer packages the current local Next.js/PostgreSQL app. It is suitable for first customer testing on a controlled Windows machine. A fully silent commercial installer should later bundle or verify PostgreSQL and Node.js automatically.
