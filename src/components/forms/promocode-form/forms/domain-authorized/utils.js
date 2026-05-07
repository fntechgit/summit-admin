// React-16 event-pooling synthesizer used by every leaf in this directory.
// Keeps `handleChange` payload shape identical to the legacy fragment's call
// pattern so the parent PromocodeForm.handleChange contract is unchanged.
export const fireChange = (
  handleChange,
  id,
  value,
  type = "text",
  extra = {}
) => {
  handleChange({ target: { id, value, type, ...extra } });
};

// Single source of truth for the domain-authorized class-name boolean.
// Required at all 3 sync points (validate, render, base-pc-form) — never
// inline the string literals.
export const isDomainAuthorizedClass = (className) =>
  className === "DOMAIN_AUTHORIZED_PROMO_CODE" ||
  className === "DOMAIN_AUTHORIZED_DISCOUNT_CODE";
