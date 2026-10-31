# CSV export for reports

## Objective
Let users export any report as CSV using the filters already applied.

## Spec (verbatim)
> "Add CSV export using the existing report filters. Large reports must stream, not load in memory."

## Scope and constraints
- Reuse `ReportQuery`; no new filter logic.
- Streaming response for reports over 10k rows.

## Tasks
- [x] T1: Add `/reports/:id/export.csv` endpoint — evidence a1f3c9e
- [x] T2: Map report columns to CSV headers — evidence 7b20e41
- [x] T3: Stream large result sets — evidence c88d01f
- [ ] T4: Respect the active date filter
- [ ] T5: Download button in the report toolbar
- [ ] T6: Update user docs

## Evidence
- T1–T3: `pytest tests/reports -q` green.

## Progress
3 of 6 tasks done. T4 in progress: failing test written (RED observed).

## Next step
Make the date filter test pass for T4.
