import React, { useState } from "react";
import T from "i18n-react";
import { TagInput } from "openstack-uicore-foundation/lib/components";
import { validateAllowedEmailDomainEntry } from "../../../../../utils/methods";
import { fireChange } from "./utils";

const normalizeTagValues = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry;
      // TagInput emits {tag, id} for saved chips and {__isNew__, label, value}
      // for new entries mid-flight.
      return entry?.tag ?? entry?.value ?? entry?.label ?? "";
    })
    .filter((s) => typeof s === "string" && s.length > 0);
};

const AllowedEmailDomainsRow = ({ entity, handleChange }) => {
  const [domainsError, setDomainsError] = useState("");

  const domains = Array.isArray(entity.allowed_email_domains)
    ? entity.allowed_email_domains
    : [];
  const domainsAsTags = domains.map((d) => ({ tag: d }));

  const handleDomainsChange = (ev) => {
    const next = normalizeTagValues(ev?.target?.value ?? []);
    fireChange(handleChange, "allowed_email_domains", next);
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
    fireChange(handleChange, "allowed_email_domains", [...domains, trimmed]);
  };

  return (
    <div className="row form-group" data-testid="allowed-email-domains-row">
      <div className="col-md-12">
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
        <small className="form-text text-muted">
          {T.translate("edit_promocode.captions.allowed_email_domains")}
        </small>
        {domainsError && (
          <div className="text-danger" style={{ marginTop: 4 }}>
            {domainsError}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllowedEmailDomainsRow;
