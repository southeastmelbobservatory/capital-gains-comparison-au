# Capital Gains Plan

## Meta
- Phase: Implementation
- Status: active
- Priority: high
- Due: TBD
- Blocked: none

## Goal
Build a React/Vite TypeScript calculator for Australian capital gains using the Budget 2026-27 CGT reforms: date-based current-rule treatment before 1 July 2027, inflation-indexed real gains from 1 July 2027, and the 30% minimum tax rule.

## Completed
- [x] Create isolated React/Vite TypeScript project scaffold
- [x] Install dependencies
- [x] Ground core CGT assumptions against ATO sources
- [x] Check ABS latest CPI release and identify quarterly Australia CPI in table 17
- [x] Download and verify the ABS table 17 XLSX source path

## Tasks
- [x] Define typed calculator inputs, outputs, and validation rules
- [x] Implement CGT calculation module for Budget 2026-27 discount/indexation transition rules
- [ ] Embed or generate the CPI dataset from verified ABS table 17 data
- [ ] Add a CPI update script with source metadata and repeatable output
- [x] Replace starter Vite UI with the single CGT calculator workflow
- [x] Show assumptions, source notes, and non-advice disclaimer in the UI
- [ ] Add focused test cases for the main tax-rule branches and CPI lookup behavior
- [x] Run lint/build checks and fix issues
- [x] Prepare a deployment-ready README with usage and data-refresh instructions
