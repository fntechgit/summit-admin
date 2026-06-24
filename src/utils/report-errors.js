import { doLogin } from "openstack-uicore-foundation/lib/security/methods";
import { getBackURL } from "openstack-uicore-foundation/lib/utils/methods";
import {
  ERROR_CODE_401,
  ERROR_CODE_403,
  ERROR_CODE_404,
  ERROR_CODE_412,
  ERROR_CODE_503
} from "./constants";

export const extractErrorMessage = (err = {}, res = {}) => {
  const candidates = [
    err?.response?.body?.message,
    err?.response?.body?.detail,
    err?.body?.message,
    err?.body?.detail,
    err?.message,
    res?.body?.message,
    res?.body?.detail,
    typeof res === "string" ? res : undefined
  ];
  return candidates.find((c) => typeof c === "string" && c.length > 0) || "";
};

// Split the two 503s by message (case-insensitive substring match); an unknown
// 503 is generic (do not assume reads-disabled). Map auth statuses to non-logout kinds.
export const classifyReportError = (status, message = "") => {
  const msg = String(message || "");
  switch (status) {
    case ERROR_CODE_503:
      if (/CSV export is not enabled/i.test(msg)) {
        return { kind: "export-disabled", message: msg };
      }
      if (/Reports are not enabled/i.test(msg)) {
        return { kind: "read-disabled", message: msg };
      }
      return { kind: "unknown", message: msg };
    case ERROR_CODE_412:
      return { kind: "validation", message: msg };
    case ERROR_CODE_404:
      return { kind: "not-found", message: msg };
    case ERROR_CODE_401:
      return { kind: "reauth", message: msg };
    case ERROR_CODE_403:
      return { kind: "unauthorized", message: msg };
    default:
      return { kind: "unknown", message: msg };
  }
};

// Read error handler factory — shaped for uicore getRequest:
//   getRequest(req, recv, url, makeReadErrorHandler({ onReadError, onValidationError, onExportDisabled }))
// The action creators come from the owning reducer. 403 is surfaced as a
// non-logout unauthorized read error; 401 triggers explicit reauth (doLogin);
// 412 routes to onValidationError (inline/toast), NOT a body replacement.
export const makeReadErrorHandler =
  ({ onReadError, onValidationError, onExportDisabled }) =>
  (err, res) =>
  (dispatch) => {
    const status = err?.status ?? res?.status;
    const { kind, message } = classifyReportError(
      status,
      extractErrorMessage(err, res)
    );
    switch (kind) {
      case "export-disabled":
        if (onExportDisabled) dispatch(onExportDisabled({ message }));
        return;
      case "validation":
        if (onValidationError) dispatch(onValidationError({ status, message }));
        return;
      case "reauth":
        // 401 -> reauthenticate explicitly, preserving full back URL (path + query + hash).
        doLogin(getBackURL());
        return;
      default:
        // read-disabled / not-found / unauthorized / unknown -> replace the body.
        if (onReadError) dispatch(onReadError({ kind, status, message }));
    }
  };
