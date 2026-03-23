import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { MILLISECONDS_IN_SECOND } from "../../../utils/constants";

export const getCurrentApplicableRate = (timeZone, rateDates) => {
  const now = epochToMomentTimeZone(
    Math.floor(new Date() / MILLISECONDS_IN_SECOND),
    timeZone
  );

  const earlyBirdEnd = epochToMomentTimeZone(
    rateDates.early_bird_end_date,
    timeZone
  )?.endOf("day");
  const onsiteStart = epochToMomentTimeZone(
    rateDates.onsite_price_start_date,
    timeZone
  )?.startOf("day");
  const onsiteEnd = epochToMomentTimeZone(
    rateDates.onsite_price_end_date,
    timeZone
  )?.endOf("day");

  if (earlyBirdEnd && now.isSameOrBefore(earlyBirdEnd)) return "early_bird";
  if (onsiteStart && now.isSameOrBefore(onsiteStart)) return "standard";
  if (!onsiteEnd || now.isSameOrBefore(onsiteEnd)) return "onsite";
  return "expired";
};

export const isItemAvailable = (item, currentApplicableRate) =>
  item.rates?.[currentApplicableRate] != null;
