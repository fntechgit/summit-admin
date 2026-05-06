import React from "react";
import T from "i18n-react/dist/i18n-react";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { BPS, SPONSOR_FORMS_METAFIELD_CLASS } from "../../../utils/constants";

const formatDiscount = (amount, type) => {
  if (type === "Amount") return currencyAmountFromCents(amount);
  if (type === "Rate") return `${amount / BPS}%`; // transform from bps to percentage
  return "";
};

export const normalizeOrder = (data) => {
  const amountDueSign = data?.amount_due < 0 ? "-" : "";
  const amountDueStr = currencyAmountFromCents(Math.abs(data.amount_due || 0)); // currencyAmountFromCents doesn't allow negatives
  const amountDue = `${amountDueSign}${amountDueStr}`;

  return {
    ...data,
    total: currencyAmountFromCents(data.net_amount || 0),
    amount_due: data.amount_due === 0 ? "$0.00" : amountDue,
    forms: data.forms.map((form) => ({
      ...form,
      add_on_name: form.add_on?.name || "",
      discount: formatDiscount(form.discount_amount, form.discount_type),
      discount_total: form.discount_in_cents || 0,
      amount: currencyAmountFromCents(form.net_amount || 0)
    }))
  };
};

export const mapOrderData = (forms) => {
  if (!forms) return [];

  return forms.map((form) => ({
    ...form,
    items: form.items
      .filter((it) => it.quantity)
      .map((it) => {
        const formMetaFields = it.meta_fields.filter(
          (mf) => mf.class_field === SPONSOR_FORMS_METAFIELD_CLASS.FORM
        );

        const itemDetails = [it.type?.name];

        // item details
        itemDetails.push(
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

        itemDetails.push(<br key={`mf-list-${it.id}-spacer`} />); // spacer
        itemDetails.push(
          <div key={`mf-list-${it.id}-total`}>
            {T.translate("order_details_grid.total")}: {it.quantity}
          </div>
        );

        const amount = currencyAmountFromCents(it.amount || 0);
        const lineId = it.line_id;
        const cancelled = !!it.canceled_by_id;
        const rate = currencyAmountFromCents(it.current_rate || 0);

        return {
          id: lineId,
          code: form.code,
          name: form.name,
          rate,
          addon_name: form.addon_name,
          item_name: itemDetails,
          amount,
          cancelled
        };
      })
  }));
};
