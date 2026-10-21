import React, { useState } from "react";
import T from "i18n-react";
import { useField } from "formik";
import {
  Box,
  Button,
  Chip,
  FormHelperText,
  InputBase,
  Typography
} from "@mui/material";
import { validateAllowedEmailDomainEntry } from "../../../../../utils/methods";
import { LARGE_DOMAIN_LIST_THRESHOLD } from "./bulk-input-parser";
import ManageAllowedEmailDomainsModal from "./ManageAllowedEmailDomainsModal";
import LabelWithInfo from "../label-with-info";

const typeOf = (entry) => {
  if (entry.startsWith("@")) return "atDomain";
  if (entry.startsWith(".")) return "tld";
  return "email";
};

const FIELD_SX = {
  minHeight: 38,
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  px: 1.5,
  py: 1
};

// Freeform chip input. Deliberately NOT openstack-uicore-foundation's
// TagInput: that component fires `queryTags` against the Tags table on every
// keystroke, and email domains have nothing to do with tags — see PR #915 review.
const AllowedEmailDomainsRow = () => {
  const [field, meta, helpers] = useField("allowed_email_domains");
  const [draft, setDraft] = useState("");
  const [domainsError, setDomainsError] = useState("");
  const [manageOpen, setManageOpen] = useState(false);

  const domains = Array.isArray(field.value) ? field.value : [];

  // a saved list with a malformed entry (form validation) wins over the entry being typed
  const renderedError = (meta.touched && meta.error) || domainsError;

  const setDomains = (next) => {
    helpers.setValue(next);
    helpers.setTouched(true, false);
  };

  const commit = (raw) => {
    const trimmed = (raw ?? "").trim();
    if (trimmed.length === 0) return;
    if (!validateAllowedEmailDomainEntry(trimmed)) {
      setDomainsError(
        T.translate("edit_promocode.errors.allowed_email_domains_format")
      );
      return;
    }
    const lowerTrimmed = trimmed.toLowerCase();
    const alreadyPresent = domains.some(
      (d) => d.toLowerCase() === lowerTrimmed
    );
    if (!alreadyPresent) {
      setDomains([...domains, trimmed]);
    }
    setDraft("");
    setDomainsError("");
  };

  const removeAt = (idx) => {
    setDomains(domains.filter((_, i) => i !== idx));
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

  // mounted in both the chip wall and the compact summary so a single add is possible at every list size
  const inlineAddInput = (
    <InputBase
      value={draft}
      placeholder={
        domains.length === 0
          ? T.translate("edit_promocode.placeholders.allowed_email_domains")
          : ""
      }
      onChange={(e) => {
        setDraft(e.target.value);
        setDomainsError("");
      }}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      inputProps={{
        // useScrollToError finds the errored field by name
        name: "allowed_email_domains",
        "data-testid": "allowed_email_domains_input",
        "aria-label": T.translate("edit_promocode.allowed_email_domains")
      }}
      sx={{ flex: 1, minWidth: 120 }}
    />
  );

  const typeMix = () => {
    const counts = { atDomain: 0, tld: 0, email: 0 };
    domains.forEach((d) => {
      counts[typeOf(d)] += 1;
    });
    return T.translate("edit_promocode.large_list.summary_type_mix", counts);
  };

  return (
    <Box data-testid="allowed-email-domains-row">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <LabelWithInfo
          htmlFor="allowed_email_domains"
          label={T.translate("edit_promocode.allowed_email_domains")}
          info={T.translate("edit_promocode.info.allowed_email_domains")}
        />
        <Button
          size="small"
          variant="outlined"
          data-testid="manage-list-button"
          onClick={() => setManageOpen(true)}
        >
          {T.translate("edit_promocode.manage_button")}
        </Button>
      </Box>
      {domains.length > LARGE_DOMAIN_LIST_THRESHOLD ? (
        <Box
          id="allowed_email_domains"
          sx={{ ...FIELD_SX, display: "flex", flexDirection: "column", gap: 1 }}
        >
          <Box>
            <Typography data-testid="compact-summary-count" fontWeight={600}>
              {T.translate("edit_promocode.large_list.summary_count", {
                n: domains.length
              })}
            </Typography>
            <Typography
              data-testid="compact-summary-type-mix"
              variant="body2"
              color="text.secondary"
            >
              {typeMix()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {T.translate("edit_promocode.large_list.summary_example", {
                entry: domains[0]
              })}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {inlineAddInput}
          </Box>
        </Box>
      ) : (
        <Box
          id="allowed_email_domains"
          sx={{
            ...FIELD_SX,
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            alignItems: "center"
          }}
        >
          {domains.map((d, idx) => (
            <Chip
              key={d}
              label={d}
              size="small"
              data-testid={`domain-chip-${d}`}
              onDelete={() => removeAt(idx)}
              deleteIcon={
                <span
                  role="button"
                  aria-label={`remove ${d}`}
                  data-testid={`domain-chip-remove-${d}`}
                >
                  &times;
                </span>
              }
            />
          ))}
          {inlineAddInput}
        </Box>
      )}
      <Typography variant="body2" color="text.secondary">
        {T.translate("edit_promocode.captions.allowed_email_domains")}
      </Typography>
      {renderedError && <FormHelperText error>{renderedError}</FormHelperText>}
      <ManageAllowedEmailDomainsModal
        show={manageOpen}
        onHide={() => setManageOpen(false)}
        onApply={(next) => {
          setDomainsError("");
          setDraft("");
          setDomains(next);
        }}
        existing={domains}
      />
    </Box>
  );
};

export default AllowedEmailDomainsRow;
