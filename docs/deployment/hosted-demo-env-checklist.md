# Hosted Demo Environment Checklist

Use this checklist before deploying StanleySync App as a hosted beta demo.

## Required

- [ ] `DATABASE_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `APP_BASE_URL`
- [ ] `DEMO_MODE=true`
- [ ] `PILOT_MODE=true`
- [ ] `ENABLE_LABS_MODULE=false`
- [ ] `ENABLE_PUBLIC_SIGNUP=false`
- [ ] `ADMIN_EMAIL`
- [ ] `ADMIN_PASSWORD_HASH` or a planned demo seed user strategy

## Optional Email

- [ ] `ADMIN_NOTIFICATION_EMAIL`
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `EMAIL_FROM`

## Optional AI

- [ ] `OPENAI_API_KEY`
- [ ] `OPENAI_MODEL`

## Demo Safety

- [ ] Demo user is active.
- [ ] Demo user cannot switch workspaces.
- [ ] Demo user cannot access system settings.
- [ ] StanleySync Labs is hidden or restricted.
- [ ] Public signup is disabled.
- [ ] Customer-facing docs contain only hosted-demo instructions.
