/**
 * Copyright 2017 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import Switch from "react-switch";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Typography
} from "@mui/material";
import SortableTable from "openstack-uicore-foundation/lib/components/table-sortable";
import SummitDropdown from "../../components/summit-dropdown";

import { getSummitById } from "../../actions/summit-actions";
import {
  getLocations,
  deleteLocation,
  exportLocations,
  updateLocationOrder,
  copyLocations
} from "../../actions/location-actions";
import {
  getSyncConfig,
  updateSyncConfig,
  rebuildSync,
  getAllMediaUploadTypesForAllowlist
} from "../../actions/dropbox-sync-actions";
import { TWO } from "../../utils/constants";

// Stable sentinel used as a fallback when redux fields are absent/non-array.
// A module-scope constant has a fixed identity, so useEffect deps that reference
// it don't change on every render (preventing "Maximum update depth exceeded"
// when RECEIVE_SYNC_CONFIG omits materialized_media_upload_types).
const EMPTY_ARRAY = [];

const DROPBOX_STORAGE = "DropBox";

/**
 * JS approximation of Python str.casefold() — the worker's key-space
 * (build_allowlist_set uses strip().casefold()). toUpperCase() first expands
 * full case foldings (ß→SS, ﬁ→FI) that toLowerCase() alone would miss.
 * KNOWN DIVERGENCE (accepted, see SDS plan note): JS merges dotless ı with i
 * while Python casefold keeps them distinct. Pinned by the divergence fixture.
 * This is the ONLY normalization site in this file.
 */
export const normalizeName = (name) =>
  typeof name === "string" ? name.trim().toUpperCase().toLowerCase() : "";

export const isValidEntry = (entry) =>
  entry !== null &&
  typeof entry === "object" &&
  !Array.isArray(entry) &&
  typeof entry.id === "number" &&
  Number.isInteger(entry.id) &&
  entry.id > 0 &&
  typeof entry.name === "string" &&
  entry.name.trim().length > 0;

export const RECONCILE_CASE = {
  INVALID: 0,
  OK: 1,
  RENAMED: 2,
  NOT_DROPBOX: 3,
  RENAMED_NOT_DROPBOX: 4,
  RECREATED: 5,
  RECREATED_NOT_DROPBOX: 6,
  AMBIGUOUS: 7,
  MISSING: 8
};

// Badge i18n keys resolved ONLY through this static map keyed by RECONCILE_CASE
// (the "constrained key map" i18n rule). OK renders no badge.
const BADGE_KEY_BY_CASE = {
  [RECONCILE_CASE.INVALID]: "dropbox_sync.allowlist_badge_invalid",
  [RECONCILE_CASE.OK]: null,
  [RECONCILE_CASE.RENAMED]: "dropbox_sync.allowlist_badge_renamed",
  [RECONCILE_CASE.NOT_DROPBOX]: "dropbox_sync.allowlist_badge_not_dropbox",
  [RECONCILE_CASE.RENAMED_NOT_DROPBOX]:
    "dropbox_sync.allowlist_badge_renamed_not_dropbox",
  [RECONCILE_CASE.RECREATED]: "dropbox_sync.allowlist_badge_recreated",
  [RECONCILE_CASE.RECREATED_NOT_DROPBOX]:
    "dropbox_sync.allowlist_badge_recreated_not_dropbox",
  [RECONCILE_CASE.AMBIGUOUS]: "dropbox_sync.allowlist_badge_ambiguous",
  [RECONCILE_CASE.MISSING]: "dropbox_sync.allowlist_badge_missing"
};

const BADGE_COLOR_BY_CASE = {
  [RECONCILE_CASE.INVALID]: "error",
  [RECONCILE_CASE.OK]: "default",
  [RECONCILE_CASE.RENAMED]: "warning",
  [RECONCILE_CASE.NOT_DROPBOX]: "warning",
  [RECONCILE_CASE.RENAMED_NOT_DROPBOX]: "warning",
  [RECONCILE_CASE.RECREATED]: "info",
  [RECONCILE_CASE.RECREATED_NOT_DROPBOX]: "warning",
  [RECONCILE_CASE.AMBIGUOUS]: "error",
  [RECONCILE_CASE.MISSING]: "error"
};

const reconcileValidEntry = (entry, types) => {
  const storedNorm = normalizeName(entry.name);
  const byId = types.find((t) => t.id === entry.id);

  if (byId) {
    const isDropbox = byId.private_storage_type === DROPBOX_STORAGE;
    const nameAgrees = normalizeName(byId.name) === storedNorm;
    if (nameAgrees && isDropbox) {
      return {
        entry,
        caseId: RECONCILE_CASE.OK,
        badgeParams: {},
        savePayload: { id: entry.id, name: entry.name },
        selectable: true
      };
    }
    if (!nameAgrees && isDropbox) {
      return {
        entry,
        caseId: RECONCILE_CASE.RENAMED,
        badgeParams: { stored: entry.name, current: byId.name },
        savePayload: { id: entry.id, name: byId.name },
        selectable: true
      };
    }
    if (nameAgrees && !isDropbox) {
      return {
        entry,
        caseId: RECONCILE_CASE.NOT_DROPBOX,
        badgeParams: {},
        savePayload: { id: entry.id, name: entry.name },
        selectable: true
      };
    }
    return {
      entry,
      caseId: RECONCILE_CASE.RENAMED_NOT_DROPBOX,
      badgeParams: { stored: entry.name, current: byId.name },
      savePayload: { id: entry.id, name: byId.name },
      selectable: true
    };
  }

  const nameMatches = types.filter((t) => normalizeName(t.name) === storedNorm);

  if (nameMatches.length === 0) {
    return {
      entry,
      caseId: RECONCILE_CASE.MISSING,
      badgeParams: {},
      savePayload: { id: entry.id, name: entry.name },
      selectable: true
    };
  }

  if (nameMatches.length >= TWO) {
    return {
      entry,
      caseId: RECONCILE_CASE.AMBIGUOUS,
      badgeParams: { count: nameMatches.length },
      savePayload: { id: entry.id, name: entry.name },
      selectable: false
    };
  }

  const [match] = nameMatches;
  const isDropbox = match.private_storage_type === DROPBOX_STORAGE;
  return {
    entry,
    caseId: isDropbox
      ? RECONCILE_CASE.RECREATED
      : RECONCILE_CASE.RECREATED_NOT_DROPBOX,
    badgeParams: { storedId: entry.id, currentId: match.id },
    savePayload: { id: match.id, name: match.name },
    selectable: true
  };
};

/**
 * Reconcile the materializer-stored allowlist against the live MediaUploadType
 * list (the FULL, unfiltered list — the DropBox filter only gates NEW picks).
 * Returns one row per surviving stored entry:
 *   { entry, caseId, badgeParams, savePayload|null, selectable }
 * Pre-table pipeline: invalid entries take Case 0 (null payload, non-selectable)
 * and never participate in dedup; valid entries dedup by id, first occurrence
 * wins (later valid duplicates produce no row) so valid data always survives.
 */
export const reconcileAllowlist = (stored, allTypes) => {
  const list = Array.isArray(stored) ? stored : [];
  const types = Array.isArray(allTypes) ? allTypes : [];
  const seenValidIds = new Set();
  const rows = [];

  list.forEach((entry) => {
    if (!isValidEntry(entry)) {
      rows.push({
        entry,
        caseId: RECONCILE_CASE.INVALID,
        badgeParams: {},
        savePayload: null,
        selectable: false
      });
      return;
    }
    if (seenValidIds.has(entry.id)) return; // silent first-occurrence dedup
    seenValidIds.add(entry.id);
    rows.push(reconcileValidEntry(entry, types));
  });

  return rows;
};

function LocationListPage({
  currentSummit,
  history,
  locations,
  totalLocations,
  dropboxSyncState,
  ...props
}) {
  const {
    syncConfig,
    loading: syncLoading,
    allowlistOptions
  } = dropboxSyncState;
  const storedTypes = Array.isArray(syncConfig.materialized_media_upload_types)
    ? syncConfig.materialized_media_upload_types
    : EMPTY_ARRAY;
  const options = Array.isArray(allowlistOptions?.options)
    ? allowlistOptions.options
    : EMPTY_ARRAY;
  const optionsError = allowlistOptions?.error ?? null;

  // Selection model — minimal local state, derived rendering (see SDS § State).
  const [storedRows, setStoredRows] = useState([]);
  const [uncheckedKeys, setUncheckedKeys] = useState(() => new Set());
  const [removedKeys, setRemovedKeys] = useState(() => new Set());
  const [pickedIds, setPickedIds] = useState(() => new Set());

  useEffect(() => {
    if (currentSummit) {
      props.getLocations();
      if (window.DROPBOX_MATERIALIZER_API_BASE_URL) {
        props.getSyncConfig();
        props.getAllMediaUploadTypesForAllowlist();
      }
    }
  }, [currentSummit?.id]);

  // Recompute rows + reset selection whenever the stored allowlist or the
  // options list changes.
  useEffect(() => {
    const rows = reconcileAllowlist(storedTypes, options).map((row, index) => ({
      ...row,
      uiKey: `stored-${index}`
    }));
    setStoredRows(rows);
    setUncheckedKeys(new Set());
    setRemovedKeys(new Set());
    setPickedIds(new Set());
  }, [storedTypes, options]);

  if (!currentSummit.id) return <div />;

  const handleEdit = (locationId) => {
    history.push(`/app/summits/${currentSummit.id}/locations/${locationId}`);
  };

  const handleDelete = (locationId) => {
    const location = locations.find((p) => p.id === locationId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("location_list.remove_warning")} ${location.name}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        props.deleteLocation(locationId);
      }
    });
  };

  const handleNewLocation = () => {
    history.push(`/app/summits/${currentSummit.id}/locations/new`);
  };

  const handleCopyLocations = (fromSummitId) => {
    props.copyLocations(fromSummitId);
  };

  const handleSyncToggle = (checked) => {
    props.updateSyncConfig({
      dropbox_sync_enabled: checked
    });
  };

  const handleRebuild = () => {
    Swal.fire({
      title: T.translate("dropbox_sync.rebuild_confirm_title"),
      text: T.translate("dropbox_sync.rebuild_confirm_body"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("dropbox_sync.rebuild_confirm_yes")
    }).then((result) => {
      if (result.value) {
        props.rebuildSync();
      }
    });
  };

  // ---- allowlist selection derivation -------------------------------------

  const effectiveId = (row) => row.savePayload?.id ?? row.entry?.id;

  const isRowSelected = (row) =>
    !removedKeys.has(row.uiKey) &&
    !uncheckedKeys.has(row.uiKey) &&
    row.savePayload !== null;

  const visibleStoredRows = storedRows.filter(
    (row) => !removedKeys.has(row.uiKey)
  );

  const suppressedIds = new Set(
    visibleStoredRows
      .map(effectiveId)
      .filter((id) => id !== undefined && id !== null)
  );

  const availableOptions = options.filter(
    (opt) =>
      opt.private_storage_type === DROPBOX_STORAGE && !suppressedIds.has(opt.id)
  );

  const selectedStoredRows = storedRows.filter(isRowSelected);
  const selectedCount = selectedStoredRows.length + pickedIds.size;
  const saveDisabled = optionsError !== null || selectedCount === 0;

  const buildSavePayload = () => {
    const fromStored = selectedStoredRows.map((row) => row.savePayload);
    // Defensive: a picked id normally always resolves in `options` (the
    // [storedTypes, options] reset effect clears pickedIds whenever options
    // change). Guard the find() anyway so a future re-fetch trigger that clears
    // options while picks are staged can't dereference undefined here.
    const fromPicked = [...pickedIds]
      .map((id) => options.find((o) => o.id === id))
      .filter(Boolean)
      .map((opt) => ({ id: opt.id, name: opt.name }));
    const seen = new Set();
    const deduped = [];
    [...fromStored, ...fromPicked].forEach((item) => {
      if (seen.has(item.id)) return; // materializer PUT 400s on duplicate ids
      seen.add(item.id);
      deduped.push(item);
    });
    return deduped;
  };

  const toggleKey = (setState, key) => {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleStored = (uiKey) => toggleKey(setUncheckedKeys, uiKey);
  const handleRemoveStored = (uiKey) =>
    setRemovedKeys((prev) => new Set(prev).add(uiKey));
  const handleTogglePicked = (id) => toggleKey(setPickedIds, id);
  const handleSaveAllowlist = () =>
    props.updateSyncConfig({
      materialized_media_upload_types: buildSavePayload()
    });
  const handleRetryOptions = () => props.getAllMediaUploadTypesForAllowlist();

  const bannerText = () => {
    if (!syncConfig.dropbox_sync_enabled) {
      return T.translate("dropbox_sync.banner_inactive");
    }
    const validNames = storedTypes.filter(isValidEntry).map((t) => t.name);
    if (validNames.length === 0) {
      return T.translate("dropbox_sync.banner_active_empty");
    }
    return T.translate("dropbox_sync.banner_active", {
      types: validNames.join(", ")
    });
  };

  const columns = [
    { columnKey: "name", value: T.translate("location_list.name") },
    { columnKey: "class_name", value: T.translate("location_list.class_name") }
  ];

  const table_options = {
    actions: {
      edit: { onClick: handleEdit },
      delete: { onClick: handleDelete }
    }
  };

  const sortedLocations = locations.sort((a, b) => a.order - b.order);

  const showSyncPanel = !!window.DROPBOX_MATERIALIZER_API_BASE_URL;

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("location_list.location_list")} ({totalLocations})
      </h3>

      {showSyncPanel && (
        <div className="panel panel-default" style={{ marginBottom: 20 }}>
          <div className="panel-heading">
            <h4 className="panel-title">
              {T.translate("dropbox_sync.panel_title")}
            </h4>
          </div>
          <div className="panel-body">
            <div className="row form-group">
              <div className="col-md-6">
                <label>
                  {T.translate("dropbox_sync.toggle_label")}
                  &nbsp;
                </label>
                <br />
                <Switch
                  id="dropbox_sync_enabled"
                  checked={syncConfig.dropbox_sync_enabled}
                  onChange={handleSyncToggle}
                  uncheckedIcon={false}
                  checkedIcon={false}
                  className="react-switch"
                  disabled={syncLoading}
                />
                <p className="help-block">
                  {T.translate("dropbox_sync.toggle_helper")}
                </p>
              </div>
            </div>
            <hr />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {T.translate("dropbox_sync.allowlist_label")}
              </Typography>
              <Alert
                data-testid="allowlist-banner"
                severity={syncConfig.dropbox_sync_enabled ? "info" : "warning"}
                sx={{ my: 1 }}
              >
                {bannerText()}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {T.translate("dropbox_sync.allowlist_helper")}
              </Typography>

              {optionsError !== null ? (
                <Alert
                  data-testid="allowlist-error"
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      data-testid="allowlist-retry"
                      onClick={handleRetryOptions}
                    >
                      {T.translate("dropbox_sync.allowlist_retry")}
                    </Button>
                  }
                >
                  {T.translate("dropbox_sync.allowlist_error")}
                </Alert>
              ) : (
                <FormGroup>
                  {visibleStoredRows.map((row) => {
                    const badgeKey = BADGE_KEY_BY_CASE[row.caseId];
                    const name = row.entry?.name ?? "";
                    // Interactive controls (the Remove button) render as
                    // siblings of the FormControlLabel, never inside its
                    // <label>, so a Remove click never competes with the
                    // checkbox's native label activation. Matches how
                    // FormControlLabel is used elsewhere in the repo.
                    const extras = (
                      <>
                        {badgeKey && (
                          <Chip
                            size="small"
                            data-testid="allowlist-badge"
                            color={BADGE_COLOR_BY_CASE[row.caseId]}
                            label={T.translate(badgeKey, row.badgeParams)}
                          />
                        )}
                        <Button
                          size="small"
                          color="error"
                          data-testid={`allowlist-remove-${row.uiKey}`}
                          onClick={() => handleRemoveStored(row.uiKey)}
                        >
                          {T.translate("general.remove")}
                        </Button>
                      </>
                    );
                    return (
                      <Box
                        key={row.uiKey}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                          ...(row.selectable ? {} : { py: 0.5, pl: 4 })
                        }}
                      >
                        {row.selectable ? (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!uncheckedKeys.has(row.uiKey)}
                                onChange={() => handleToggleStored(row.uiKey)}
                                inputProps={{
                                  "data-testid": `allowlist-check-${row.uiKey}`
                                }}
                              />
                            }
                            label={name}
                          />
                        ) : (
                          <span>{name}</span>
                        )}
                        {extras}
                      </Box>
                    );
                  })}
                  {availableOptions.map((opt) => (
                    <FormControlLabel
                      key={`option-${opt.id}`}
                      control={
                        <Checkbox
                          checked={pickedIds.has(opt.id)}
                          onChange={() => handleTogglePicked(opt.id)}
                          inputProps={{
                            "data-testid": `allowlist-option-${opt.id}`
                          }}
                        />
                      }
                      label={opt.name}
                    />
                  ))}
                </FormGroup>
              )}
              <Button
                variant="contained"
                data-testid="allowlist-save"
                disabled={saveDisabled}
                onClick={handleSaveAllowlist}
                sx={{ mt: 1 }}
              >
                {T.translate("dropbox_sync.allowlist_save")}
              </Button>
            </Box>
            <hr />
            <div className="row form-group">
              <div className="col-md-6">
                <h5>{T.translate("dropbox_sync.rebuild_title")}</h5>
                <p className="text-danger">
                  {T.translate("dropbox_sync.rebuild_warning")}
                </p>
                <button
                  className="btn btn-default"
                  onClick={handleRebuild}
                  disabled={syncLoading}
                >
                  <i className="fa fa-refresh" />{" "}
                  {T.translate("dropbox_sync.rebuild_button")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-md-6 col-md-offset-6 text-right">
          <button
            className="btn btn-primary right-space"
            onClick={handleNewLocation}
          >
            {T.translate("location_list.add_location")}
          </button>
          <SummitDropdown
            onClick={handleCopyLocations}
            actionLabel={T.translate("location_list.copy_locations")}
          />
        </div>
      </div>

      {locations.length === 0 && (
        <div className="no-items">{T.translate("location_list.no_items")}</div>
      )}

      {locations.length > 0 && (
        <div>
          <SortableTable
            options={table_options}
            data={sortedLocations}
            columns={columns}
            dropCallback={props.updateLocationOrder}
            orderField="order"
          />
        </div>
      )}
    </div>
  );
}

const mapStateToProps = ({
  currentSummitState,
  currentLocationListState,
  dropboxSyncState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  dropboxSyncState,
  ...currentLocationListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getLocations,
  updateLocationOrder,
  deleteLocation,
  exportLocations,
  copyLocations,
  getSyncConfig,
  updateSyncConfig,
  rebuildSync,
  getAllMediaUploadTypesForAllowlist
})(LocationListPage);
