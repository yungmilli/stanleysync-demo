# Demo Login

Use these accounts only in local demo mode or controlled pilot mode.

## Demo Tester

- Email: `demo@stanleysync.app`
- Password: provided by StanleySync owner
- Role: Demo User
- Workspace: StanleySync Demo

Demo User can:

- Open dashboard
- View customers
- Create/review quotes
- View jobs
- View invoices
- Export allowed PDFs
- Submit pilot feedback

Demo User cannot:

- Switch workspaces
- Access StanleySync Labs
- Manage users
- Edit system settings
- Access internal admin controls

## Internal Owner/Admin

- System Owner: `owner@stanleysync.app`
- Admin: `admin@stanleysync.app`

Use owner/admin only for:

- First-run setup
- Users & Roles
- Pilot Checklist
- Settings
- Permission testing

## Pilot Mode Flags

Recommended web pilot settings:

```env
DEMO_MODE=true
PILOT_MODE=true
ENABLE_LABS_MODULE=false
ENABLE_PUBLIC_SIGNUP=false
```
