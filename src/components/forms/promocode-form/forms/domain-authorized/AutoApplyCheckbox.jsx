import React from "react";
import T from "i18n-react";
import { fireChange } from "./utils";

// Returns the .form-check div directly (no wrapping .row). The host
// (index.js's .checkboxes-div inside the Description row) provides the
// row context. The marginTop matches the existing :383 abc-checkbox spacing.
// Inline `display: block` on the caption: BS3 codebase, `d-block` (BS4) does
// not exist here.
const AutoApplyCheckbox = ({ entity, handleChange }) => (
  <div className="form-check abc-checkbox" style={{ marginTop: "10px" }}>
    <input
      type="checkbox"
      id="auto_apply"
      checked={!!entity.auto_apply}
      onChange={(ev) =>
        fireChange(handleChange, "auto_apply", ev.target.checked, "checkbox", {
          checked: ev.target.checked
        })
      }
      className="form-check-input"
    />
    <label className="form-check-label" htmlFor="auto_apply">
      {T.translate("edit_promocode.auto_apply")}&nbsp;
      <i
        className="fa fa-info-circle"
        aria-hidden="true"
        title={T.translate("edit_promocode.info.auto_apply")}
      />
    </label>
    <small className="form-text text-muted" style={{ display: "block" }}>
      {T.translate("edit_promocode.captions.auto_apply")}
    </small>
  </div>
);

export default AutoApplyCheckbox;
