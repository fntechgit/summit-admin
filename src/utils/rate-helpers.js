import T from "i18n-react";
import {
  amountFromCents,
  parsePrice,
  currencyAmountFromCents
} from "openstack-uicore-foundation/lib/utils/money";

export const RATE_FIELDS = {
  EARLY_BIRD: "early_bird_rate",
  STANDARD: "standard_rate",
  ONSITE: "onsite_rate"
};

export const isRateEnabled = (value) =>
  value !== null && value !== undefined && value !== "";

export const rateFromCents = (cents) => {
  if (cents === null || cents === undefined) return null;
  return amountFromCents(cents);
};

export const rateToCents = (value) => {
  if (value === null || value === undefined) return null;
  if (value === "") return 0;
  return parsePrice(value);
};

export const formatRateFromCents = (cents) => {
  if (cents === null || cents === undefined)
    return T.translate("price_tiers.not_available");
  return currencyAmountFromCents(cents);
};
