import React from "react";
import T from "i18n-react";
import { fireChange } from "./domain-authorized/utils";

// Shared `auto_apply` checkbox. Used by:
//  - DomainAuthorized leaf (orchestrator's .checkboxes-div) with
//    {withCaption, marginTop} — host provides no row context.
//  - Member/Speaker fragments — host wraps in its own .row.form-group.
const AutoApplyCheckbox = ({
  entity,
  handleChange,
  withCaption = false,
  marginTop = false
}) => (
  <div
    className="form-check abc-checkbox"
    style={marginTop ? { marginTop: "10px" } : undefined}
  >
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
    {withCaption && (
      <small className="form-text text-muted" style={{ display: "block" }}>
        {T.translate("edit_promocode.captions.auto_apply")}
      </small>
    )}
  </div>
);

export default AutoApplyCheckbox;
