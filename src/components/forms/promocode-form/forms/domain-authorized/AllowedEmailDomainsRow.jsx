import React, { useState } from "react";
import T from "i18n-react";
import { validateAllowedEmailDomainEntry } from "../../../../../utils/methods";
import { fireChange } from "./utils";

// Freeform chip input. Deliberately NOT openstack-uicore-foundation's
// TagInput: that component wraps react-select's AsyncCreatable and fires
// `queryTags` against `/api/v1/.../allowed-tags` on every keystroke. Email
// domains have nothing to do with the Tags table — see PR #915 review.
const AllowedEmailDomainsRow = ({
  entity,
  handleChange,
  hasErrors = () => ""
}) => {
  const [draft, setDraft] = useState("");
  const [domainsError, setDomainsError] = useState("");

  const domains = Array.isArray(entity.allowed_email_domains)
    ? entity.allowed_email_domains
    : [];

  // validate-path error (parent state) takes precedence over the local
  // commit-path error so a failed Save with a malformed pre-existing chip
  // surfaces in the DOM. handleChange clears parent state.errors[id] on the
  // next user edit, so this naturally clears too.
  const renderedError = hasErrors("allowed_email_domains") || domainsError;

  const commit = (raw) => {
    const trimmed = (raw ?? "").trim();
    if (trimmed.length === 0) return;
    if (!validateAllowedEmailDomainEntry(trimmed)) {
      setDomainsError(
        T.translate("edit_promocode.errors.allowed_email_domains_format")
      );
      return;
    }
    if (!domains.includes(trimmed)) {
      fireChange(handleChange, "allowed_email_domains", [...domains, trimmed]);
    }
    setDraft("");
    setDomainsError("");
  };

  const removeAt = (idx) => {
    const next = domains.filter((_, i) => i !== idx);
    fireChange(handleChange, "allowed_email_domains", next);
    setDomainsError("");
  };

  const handleKeyDown = (ev) => {
    if (ev.key === "Enter" || ev.key === ",") {
      ev.preventDefault();
      commit(draft);
      return;
    }
    if (ev.key === "Backspace" && draft.length === 0 && domains.length > 0) {
      ev.preventDefault();
      removeAt(domains.length - 1);
    }
  };

  const handleBlur = () => {
    if (draft.length > 0) commit(draft);
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
        <div
          id="allowed_email_domains"
          className="form-control"
          style={{
            minHeight: 38,
            height: "auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            alignItems: "center"
          }}
        >
          {domains.map((d, idx) => (
            <span
              key={d}
              className="label label-default"
              data-testid={`domain-chip-${d}`}
              style={{
                padding: "4px 8px",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.95em"
              }}
            >
              {d}
              <button
                type="button"
                aria-label={`remove ${d}`}
                data-testid={`domain-chip-remove-${d}`}
                onClick={() => removeAt(idx)}
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  marginLeft: 4,
                  color: "inherit",
                  fontWeight: "bold",
                  cursor: "pointer",
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            data-testid="allowed_email_domains_input"
            aria-label={T.translate("edit_promocode.allowed_email_domains")}
            value={draft}
            placeholder={
              domains.length === 0
                ? T.translate(
                    "edit_promocode.placeholders.allowed_email_domains"
                  )
                : ""
            }
            onChange={(e) => {
              setDraft(e.target.value);
              setDomainsError("");
              // Parallel-clear the parent validate()-path error so the
              // .text-danger banner disappears as soon as the user starts
              // editing — same UX every other field gets via index.js:114
              // (newErrors[id] = "" inside handleChange). The chip input's
              // onChange normally doesn't bubble to the parent (typing
              // updates local draft only), so we synthesize a no-op array
              // change to trigger the parent reset. Only fires when a
              // parent error is currently set, so the cost (one extra
              // setState) is paid only after a failed Save.
              if (hasErrors("allowed_email_domains")) {
                fireChange(handleChange, "allowed_email_domains", domains);
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={{
              border: 0,
              outline: "none",
              flex: 1,
              minWidth: 120,
              background: "transparent",
              padding: 0
            }}
          />
        </div>
        <small className="form-text text-muted">
          {T.translate("edit_promocode.captions.allowed_email_domains")}
        </small>
        {renderedError && (
          <div className="text-danger" style={{ marginTop: 4 }}>
            {renderedError}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllowedEmailDomainsRow;
