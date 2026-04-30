import React from "react";
import T from "i18n-react/dist/i18n-react";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { BPS, SPONSOR_FORMS_METAFIELD_CLASS } from "../../../utils/constants";

const formatDiscount = (amount, type) => {
  if (type === "Amount") return currencyAmountFromCents(amount);
  if (type === "Rate") return `${amount / BPS}%`; // transform from bps to percentage
  return "";
};

export const normalizeOrder = (data) => ({
  ...data,
  total: currencyAmountFromCents(data.net_amount || 0),
  amount_due:
    data.amount_due === 0
      ? "$0.00"
      : `-${currencyAmountFromCents(-1 * (data.amount_due || 0))}`, // currencyAmountFromCents doesn't allow negatives
  forms: data.forms.map((form) => ({
    ...form,
    add_on_name: form.add_on?.name || "",
    discount: formatDiscount(form.discount_amount, form.discount_type),
    amount: currencyAmountFromCents(form.net_amount)
  }))
});

export const mapOrderData = (lines, showItemDescription = false) => {
  if (!lines) return [];

  return lines
    .map((line) => ({
      ...line,
      discount: line.discount_amount === 0 ? "" : line.discount
    }))
    .reduce((res, f) => {
      f.items.forEach((it) => {
        const formMetaFields = it.meta_fields.filter(
          (mf) => mf.class_field === SPONSOR_FORMS_METAFIELD_CLASS.FORM
        );

        const item_name = [it.type?.name];

        if (showItemDescription) {
          item_name.push(
            ...formMetaFields.map((mf) => {
              const val =
                mf.values?.length > 0
                  ? mf.values.find((v) => v.id === mf.current_value)?.name
                  : mf.current_value;
              return (
                <div key={`mf-list-${it.id}-${mf.id}`}>
                  {mf.name}: {val}
                </div>
              );
            })
          );

          item_name.push(<br key={`mf-list-${it.id}-spacer`} />); // spacer
          item_name.push(
            <div key={`mf-list-${it.id}-total`}>
              {T.translate("order_details_grid.total")}: {it.quantity}
            </div>
          );
          item_name.push(
            <div key={`mf-list-${it.id}-rate`}>
              {T.translate("order_details_grid.rate")}:{" "}
              {currencyAmountFromCents(it.current_rate)}
            </div>
          );
        }

        const amount = currencyAmountFromCents(it.amount);
        const lineId = it.line_id;
        const cancelled = it.canceled_by_id !== null;

        res.push({ ...f, item_name, amount, id: lineId, cancelled });
      });
      return res;
    }, []);
};
