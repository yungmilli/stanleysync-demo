# StanleySync App USB Demo Package Plan

INTERNAL ONLY.

Developer setup and local installer experiment. Not for customers yet.

## Goal

Prepare a local demo package that can be copied to a Windows machine for tester review.

## Required Install Dependencies

The target machine needs:

- Windows 10/11
- Node.js compatible with Next.js 16
- npm
- PostgreSQL
- A configured `.env` file
- Port 3000 available

## Folder Layout On USB

Include:

- `README.md`
- `START_STANLEYSYNC.bat`
- `StanleySync_Suite/`

Inside `StanleySync_Suite/`, include:

- `apps/`
- `shared/`
- `docs/`
- `scripts/`
- `database/`
- `prompts/`
- `package.json`
- `package-lock.json`
- `.env.example`
- `AGENTS.md`
- required config files

Do not include:

- Real production secrets
- Customer data
- Personal files
- OneDrive copies
- Unneeded old quick-launch scripts at the root
- Large temporary build logs unless needed for troubleshooting

## Environment File

Create `.env` from `.env.example`.

Set:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL=http://localhost:3000`
- `APP_BASE_URL=http://localhost:3000`
- `DEMO_MODE=true`
- `PILOT_MODE=true`
- `ENABLE_LABS_MODULE=false`
- `ENABLE_PUBLIC_SIGNUP=false`
- `ADMIN_EMAIL=admin@stanleysync.app`
- demo password or password hash for local testing

## Database Setup

For a clean demo machine:

1. Install PostgreSQL.
2. Create a local StanleySync database.
3. Set `DATABASE_URL`.
4. Run migrations only after confirming the database is empty or backed up.
5. Run the seed script only for demo mode.

## Launch

From:

`C:\Users\mcsta\AppData\Local\StanleySyncApp`

Double-click:

`START_STANLEYSYNC.bat`

The app should open at:

`http://localhost:3000`

Login:

`http://localhost:3000/login`

## Demo Accounts

- `admin@stanleysync.app`
- `demo@stanleysync.app`
- Local demo password: `Stanley123!`

## Known Limitations

- This is not a signed Windows installer yet.
- PostgreSQL setup is still manual.
- Demo seed data must not be used as production customer data.
- Email delivery requires SMTP configuration.
- Upload storage is local until production storage is configured.
- StanleySync Labs is hidden or shown as Coming Soon for demo customers.
