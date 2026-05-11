# Promo Code "Apply to All" Audience Restriction — summit-admin Spec

Created: 2026-05-11
Author: casey@caseylocker.com
Status: PENDING
Type: Change Request (UI copy + admin clarity)
ClickUp: [86b9vrpxp](https://app.clickup.com/t/86b9vrpxp)
Parent feature: [86b952pgc](https://app.clickup.com/t/86b952pgc) — Promo Codes for Early Registration
Parent feature plan (local working doc): `docs/superpowers/plans/2026-04-21-promo-codes-for-early-registration-access.md`
API counterpart SDS: `summit-api/doc/promo-code-apply-to-all-audience-restriction.md`

## Summary

**Goal:** Update the "Apply to all Ticket Types" checkbox copy in the discount-code editor so it accurately reflects the (now stricter) backend behavior: the implicit sweep only covers ticket types with `Audience = All`. Add helper text that tells the admin how to associate non-All-audience ticket types (WithInvitation, WithoutInvitation, WithPromoCode) — they must be added explicitly via the picker after saving.

**Why:** The backend has been tightened (see API SDS) so an empty `allowed_ticket_types` collection no longer means "apply to every ticket type, regardless of audience." Without a label/helper update, admins will keep ticking the box expecting the old behavior and be surprised that `WithoutInvitation`/`WithInvitation`/`WithPromoCode` ticket types are not covered. Parent feature SDS Resolved Decision #8 — _"audience controls visibility, type controls access"_ — depends on the admin understanding this distinction.

**Approach:** Pure i18n + minor JSX. Two label changes and one helper-text row in `discount-base-pc-form.js`. No JS logic change: the FE `apply_to_all_tix` checkbox is already a UI-only flag that hides the per-ticket-type picker; the BE carries the load-bearing enforcement.

## Scope

### In Scope

- `src/i18n/en.json` — update `edit_promocode.apply_to_all_tix` copy; add `edit_promocode.apply_to_all_tix_helper` for the inline explainer.
- `src/components/forms/promocode-form/forms/discount-base-pc-form.js` — render the helper text below the checkbox.
- Extend `src/components/forms/promocode-form/__tests__/promocode-form.integration.test.js` (existing — extended for this change) with assertions for the new label and helper text.

### Out of Scope

- Client-side ticket-type filtering. The FE never had "select all" behavior on this checkbox; it only hides the per-type picker. No JS logic change is required.
- Changes to the picker/`DiscountTicketTable` component. Audience visibility filtering in the picker — if needed at all — is a separate concern; the picker already surfaces every audience because the parent feature explicitly relies on this for opting `WithPromoCode` types in.
- Backend enforcement. Covered entirely by the API SDS.

## Truths (Authoritative Decisions)

1. **The FE `apply_to_all_tix` flag is UI-only and stays UI-only.** It is deleted before send (`src/actions/promocode-actions.js:160`) and rederived from `ticket_types_rules.length === 0` (`src/reducers/promocodes/promocode-reducer.js:179`). The backend has no corresponding stored flag — it infers "apply to all" from an empty `allowed_ticket_types` collection. Do not change this contract.

2. **No "select all on click" behavior is added.** The existing UX is: checking the box hides the per-type picker and saves the code with no `ticket_types_rules`. Adding any kind of FE pre-population would conflict with the BE's empty-collection semantics. The helper text instead tells the admin to use the picker for non-All audiences after saving.

3. **Helper text wording is required, not optional.** The change request explicitly calls out admin confusion as the failure mode. Without the inline explainer below the checkbox, admins will keep encountering surprise.

4. **Copy keys live under `edit_promocode.*`** to match the existing namespace at `src/i18n/en.json:992`-`1008`.

## Approach

**Chosen:** Two-key i18n update + one helper-text JSX row beneath the existing checkbox.

**Why:** Smallest possible change that addresses the admin clarity gap. Pure copy. Mirrors the surrounding bootstrap form styling. No JSX restructuring or component refactor.

**Alternatives considered:**

- _Filter the per-type picker to hide `WithPromoCode` rows by default._ Rejected — the parent feature explicitly requires admins to be able to opt `WithPromoCode` types into a discount code via the picker. Hiding them would block the only legitimate path.
- _Pre-populate `ticket_types_rules` with all `Audience = All` types when the box is checked._ Rejected — adds FE logic that diverges from the BE's empty-collection semantics; would also reverse-break existing discount codes on first edit.
- _Disable the checkbox entirely on edit forms with mixed-audience summits._ Rejected — overreaches; the box still has a useful "apply to all Audience = All types" function.

## Context for Implementer

- **Entry point:** `src/components/forms/promocode-form/forms/discount-base-pc-form.js` is the only JSX file that changes. The checkbox sits at lines 19-30; the helper row goes immediately after the closing `</div>` of the `form-check` block (line 30) but still inside the `col-md-4` (line 15).
- **i18n keys:** existing `edit_promocode.apply_to_all_tix` (line 1001) gets a copy update. New key `edit_promocode.apply_to_all_tix_helper` is added beside it.
- **Existing tests touched:** `src/components/forms/promocode-form/__tests__/promocode-form.integration.test.js` already asserts label rendering for the discount-code form; extend rather than duplicate.
- **Style:** keep the helper-text styling consistent with surrounding form rows (bootstrap legacy classes — `form-text`, `text-muted`, or equivalent — no MUI). The skill file `skills/react-frontend.md` in the fn-skills vault calls out the legacy-Bootstrap convention for this area.

## Tasks

### Task 1: i18n copy

**File:** `src/i18n/en.json`

**Changes:**

- Update `edit_promocode.apply_to_all_tix` (line 1001) from `"Apply to all Ticket Types"` to `"Apply to all ticket types (Audience: All)"`.
- Add new key beneath it: `edit_promocode.apply_to_all_tix_helper` with value:
  `"Only ticket types with Audience = All are covered. WithInvitation, WithoutInvitation, and WithPromoCode ticket types must be added explicitly via the ticket-type picker after saving."`

**Definition of Done:**

- [ ] Both keys present in `src/i18n/en.json` under the `edit_promocode` namespace.
- [ ] No duplicate keys, no JSON syntax errors (`yarn build` / lint runs cleanly).

### Task 2: Helper-text row in the discount form

**File:** `src/components/forms/promocode-form/forms/discount-base-pc-form.js`

**Change:** Below the existing checkbox `<div className="form-check abc-checkbox">...</div>` (line 30 closing), add a small bootstrap-styled helper paragraph:

```jsx
<small className="form-text text-muted">
  {T.translate("edit_promocode.apply_to_all_tix_helper")}
</small>
```

This sits inside the same `col-md-4` container as the checkbox.

**Definition of Done:**

- [ ] Helper text renders only on this discount form (no leakage into other promo-code variants).
- [ ] Visible whether the box is checked or unchecked (it's always relevant context).
- [ ] Styling matches surrounding form rows (no MUI components introduced).

### Task 3: Test coverage

**File:** `src/components/forms/promocode-form/__tests__/promocode-form.integration.test.js`

**Add:** new `it()` cases under the existing discount-code suite asserting:

- The "Apply to all ticket types (Audience: All)" label string is rendered.
- The helper text including "WithPromoCode" (case-insensitive) is rendered immediately below.

**Definition of Done:**

- [ ] Both assertions pass.
- [ ] Existing tests in the file still pass.
- [ ] `yarn test --watchAll=false src/components/forms/promocode-form/__tests__/promocode-form.integration.test.js` exits 0.

## Test Plan (Manual)

1. Run `yarn start` against a summit that has all four audience values represented across its ticket types.
2. Open or create a discount-code promo code (Domain-Authorized or plain Summit Discount).
3. Verify the checkbox label reads "Apply to all ticket types (Audience: All)".
4. Verify the helper text "Only ticket types with Audience = All are covered..." appears beneath the checkbox.
5. Check the box and save — code should save with no `ticket_types_rules`. Reload — checkbox should still be checked (derived state).
6. Uncheck and use the picker to opt in a `WithPromoCode` ticket type — picker continues to expose it.

## Acceptance Criteria

- [ ] New label string conveys "Audience: All" scope clearly.
- [ ] Helper text appears beneath the checkbox and names the three excluded audiences.
- [ ] No FE logic change; no regression in existing form behavior.
- [ ] Integration test asserts both label and helper text.
- [ ] API counterpart (`summit-api/doc/promo-code-apply-to-all-audience-restriction.md`) merged or scheduled in the same release.

## References

- API SDS: `summit-api/doc/promo-code-apply-to-all-audience-restriction.md`
- Parent feature plan (local): `docs/superpowers/plans/2026-04-21-promo-codes-for-early-registration-access.md`
- Form file: `src/components/forms/promocode-form/forms/discount-base-pc-form.js`
- i18n file: `src/i18n/en.json`
- Reducer note explaining the UI-only flag: `src/reducers/promocodes/promocode-reducer.js:166-180`
- ClickUp: 86b9vrpxp
