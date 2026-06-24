import React, { useState, useRef } from "react";
import { connect } from "react-redux";
import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import T from "i18n-react/dist/i18n-react";
import { getCSV } from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../../../utils/methods";

// D8: fire-and-forget via uicore getCSV (fetchErrorHandler → sweetalert for
// 401/403/412/500). Bespoke CSV error classification from sponsor-services is
// intentionally dropped — generic error handling is convention-aligned and
// sufficient for admin-only access.
//
// Props: { url, query, filename, disabled, label }
//   query  — already in uicore params shape (e.g. { "filter[]": [...] });
//             access_token is appended here and serialized by uicore's URIjs.
//   label  — overrides the default i18n label when provided.
//
// Synchronous in-flight ref guard: setBusy(true) only disables the button
// after a re-render; two rapid clicks in the same tick can both enter
// handleClick before the re-render fires. The ref flips synchronously and
// blocks the second click before the first await completes.
const ExportCsvButton = ({
  url,
  query = {},
  filename,
  disabled = false,
  label,
  dispatch
}) => {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const handleClick = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const token = await getAccessTokenSafely();
      dispatch(getCSV(url, { ...query, access_token: token }, filename));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={handleClick}
      disabled={disabled || busy}
    >
      {label || T.translate("sponsor_reports_page.export_csv")}
    </Button>
  );
};

// connect() with no args injects raw `dispatch` as a prop — cleanest form for
// a component that needs dispatch but reads nothing from state.
export default connect()(ExportCsvButton);
