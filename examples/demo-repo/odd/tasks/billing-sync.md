# Billing sync with Stripe

## Objective
Keep invoices in sync with Stripe subscription changes.

## Tasks
- [x] T1: Webhook receiver with signature check — evidence 4e19ab2
- [x] T2: Persist subscription events — evidence 90cd3f1
- [ ] T3: Prorate mid-cycle plan changes
- [ ] T4: Backfill job for existing customers
- [ ] T5: Alert on failed syncs

## Progress
Blocked: needs your decision on proration policy (charge now vs. next invoice).

## Next step
Waiting for the user to choose the proration policy before T3.
