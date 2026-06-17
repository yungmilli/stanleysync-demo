# Actual Hosted Demo Deployment Steps

This is the runbook for getting a real StanleySync App demo URL online for testers.

Testers should only receive:

- Demo URL
- Login email
- Password

They should not receive local setup instructions.

## 1. Push Current Project To GitHub

From:

```text
C:\Users\mcsta\AppData\Local\StanleySyncApp
```

Recommended GitHub repo name:

```text
stanleysync-app
```

Commands:

```text
git init
git add README.md START_STANLEYSYNC.bat StanleySync_Suite
git commit -m "Prepare StanleySync hosted demo"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/stanleysync-app.git
git push -u origin main
```

Do not commit real secret files.

Confirm these are not committed:

- `.env`
- `.env.local`
- `.env.production`
- `node_modules`
- `.next`
- local package zips

## 2. Create Hosted PostgreSQL Database

Use Neon or Supabase.

### Neon

1. Open Neon.
2. Create a project named `stanleysync-demo`.
3. Create or select the default database.
4. Copy the PostgreSQL connection string.
5. Use the pooled connection string if Neon recommends it for serverless hosting.
6. Make sure the connection string includes SSL if Neon requires it.

### Supabase

1. Open Supabase.
2. Create a project named `stanleysync-demo`.
3. Open Project Settings -> Database.
4. Copy the connection string.
5. Use the pooled connection string for serverless hosting if available.
6. Replace the password placeholder in the copied string.

Set this as:

```text
DATABASE_URL
```

## 3. Create Vercel Project

1. Open Vercel.
2. Import the GitHub repo.
3. Select the project root directory:

```text
StanleySync_Suite
```

4. Framework preset:

```text
Next.js
```

5. Install command:

```text
npm install
```

6. Build command:

```text
npm run build
```

7. Output directory:

```text
Use Vercel default for Next.js
```

The included `vercel.json` also declares the install and build commands.

## 4. Set Vercel Environment Variables

Create production and preview environment variables:

```text
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://YOUR-DEMO-DOMAIN
APP_BASE_URL=https://YOUR-DEMO-DOMAIN
DEMO_MODE=true
PILOT_MODE=true
ENABLE_LABS_MODULE=false
ENABLE_PUBLIC_SIGNUP=false
ADMIN_EMAIL=admin@stanleysync.app
ADMIN_PASSWORD_HASH=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=StanleySync App <noreply@stanleysync.app>
```

Use `ADMIN_PASSWORD_HASH` instead of a plain password for hosted demo when possible.

If using a temporary seeded demo user strategy, seed demo data after migrations and send tester passwords privately.

## 5. Deploy

Push to GitHub after Vercel is connected.

Vercel should automatically build.

Expected build path:

```text
StanleySync_Suite
```

Expected build command:

```text
npm run build
```

Expected postinstall:

```text
npm --workspace @stanleysync/quoteflow run db:generate
```

## 6. Run Prisma Migrations

After the first deployment has environment variables attached, run:

```text
npm run db:deploy
```

This runs Prisma `migrate deploy`, not `migrate dev`.

Run it against the hosted database connection string.

If using Vercel CLI:

```text
vercel env pull .env.production.local
npm run db:deploy
```

Confirm the command is using the hosted `DATABASE_URL`.

## 7. Seed Demo Data

Seed only when:

```text
DEMO_MODE=true
```

Command:

```text
npm run seed:demo
```

The command refuses to seed if `DEMO_MODE` is not true.

## 8. Verify Demo Data

Run:

```text
npm run verify:demo
```

This checks:

- required hosted demo env vars
- demo flags
- demo user
- workspace records
- quote/job/invoice demo records

## 9. Test Deployed Link

Open:

```text
https://YOUR-DEMO-DOMAIN
```

Test:

- `/`
- `/demo/start`
- `/quote`
- `/login`
- demo login
- quote submission
- admin quote list
- quote to job
- invoice creation
- PDF export
- feedback page

## 10. Send Tester Link

Send:

```text
Demo URL: https://YOUR-DEMO-DOMAIN
Login: demo@stanleysync.app
Password: provided privately
Feedback link: https://YOUR-DEMO-DOMAIN/demo/feedback
```

## Localhost vs Public URL

`localhost` only works on the computer running StanleySync locally.

Testers must use the hosted URL:

```text
https://YOUR-DEMO-DOMAIN
```

Public customer intake links also require the hosted domain:

```text
https://YOUR-DEMO-DOMAIN/intake/company-name
```
