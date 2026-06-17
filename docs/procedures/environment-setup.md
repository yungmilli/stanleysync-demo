# Environment Setup

StanleySync reads environment variables from the QuoteFlow app runtime. For local development, copy:

```powershell
Copy-Item .env.example apps\quoteflow\.env.local
```

For cloud deployment, configure the same variables in the hosting provider.

## Required

- `DATABASE_URL`: PostgreSQL connection string. Include `?schema=public` unless your provider requires another schema.
- `NEXTAUTH_SECRET`: long random secret for NextAuth session signing.
- `NEXTAUTH_URL`: public app URL, for example `https://demo.example.com`.
- `APP_BASE_URL`: public app URL used by exports and links.
- `DEMO_MODE`: `true` for seeded demo environments, `false` for production/customer environments.
- `ADMIN_EMAIL`: fallback admin email when no database user exists.
- `ADMIN_PASSWORD_HASH` or `ADMIN_PASSWORD`: use `ADMIN_PASSWORD_HASH` in production. Avoid plaintext `ADMIN_PASSWORD` outside local/demo.

## Optional

- `OPENAI_API_KEY`: enables AI-assisted prompt generation. Without it, deterministic fallback logic still works.
- `OPENAI_MODEL`: model name for OpenAI prompt generation.
- `ADMIN_NOTIFICATION_EMAIL`: where admin quote notifications should go.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: SMTP provider settings.
- `EMAIL_FROM`: sender label/address for outgoing emails.

## Demo Mode

When `DEMO_MODE=true`, the admin shell shows a Demo Mode badge and seeded demo users/data are acceptable.

When `DEMO_MODE=false`, the admin shell hides the badge and warns if default local demo accounts still exist:

- `admin@stanleysync.app`
- `manager@stanleysync.app`
- `tech@stanleysync.app`
- `sales@stanleysync.app`

Before a customer-facing production deployment, disable or rotate these users.

## Secret Guidance

Do not place real secrets in docs, commits, screenshots, or shared logs. Use the hosting provider secret manager.
