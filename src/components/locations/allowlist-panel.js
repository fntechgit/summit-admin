/**
 * Copyright 2026 OpenStack Foundation
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

import React, { useEffect, useMemo, useState } from "react";
import T from "i18n-react/dist/i18n-react";
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
import {
  DROPBOX_STORAGE,
  RECONCILE_CASE,
  isValidEntry,
  reconcileAllowlist
} from "../../models/materializer-allowlist";

// Stable sentinel used as a fallback when redux fields are absent/non-array.
// A module-scope constant has a fixed identity, so memo/effect deps that
// reference it don't change on every render (preventing "Maximum update depth
// exceeded" when RECEIVE_SYNC_CONFIG omits materialized_media_upload_types).
const EMPTY_ARRAY = [];

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

function AllowlistPanel({
  syncConfig,
  allowlistOptions,
  syncLoading,
  onSave,
  onRetryOptions
}) {
  const storedTypes = Array.isArray(syncConfig.materialized_media_upload_types)
    ? syncConfig.materialized_media_upload_types
    : EMPTY_ARRAY;
  const options = Array.isArray(allowlistOptions?.options)
    ? allowlistOptions.options
    : EMPTY_ARRAY;
  const optionsError = allowlistOptions?.error ?? null;
  // Until the options fetch has committed once, reconciling stored rows would
  // badge everything Case 8 ("missing") against a list that merely hasn't
  // arrived. The global loading overlay normally hides this, but it is a
  // shared non-ref-counted boolean — any parallel fetch (getLocations) that
  // finishes first drops it mid-flight. Gate on data, not on the overlay.
  const optionsLoaded = allowlistOptions?.loaded === true;

  // Derived state, not duplicate state: rows are a pure function of
  // storedTypes + options, so they recompute in-render — no commit ever pairs
  // fresh inputs with stale rows.
  const storedRows = useMemo(
    () =>
      reconcileAllowlist(storedTypes, options).map((row, index) => ({
        ...row,
        uiKey: `stored-${index}`
      })),
    [storedTypes, options]
  );

  // Selection model — minimal local state, derived rendering (see SDS § State).
  const [uncheckedKeys, setUncheckedKeys] = useState(() => new Set());
  const [removedKeys, setRemovedKeys] = useState(() => new Set());
  const [pickedIds, setPickedIds] = useState(() => new Set());

  // Reset the selection whenever the stored allowlist or the options list
  // changes (the rows themselves recompute in-render via the memo above).
  useEffect(() => {
    setUncheckedKeys(new Set());
    setRemovedKeys(new Set());
    setPickedIds(new Set());
  }, [storedTypes, options]);

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
  // syncLoading matches the Sync toggle / Rebuild guards: no Save while a
  // config GET or PUT is in flight (updateSyncConfig dispatches
  // REQUEST_SYNC_CONFIG pre-token, so overlapping saves are mutually
  // exclusive too). !optionsLoaded: never save rows reconciled against an
  // options list that hasn't arrived.
  const saveDisabled =
    optionsError !== null ||
    !optionsLoaded ||
    selectedCount === 0 ||
    syncLoading;

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
  const handleSaveAllowlist = () => onSave(buildSavePayload());

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

  return (
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
              onClick={onRetryOptions}
            >
              {T.translate("dropbox_sync.allowlist_retry")}
            </Button>
          }
        >
          {T.translate("dropbox_sync.allowlist_error")}
        </Alert>
      ) : (
        optionsLoaded && (
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
        )
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
  );
}

export default AllowlistPanel;
