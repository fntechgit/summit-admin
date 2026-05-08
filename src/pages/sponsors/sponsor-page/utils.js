import {
  currencyAmountFromCents,
  formatDiscount
} from "openstack-uicore-foundation/lib/utils/money";

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
