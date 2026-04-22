import React, { useState } from "react";
import T from "i18n-react";
import { Input, TagInput } from "openstack-uicore-foundation/lib/components";
import { validateAllowedEmailDomainEntry } from "../../../../utils/methods";

const normalizeTagValues = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry;
      // TagInput emits {tag, id} for saved chips and {__isNew__, label, value} for new entries mid-flight.
      return entry?.tag ?? entry?.value ?? entry?.label ?? "";
    })
    .filter((s) => typeof s === "string" && s.length > 0);
};

const DomainAuthorizedBasePCForm = (props) => {
  const { entity, handleChange } = props;
  const [domainsError, setDomainsError] = useState("");

  const domains = Array.isArray(entity.allowed_email_domains)
    ? entity.allowed_email_domains
    : [];

  const domainsAsTags = domains.map((d) => ({ tag: d }));

  // React 16 pools synthetic events; target is nullified after the handler
  // returns. Synthesize a plain object so tests (and async callers) can read it.
  const fireChange = (id, value, type = "text", extra = {}) => {
    handleChange({ target: { id, value, type, ...extra } });
  };

  const handleQuantityChange = (ev) => {
    fireChange("quantity_per_account", ev.target.value, "number");
  };

  const handleAutoApplyChange = (ev) => {
    fireChange("auto_apply", ev.target.checked, "checkbox", {
      checked: ev.target.checked
    });
  };

  const handleDomainsChange = (ev) => {
    // TagInput emits the full new array on removal/reorder.
    const next = normalizeTagValues(ev?.target?.value ?? []);
    fireChange("allowed_email_domains", next);
    setDomainsError("");
  };

  const handleNewDomain = (newEntry) => {
    const trimmed = (newEntry ?? "").trim();
    if (!validateAllowedEmailDomainEntry(trimmed)) {
      setDomainsError(
        T.translate("edit_promocode.errors.allowed_email_domains_format")
      );
      return;
    }
    if (domains.includes(trimmed)) {
      setDomainsError("");
      return;
    }
    setDomainsError("");
    fireChange("allowed_email_domains", [...domains, trimmed]);
  };

  return (
    <>
      <div className="row form-group">
        <div className="col-md-8">
          <label htmlFor="allowed_email_domains">
            {T.translate("edit_promocode.allowed_email_domains")}&nbsp;
            <i
              className="fa fa-info-circle"
              aria-hidden="true"
              title={T.translate("edit_promocode.info.allowed_email_domains")}
            />
          </label>
          <TagInput
            id="allowed_email_domains"
            clearable
            isMulti
            allowCreate
            value={domainsAsTags}
            onChange={handleDomainsChange}
            onCreate={handleNewDomain}
            placeholder={T.translate(
              "edit_promocode.placeholders.allowed_email_domains"
            )}
          />
          {domainsError && (
            <div className="text-danger" style={{ marginTop: 4 }}>
              {domainsError}
            </div>
          )}
        </div>
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
            onChange={handleQuantityChange}
            className="form-control"
          />
          <small className="form-text text-muted">0 = unlimited</small>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-md-12">
          <div className="form-check abc-checkbox">
            <input
              type="checkbox"
              id="auto_apply"
              checked={!!entity.auto_apply}
              onChange={handleAutoApplyChange}
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
          </div>
        </div>
      </div>
    </>
  );
};

export default DomainAuthorizedBasePCForm;
