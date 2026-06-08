import {
  currencyAmountFromCents,
  formatDiscount
} from "openstack-uicore-foundation/lib/utils/money";

export const normalizeOrder = (data) => ({
  ...data,
  total: data.net_amount || data.amount_due || 0,
  forms: data.forms.map((form) => ({
    ...form,
    addon_name: form.add_on?.name || "",
    discount: formatDiscount(form.discount_amount, form.discount_type),
    discount_total: form.discount_in_cents || 0,
    amount: currencyAmountFromCents(form.net_amount || 0)
  }))
});
