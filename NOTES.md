# Capital Gains Notes

Use this file for operator notes, decisions, blockers, and context.

## 2026-05-13 CGT Rule Change

- Official Budget 2026-27 page says the Government will replace the 50% CGT discount with an inflation-based discount and introduce a minimum 30% tax on gains from 1 July 2027.
- PM/Treasurer release says the reform applies prospectively, pre-start-date gains on eligible existing investments retain the 50% discount, and new builds can choose between current and new arrangements from 1 July 2027.
- Implementation decision: remove the old pre-1999 indexation comparison path. The calculator should now present one date-driven CGT calculation path, with explicit notes where policy detail remains subject to consultation.
- Current provisional transition assumption: apportion gains by days before/after 1 July 2027, apply the eligible 50% discount to the pre-reform portion, and apply CPI indexation plus the 30% minimum tax to the post-reform portion.
