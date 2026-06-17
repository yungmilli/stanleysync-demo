# Post-Deploy Smoke Test

Run this after StanleySync App is deployed to the hosted demo URL.

Hosted URL:

```text
https://YOUR-DEMO-DOMAIN
```

## Public Pages

- [ ] `/` loads.
- [ ] `/demo/start` loads.
- [ ] `/quote` loads.
- [ ] `/login` loads.
- [ ] `/demo/feedback` loads.

## Login

- [ ] Demo user can log in.
- [ ] Demo user lands in StanleySync Demo.
- [ ] Demo user cannot switch workspaces.
- [ ] Demo user cannot access StanleySync Labs.
- [ ] Demo user cannot access system settings.

## Quote Workflow

- [ ] Quote submission works.
- [ ] Submitted quote appears in admin quote list.
- [ ] Quote detail loads.
- [ ] Quote can be converted to a job.

## Job Workflow

- [ ] Job list loads.
- [ ] Job detail loads.
- [ ] Job status can update.
- [ ] Job note can be added.
- [ ] Job can be invoiced.

## Invoice Workflow

- [ ] Invoice list loads.
- [ ] Invoice detail loads.
- [ ] Payment link field saves.
- [ ] Invoice can be marked sent.
- [ ] Invoice can be marked paid.

## PDFs

- [ ] Quote PDF exports.
- [ ] Work order PDF exports.
- [ ] Invoice PDF exports.

## Feedback

- [ ] Feedback page submits.
- [ ] Feedback entry is visible to owner/admin or logged as expected.

## Final Tester Link

Send testers:

```text
https://YOUR-DEMO-DOMAIN
```

Do not send `localhost` links.
