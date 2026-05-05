import React from "react";
import T from "i18n-react";
import { Input } from "openstack-uicore-foundation/lib/components";
import { fireChange } from "./utils";

// Returns the col-md-4 directly. Host (BasePCForm's Quantity row) provides
// the .row.form-group wrapper.
const MaxPerAccountInput = ({ entity, handleChange }) => (
  <div className="col-md-4">
    <label htmlFor="quantity_per_account">
      {T.translate("edit_promocode.quantity_per_account")}&nbsp;
      <i
        className="fa fa-info-circle"
        aria-hidden="true"
        title={T.translate("edit_promocode.info.quantity_per_account")}
      />
    </label>
    <Input
      id="quantity_per_account"
      type="number"
      min="0"
      value={entity.quantity_per_account}
      onChange={(ev) =>
        fireChange(
          handleChange,
          "quantity_per_account",
          ev.target.value,
          "number"
        )
      }
      className="form-control"
    />
    <small className="form-text text-muted">
      {T.translate("edit_promocode.captions.quantity_per_account_unlimited")}
    </small>
  </div>
);

export default MaxPerAccountInput;
