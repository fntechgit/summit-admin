import * as yup from "yup";

// The sponsor-facing quantity input is capped by whichever axis is tighter:
// what's left for the show, or what's left for this sponsor specifically.
// Either field being null means that axis has no cap.
export const buildGlobalQuantitySchema = (item) => {
  let schema = yup.number().min(0, " ");
  const maxQty = Math.min(
    item.remaining_quantity_show ?? Infinity,
    item.remaining_quantity_sponsor ?? Infinity
  );
  if (Number.isFinite(maxQty)) {
    schema = schema.max(maxQty, " ");
  }
  return schema.required(" ");
};
