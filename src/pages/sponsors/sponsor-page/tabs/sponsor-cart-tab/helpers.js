import React from "react";
import T from "i18n-react/dist/i18n-react";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { SPONSOR_FORMS_METAFIELD_CLASS } from "../../../../../utils/constants";

export const mapCartData = (cart, showItemDescription = false) => {
  if (!cart?.forms) return [];

  return cart.forms
    .map((form) => ({
      ...form,
      discount: form.discount === "0%" ? "" : form.discount
    }))
    .reduce((res, f) => {
      f.items.forEach((it) => {
        const formMetaFields = it.meta_fields.filter(
          (mf) => mf.class_field === SPONSOR_FORMS_METAFIELD_CLASS.FORM
        );

        const item_name = [it.type.name];

        if (showItemDescription) {
          item_name.push(
            ...formMetaFields.map((mf) => {
              const val =
                mf.values.length > 0
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
              {T.translate("edit_sponsor.cart_tab.payment_view.total")}:{" "}
              {it.quantity}
            </div>
          );
          item_name.push(
            <div key={`mf-list-${it.id}-rate`}>
              {T.translate("edit_sponsor.cart_tab.payment_view.rate")}:{" "}
              {currencyAmountFromCents(it.current_rate)}
            </div>
          );
        }

        res.push({ ...f, item_name });
      });
      return res;
    }, []);
};
