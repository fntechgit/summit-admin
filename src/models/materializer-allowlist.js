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

import { TWO } from "../utils/constants";

export const DROPBOX_STORAGE = "DropBox";

/**
 * JS approximation of Python str.casefold() — the worker's key-space
 * (build_allowlist_set uses strip().casefold()). toUpperCase() first expands
 * full case foldings (ß→SS, ﬁ→FI) that toLowerCase() alone would miss.
 * KNOWN DIVERGENCE (accepted, see SDS plan note): JS merges dotless ı with i
 * while Python casefold keeps them distinct. Pinned by the divergence fixture.
 * This is the ONLY normalization site for the allowlist feature.
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
