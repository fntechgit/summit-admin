import {
  createAction,
  getRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";
import { getReportsApiBaseUrl } from "../utils/reports-api";
import { makeReadErrorHandler } from "../utils/report-errors";

export const REQUEST_PURCHASE_DETAILS = "REQUEST_PURCHASE_DETAILS";
export const RECEIVE_PURCHASE_DETAILS = "RECEIVE_PURCHASE_DETAILS";
export const RECEIVE_PURCHASE_DETAILS_FILTERS =
  "RECEIVE_PURCHASE_DETAILS_FILTERS";
export const PURCHASE_DETAILS_READ_ERROR = "PURCHASE_DETAILS_READ_ERROR";
export const PURCHASE_DETAILS_VALIDATION_ERROR =
  "PURCHASE_DETAILS_VALIDATION_ERROR";
export const PURCHASE_DETAILS_VALIDATION_CLEAR =
  "PURCHASE_DETAILS_VALIDATION_CLEAR";

export const REQUEST_SPONSOR_ASSET = "REQUEST_SPONSOR_ASSET";
export const RECEIVE_SPONSOR_ASSET = "RECEIVE_SPONSOR_ASSET";
export const RECEIVE_SPONSOR_ASSET_FILTERS = "RECEIVE_SPONSOR_ASSET_FILTERS";
export const SPONSOR_ASSET_READ_ERROR = "SPONSOR_ASSET_READ_ERROR";

export const REQUEST_SPONSOR_DRILLDOWN = "REQUEST_SPONSOR_DRILLDOWN";
export const RECEIVE_SPONSOR_DRILLDOWN = "RECEIVE_SPONSOR_DRILLDOWN";
export const SPONSOR_DRILLDOWN_READ_ERROR = "SPONSOR_DRILLDOWN_READ_ERROR";

export const REQUEST_PURCHASE_DETAILS_LINES = "REQUEST_PURCHASE_DETAILS_LINES";
export const RECEIVE_PURCHASE_DETAILS_LINES = "RECEIVE_PURCHASE_DETAILS_LINES";
export const PURCHASE_DETAILS_LINES_READ_ERROR =
  "PURCHASE_DETAILS_LINES_READ_ERROR";

// Base URL helper — scoped to a specific summit's reports endpoint.
const base = (summitId) =>
  `${getReportsApiBaseUrl()}/api/v1/summits/${summitId}/reports`;

export const getPurchaseDetailsReport =
  (query = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    // No summit in context → skip. Otherwise base(currentSummit.id) throws
    // synchronously after startLoading() and the spinner is never cleared.
    if (!currentSummit?.id) return undefined;
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    const params = { access_token: accessToken, ...query };
    return getRequest(
      createAction(REQUEST_PURCHASE_DETAILS),
      createAction(RECEIVE_PURCHASE_DETAILS),
      `${base(currentSummit.id)}/purchase-details`,
      makeReadErrorHandler({
        onReadError: createAction(PURCHASE_DETAILS_READ_ERROR),
        onValidationError: createAction(PURCHASE_DETAILS_VALIDATION_ERROR),
        onExportDisabled: createAction(PURCHASE_DETAILS_READ_ERROR)
      })
    )(params)(dispatch)
      .catch(() => {})
      .finally(() => dispatch(stopLoading()));
  };

// Clears the Purchase Details validation toast (dispatched from the Snackbar
// onClose). A plain action creator lets the page bind it via the object form of
// mapDispatchToProps instead of receiving raw dispatch.
export const clearPurchaseDetailsValidation = () => ({
  type: PURCHASE_DETAILS_VALIDATION_CLEAR
});

export const getPurchaseDetailsLinesReport =
  (query = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    if (!currentSummit?.id) return undefined;
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    const params = { access_token: accessToken, ...query };
    return getRequest(
      createAction(REQUEST_PURCHASE_DETAILS_LINES),
      createAction(RECEIVE_PURCHASE_DETAILS_LINES),
      `${base(currentSummit.id)}/purchase-details/lines`,
      makeReadErrorHandler({
        onReadError: createAction(PURCHASE_DETAILS_LINES_READ_ERROR),
        // This view sends no client-invalid input, but a 412 must still clear
        // loading rather than silently no-op → route it to the read-error body.
        onValidationError: createAction(PURCHASE_DETAILS_LINES_READ_ERROR),
        onExportDisabled: createAction(PURCHASE_DETAILS_LINES_READ_ERROR)
      })
    )(params)(dispatch)
      .catch(() => {})
      .finally(() => dispatch(stopLoading()));
  };

export const getPurchaseDetailsFilters = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  if (!currentSummit?.id) return undefined;
  const accessToken = await getAccessTokenSafely();
  dispatch(startLoading());
  return getRequest(
    null,
    createAction(RECEIVE_PURCHASE_DETAILS_FILTERS),
    `${base(currentSummit.id)}/purchase-details/filters`,
    makeReadErrorHandler({
      onReadError: createAction(PURCHASE_DETAILS_READ_ERROR)
    })
  )({ access_token: accessToken })(dispatch)
    .catch(() => {})
    .finally(() => dispatch(stopLoading()));
};

export const getSponsorAssetReport =
  (query = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    // No summit in context → skip. Otherwise base(currentSummit.id) throws
    // synchronously after startLoading() and the spinner is never cleared.
    if (!currentSummit?.id) return undefined;
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    const params = { access_token: accessToken, ...query };
    return getRequest(
      createAction(REQUEST_SPONSOR_ASSET),
      createAction(RECEIVE_SPONSOR_ASSET),
      `${base(currentSummit.id)}/sponsor-assets`,
      makeReadErrorHandler({
        onReadError: createAction(SPONSOR_ASSET_READ_ERROR),
        // FE never sends an invalid group_by/order, but a 412 must not be swallowed:
        // route it to the read-error body rather than a silent no-op.
        onValidationError: createAction(SPONSOR_ASSET_READ_ERROR),
        onExportDisabled: createAction(SPONSOR_ASSET_READ_ERROR)
      })
    )(params)(dispatch)
      .catch(() => {})
      .finally(() => dispatch(stopLoading()));
  };

export const getSponsorAssetFilters = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;
  if (!currentSummit?.id) return undefined;
  const accessToken = await getAccessTokenSafely();
  dispatch(startLoading());
  return getRequest(
    null, // loading is owned by getSponsorAssetReport; filters must not toggle it
    createAction(RECEIVE_SPONSOR_ASSET_FILTERS),
    `${base(currentSummit.id)}/sponsor-assets/filters`,
    makeReadErrorHandler({
      onReadError: createAction(SPONSOR_ASSET_READ_ERROR)
    })
  )({ access_token: accessToken })(dispatch)
    .catch(() => {})
    .finally(() => dispatch(stopLoading()));
};

export const getSponsorAssetSponsor =
  (sponsorId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;
    // No summit in context → skip. Otherwise base(currentSummit.id) throws
    // synchronously after startLoading() and the spinner is never cleared.
    if (!currentSummit?.id) return undefined;
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    return getRequest(
      createAction(REQUEST_SPONSOR_DRILLDOWN),
      createAction(RECEIVE_SPONSOR_DRILLDOWN),
      `${base(currentSummit.id)}/sponsor-assets/sponsors/${sponsorId}`,
      makeReadErrorHandler({
        onReadError: createAction(SPONSOR_DRILLDOWN_READ_ERROR),
        // A 412 or export-disabled 503 on a read endpoint must still clear
        // loading; route both to the same READ_ERROR action so the page does
        // not spin forever.
        onValidationError: createAction(SPONSOR_DRILLDOWN_READ_ERROR),
        onExportDisabled: createAction(SPONSOR_DRILLDOWN_READ_ERROR)
      })
    )({ access_token: accessToken })(dispatch)
      .catch(() => {})
      .finally(() => dispatch(stopLoading()));
  };
