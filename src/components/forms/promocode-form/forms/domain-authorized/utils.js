// Single source of truth for the domain-authorized class-name boolean.
// Required at all 3 sync points (validate, render, base-pc-form) — never
// inline the string literals.
export const isDomainAuthorizedClass = (className) =>
  className === "DOMAIN_AUTHORIZED_PROMO_CODE" ||
  className === "DOMAIN_AUTHORIZED_DISCOUNT_CODE";
