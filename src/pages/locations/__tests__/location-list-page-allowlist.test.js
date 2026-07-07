import React from "react";
import { screen, fireEvent, act } from "@testing-library/react";
import LocationListPage, {
  normalizeName,
  isValidEntry,
  RECONCILE_CASE,
  reconcileAllowlist
} from "../location-list-page";
import { renderWithRedux } from "../../../utils/test-utils";
import {
  getSyncConfig,
  updateSyncConfig,
  getAllMediaUploadTypesForAllowlist
} from "../../../actions/dropbox-sync-actions";

// i18n mock echoes the key, and appends the interpolation params so badge
// substitutions (stored/current names, ids, counts) are assertable.
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key, params) =>
    params && Object.keys(params).length
      ? `${key} ${JSON.stringify(params)}`
      : key
}));

jest.mock("../../../components/summit-dropdown", () => () => null);

jest.mock("../../../actions/summit-actions", () => ({
  getSummitById: jest.fn(() => () => Promise.resolve())
}));

jest.mock("../../../actions/location-actions", () => ({
  getLocations: jest.fn(() => () => Promise.resolve()),
  deleteLocation: jest.fn(() => () => Promise.resolve()),
  exportLocations: jest.fn(() => () => Promise.resolve()),
  updateLocationOrder: jest.fn(() => () => Promise.resolve()),
  copyLocations: jest.fn(() => () => Promise.resolve())
}));

jest.mock("../../../actions/dropbox-sync-actions", () => ({
  getSyncConfig: jest.fn(() => () => Promise.resolve()),
  updateSyncConfig: jest.fn(() => () => Promise.resolve()),
  rebuildSync: jest.fn(() => () => Promise.resolve()),
  resyncRoom: jest.fn(() => () => Promise.resolve()),
  getAllMediaUploadTypesForAllowlist: jest.fn(() => () => Promise.resolve())
}));

// ---- fixtures -------------------------------------------------------------

const dropboxType = (id, name) => ({
  id,
  name,
  private_storage_type: "DropBox"
});
const localType = (id, name) => ({ id, name, private_storage_type: "Local" });

const buildState = ({ syncConfig = {}, allowlistOptions = {} } = {}) => ({
  currentSummitState: {
    currentSummit: { id: 1, name: "Test Summit" }
  },
  currentLocationListState: { locations: [], totalLocations: 0 },
  dropboxSyncState: {
    loading: false,
    syncConfig: {
      summit_id: 1,
      dropbox_sync_enabled: true,
      preflight_alert_email: null,
      materialized_media_upload_types: [],
      ...syncConfig
    },
    allowlistOptions: { options: [], error: null, ...allowlistOptions }
  }
});

const mountPanel = (opts) =>
  renderWithRedux(<LocationListPage history={{ push: jest.fn() }} />, {
    initialState: buildState(opts)
  });

const badgeTexts = () =>
  screen.queryAllByTestId("allowlist-badge").map((n) => n.textContent);

const saveButton = () => screen.getByTestId("allowlist-save");

const clickSave = () => {
  act(() => {
    fireEvent.click(saveButton());
  });
};

const lastSavePayload = () => {
  const call =
    updateSyncConfig.mock.calls[updateSyncConfig.mock.calls.length - 1];
  return call[0].materialized_media_upload_types;
};

beforeEach(() => {
  window.DROPBOX_MATERIALIZER_API_BASE_URL = "https://materializer.test";
  jest.clearAllMocks();
});

afterEach(() => {
  delete window.DROPBOX_MATERIALIZER_API_BASE_URL;
});

// ===========================================================================
// 3a. Reconciliation named exports (pure unit tests)
// ===========================================================================

describe("normalizeName", () => {
  test("worker parity: trims then casefolds", () => {
    expect(normalizeName("  Final Poster  ")).toBe("final poster");
  });

  test("non-ASCII parity: Straße folds equal to STRASSE", () => {
    expect(normalizeName("Straße")).toBe(normalizeName("STRASSE"));
    expect(normalizeName("Straße")).toBe("strasse");
  });

  // KNOWN DIVERGENCE from Python str.casefold(): JS toUpperCase().toLowerCase()
  // merges the dotless "ı" with "i", while Python casefold keeps them distinct.
  // This is an accepted, documented decision (see plan note). If this pin fails
  // someone changed the normalization strategy and must re-read that note before
  // "fixing" it -- the consequence is a silent Case-1 no-badge + skipped worker
  // repair for ı/i name collisions.
  test("known-divergence pin: dotless ı folds to i (JS-only, NOT Python parity)", () => {
    expect(normalizeName("ı")).toBe("i");
  });

  test("non-string input yields empty string", () => {
    expect(normalizeName(123)).toBe("");
    expect(normalizeName(null)).toBe("");
    expect(normalizeName(undefined)).toBe("");
  });
});

describe("isValidEntry", () => {
  test.each([
    ["non-positive (zero) id", { id: 0, name: "X" }],
    ["negative id", { id: -5, name: "X" }],
    ["bool id", { id: true, name: "X" }],
    ["string id", { id: "5", name: "X" }],
    ["null id", { id: null, name: "X" }],
    ["missing id key", { name: "X" }],
    ["empty name", { id: 5, name: "" }],
    ["whitespace-only name", { id: 5, name: "   " }],
    ["numeric name", { id: 5, name: 123 }],
    ["null name", { id: 5, name: null }],
    ["missing name key", { id: 5 }],
    ["non-object entry", "not-an-object"]
  ])("rejects %s", (_label, entry) => {
    expect(isValidEntry(entry)).toBe(false);
  });

  test("accepts a positive-int id + non-empty string name", () => {
    expect(isValidEntry({ id: 5, name: "X" })).toBe(true);
  });
});

describe("reconcileAllowlist decision table", () => {
  test("row 1: id+name match, DropBox -> OK, no badge, stored payload", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [dropboxType(1, "Final Poster")]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].caseId).toBe(RECONCILE_CASE.OK);
    expect(rows[0].savePayload).toEqual({ id: 1, name: "Final Poster" });
    expect(rows[0].selectable).toBe(true);
  });

  test("row 2: id match, name differs, DropBox -> RENAMED, current name in payload", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Old Name" }],
      [dropboxType(1, "New Name")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.RENAMED);
    expect(rows[0].badgeParams).toEqual({
      stored: "Old Name",
      current: "New Name"
    });
    expect(rows[0].savePayload).toEqual({ id: 1, name: "New Name" });
  });

  test("row 3: id+name match, storage Local -> NOT_DROPBOX, stored payload", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [localType(1, "Final Poster")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.NOT_DROPBOX);
    expect(rows[0].savePayload).toEqual({ id: 1, name: "Final Poster" });
  });

  test("row 3: id+name match, storage null -> NOT_DROPBOX", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [{ id: 1, name: "Final Poster", private_storage_type: null }]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.NOT_DROPBOX);
  });

  test("row 4: id match, name differs, non-DropBox -> RENAMED_NOT_DROPBOX", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Old Name" }],
      [localType(1, "New Name")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.RENAMED_NOT_DROPBOX);
    expect(rows[0].badgeParams).toEqual({
      stored: "Old Name",
      current: "New Name"
    });
    expect(rows[0].savePayload).toEqual({ id: 1, name: "New Name" });
  });

  test("row 5: id gone, exactly 1 DropBox name-match -> RECREATED auto-relink", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [dropboxType(99, "Final Poster")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.RECREATED);
    expect(rows[0].badgeParams).toEqual({ storedId: 1, currentId: 99 });
    expect(rows[0].savePayload).toEqual({ id: 99, name: "Final Poster" });
  });

  test("row 5: case-insensitive name match relinks (stored 'Final Poster' vs 'FINAL POSTER  ')", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [dropboxType(99, "FINAL POSTER  ")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.RECREATED);
    expect(rows[0].savePayload).toEqual({ id: 99, name: "FINAL POSTER  " });
  });

  test("row 6: id gone, exactly 1 non-DropBox name-match -> RECREATED_NOT_DROPBOX auto-relink", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [localType(99, "Final Poster")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.RECREATED_NOT_DROPBOX);
    expect(rows[0].badgeParams).toEqual({ storedId: 1, currentId: 99 });
    expect(rows[0].savePayload).toEqual({ id: 99, name: "Final Poster" });
  });

  test("row 7: 2 DropBox name-matches -> AMBIGUOUS(2), stored payload, non-selectable", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [dropboxType(99, "Final Poster"), dropboxType(100, "FINAL POSTER")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.AMBIGUOUS);
    expect(rows[0].badgeParams).toEqual({ count: 2 });
    expect(rows[0].savePayload).toEqual({ id: 1, name: "Final Poster" });
    expect(rows[0].selectable).toBe(false);
  });

  test("row 7: DropBox + Local name-matches -> AMBIGUOUS(2)", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [dropboxType(99, "Final Poster"), localType(100, "Final Poster")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.AMBIGUOUS);
    expect(rows[0].badgeParams).toEqual({ count: 2 });
  });

  test("row 7: 3 name-matches -> AMBIGUOUS(3) (locks >= 2, not === 2)", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [
        dropboxType(99, "Final Poster"),
        localType(100, "Final Poster"),
        dropboxType(101, "final poster")
      ]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.AMBIGUOUS);
    expect(rows[0].badgeParams).toEqual({ count: 3 });
  });

  test("row 8: id gone, 0 name-matches -> MISSING, stored payload", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [dropboxType(99, "Something Else")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.MISSING);
    expect(rows[0].savePayload).toEqual({ id: 1, name: "Final Poster" });
  });

  test("reconciliation uses the FULL list: stored type now Local -> Case 3, not Case 8", () => {
    const rows = reconcileAllowlist(
      [{ id: 1, name: "Final Poster" }],
      [localType(1, "Final Poster")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.NOT_DROPBOX);
    expect(rows[0].caseId).not.toBe(RECONCILE_CASE.MISSING);
  });
});

describe("reconcileAllowlist Case 0 + dedup pipeline", () => {
  const CASE0 = [
    { id: 0, name: "X" },
    { id: -5, name: "X" },
    { id: true, name: "X" },
    { id: "5", name: "X" },
    { id: null, name: "X" },
    { name: "X" },
    { id: 5, name: "" },
    { id: 5, name: "   " },
    { id: 5, name: 123 },
    { id: 5, name: null },
    { id: 5 },
    "not-an-object"
  ];

  test.each(CASE0.map((e, i) => [i, e]))(
    "invalid stored entry #%i -> INVALID case, null payload, non-selectable",
    (_i, entry) => {
      const rows = reconcileAllowlist([entry], [dropboxType(5, "X")]);
      expect(rows).toHaveLength(1);
      expect(rows[0].caseId).toBe(RECONCILE_CASE.INVALID);
      expect(rows[0].savePayload).toBeNull();
      expect(rows[0].selectable).toBe(false);
    }
  );

  test("valid dup ids: first occurrence wins, later duplicate produces NO row", () => {
    const rows = reconcileAllowlist(
      [
        { id: 5, name: "A" },
        { id: 5, name: "B" },
        { id: 7, name: "C" }
      ],
      [dropboxType(5, "A"), dropboxType(7, "C")]
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].savePayload).toEqual({ id: 5, name: "A" });
    expect(rows[1].savePayload).toEqual({ id: 7, name: "C" });
  });

  test("Order A [valid, invalid-same-id]: valid survives, invalid renders Case 0", () => {
    const rows = reconcileAllowlist(
      [
        { id: 5, name: "X" },
        { id: 5, name: "" }
      ],
      [dropboxType(5, "X")]
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].caseId).toBe(RECONCILE_CASE.OK);
    expect(rows[1].caseId).toBe(RECONCILE_CASE.INVALID);
  });

  test("Order B [invalid, valid-same-id]: valid ALWAYS survives", () => {
    const rows = reconcileAllowlist(
      [
        { id: 5, name: "" },
        { id: 5, name: "X" }
      ],
      [dropboxType(5, "X")]
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].caseId).toBe(RECONCILE_CASE.INVALID);
    expect(rows[1].caseId).toBe(RECONCILE_CASE.OK);
    expect(rows[1].savePayload).toEqual({ id: 5, name: "X" });
  });

  test("all-invalid duplicates -> two independent Case-0 rows", () => {
    const rows = reconcileAllowlist(
      [
        { id: true, name: "X" },
        { id: true, name: "Y" }
      ],
      []
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].caseId).toBe(RECONCILE_CASE.INVALID);
    expect(rows[1].caseId).toBe(RECONCILE_CASE.INVALID);
  });

  test("mutual exclusivity: every row carries exactly one caseId", () => {
    const rows = reconcileAllowlist(
      [
        { id: 1, name: "Final Poster" },
        { id: 2, name: "Old Deck" },
        { id: 0, name: "bad" }
      ],
      [dropboxType(1, "Final Poster"), dropboxType(2, "New Deck")]
    );
    rows.forEach((r) => {
      expect(Object.values(RECONCILE_CASE)).toContain(r.caseId);
    });
    expect(rows.map((r) => r.caseId)).toEqual([
      RECONCILE_CASE.OK,
      RECONCILE_CASE.RENAMED,
      RECONCILE_CASE.INVALID
    ]);
  });

  test("Case-0 precedence: {id:0,name:'Final Poster'} with live DropBox match -> INVALID not RECREATED", () => {
    const rows = reconcileAllowlist(
      [{ id: 0, name: "Final Poster" }],
      [dropboxType(99, "Final Poster")]
    );
    expect(rows[0].caseId).toBe(RECONCILE_CASE.INVALID);
    expect(rows[0].caseId).not.toBe(RECONCILE_CASE.RECREATED);
  });
});

// ===========================================================================
// 3c. Panel component tests (render / wiring; classification unit-tested above)
// ===========================================================================

describe("Allowlist panel - mount + options filtering", () => {
  test("dispatches the aggregator on mount inside the materializer gate", () => {
    mountPanel();
    expect(getAllMediaUploadTypesForAllowlist).toHaveBeenCalledTimes(1);
    expect(getSyncConfig).toHaveBeenCalledTimes(1);
  });

  test("does NOT dispatch the aggregator when the materializer flag is absent", () => {
    delete window.DROPBOX_MATERIALIZER_API_BASE_URL;
    mountPanel();
    expect(getAllMediaUploadTypesForAllowlist).not.toHaveBeenCalled();
  });

  test("options are DropBox-filtered; reconciliation uses full list (Case 3 not missing)", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Poster" }]
      },
      allowlistOptions: {
        options: [localType(1, "Poster"), dropboxType(2, "Deck")]
      }
    });
    // reconciliation on the full list -> Case 3 badge (not "missing")
    expect(badgeTexts()).toEqual([
      expect.stringContaining("allowlist_badge_not_dropbox")
    ]);
    // only the DropBox type is offered as a new selection option
    expect(screen.queryByTestId("allowlist-option-2")).toBeInTheDocument();
    expect(screen.queryByTestId("allowlist-option-1")).not.toBeInTheDocument();
  });
});

describe("Allowlist panel - per-row rendering + save payload", () => {
  test("Case 1: no badge; save payload is the stored entry", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Final Poster" }]
      },
      allowlistOptions: { options: [dropboxType(1, "Final Poster")] }
    });
    expect(badgeTexts()).toHaveLength(0);
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 1, name: "Final Poster" }]);
  });

  test("Case 2: renamed badge shows stored+current; payload uses current name", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Old Name" }]
      },
      allowlistOptions: { options: [dropboxType(1, "New Name")] }
    });
    const [badge] = badgeTexts();
    expect(badge).toContain("allowlist_badge_renamed");
    expect(badge).toContain("Old Name");
    expect(badge).toContain("New Name");
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 1, name: "New Name" }]);
  });

  test.each([
    ["Local", localType(1, "Poster")],
    ["null", { id: 1, name: "Poster", private_storage_type: null }]
  ])(
    "Case 3 (%s storage): not-DropBox badge; stored payload",
    (_label, type) => {
      mountPanel({
        syncConfig: {
          materialized_media_upload_types: [{ id: 1, name: "Poster" }]
        },
        allowlistOptions: { options: [type] }
      });
      expect(badgeTexts()[0]).toContain("allowlist_badge_not_dropbox");
      clickSave();
      expect(lastSavePayload()).toEqual([{ id: 1, name: "Poster" }]);
    }
  );

  test("Case 4: renamed + not-DropBox badge; payload uses current name", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Old Name" }]
      },
      allowlistOptions: { options: [localType(1, "New Name")] }
    });
    const [badge] = badgeTexts();
    expect(badge).toContain("allowlist_badge_renamed_not_dropbox");
    expect(badge).toContain("Old Name");
    expect(badge).toContain("New Name");
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 1, name: "New Name" }]);
  });

  test("Case 5: re-created badge shows ids; payload relinks to current id+name", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Final Poster" }]
      },
      allowlistOptions: { options: [dropboxType(99, "Final Poster")] }
    });
    const [badge] = badgeTexts();
    expect(badge).toContain("allowlist_badge_recreated");
    expect(badge).toContain("\"storedId\":1");
    expect(badge).toContain("\"currentId\":99");
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 99, name: "Final Poster" }]);
  });

  test("Case 6: re-created + not-DropBox badge; payload relinks", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Final Poster" }]
      },
      allowlistOptions: { options: [localType(99, "Final Poster")] }
    });
    expect(badgeTexts()[0]).toContain("allowlist_badge_recreated_not_dropbox");
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 99, name: "Final Poster" }]);
  });

  test("Case 7: ambiguous badge with count; stored payload; Save enabled via other rows", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Final Poster" }]
      },
      allowlistOptions: {
        options: [
          dropboxType(99, "Final Poster"),
          dropboxType(100, "FINAL POSTER")
        ]
      }
    });
    const [badge] = badgeTexts();
    expect(badge).toContain("allowlist_badge_ambiguous");
    expect(badge).toContain("\"count\":2");
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 1, name: "Final Poster" }]);
  });

  test("Case 8: missing badge; stored payload", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Final Poster" }]
      },
      allowlistOptions: { options: [dropboxType(99, "Other")] }
    });
    expect(badgeTexts()[0]).toContain("allowlist_badge_missing");
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 1, name: "Final Poster" }]);
  });
});

describe("Allowlist panel - Case 0 mounted sub-fixtures", () => {
  const CASE0 = [
    ["zero id", { id: 0, name: "X" }],
    ["negative id", { id: -5, name: "X" }],
    ["bool id", { id: true, name: "X" }],
    ["string id", { id: "5", name: "X" }],
    ["null id", { id: null, name: "X" }],
    ["missing id", { name: "X" }],
    ["empty name", { id: 5, name: "" }],
    ["whitespace name", { id: 5, name: "   " }],
    ["numeric name", { id: 5, name: 123 }],
    ["null name", { id: 5, name: null }],
    ["missing name", { id: 5 }],
    ["non-object", "not-an-object"]
  ];

  test.each(CASE0)(
    "%s: invalid badge renders + Save disabled (empty effective selection)",
    (_label, entry) => {
      mountPanel({
        syncConfig: { materialized_media_upload_types: [entry] },
        allowlistOptions: { options: [] }
      });
      expect(badgeTexts()[0]).toContain("allowlist_badge_invalid");
      expect(saveButton()).toBeDisabled();
    }
  );

  test("granular omission: one valid + one Case-0 -> payload has only valid; Save enabled", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [
          { id: 1, name: "Final Poster" },
          { id: 0, name: "bad" }
        ]
      },
      allowlistOptions: { options: [dropboxType(1, "Final Poster")] }
    });
    expect(saveButton()).not.toBeDisabled();
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 1, name: "Final Poster" }]);
  });
});

describe("Allowlist panel - pre-table pipeline (mounted)", () => {
  test("pure valid dup: two rows, no badge on survivor, payload has both deduped", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [
          { id: 5, name: "A" },
          { id: 5, name: "B" },
          { id: 7, name: "C" }
        ]
      },
      allowlistOptions: { options: [dropboxType(5, "A"), dropboxType(7, "C")] }
    });
    expect(badgeTexts()).toHaveLength(0);
    clickSave();
    expect(lastSavePayload()).toEqual([
      { id: 5, name: "A" },
      { id: 7, name: "C" }
    ]);
  });

  test("Order A [valid, invalid]: invalid badge on the invalid; payload only valid", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [
          { id: 5, name: "X" },
          { id: 5, name: "" }
        ]
      },
      allowlistOptions: { options: [dropboxType(5, "X")] }
    });
    expect(badgeTexts()).toEqual([
      expect.stringContaining("allowlist_badge_invalid")
    ]);
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 5, name: "X" }]);
  });

  test("Order B [invalid, valid]: valid not lost; payload only valid", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [
          { id: 5, name: "" },
          { id: 5, name: "X" }
        ]
      },
      allowlistOptions: { options: [dropboxType(5, "X")] }
    });
    expect(badgeTexts()).toEqual([
      expect.stringContaining("allowlist_badge_invalid")
    ]);
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 5, name: "X" }]);
  });

  test("all-invalid dup: two invalid badges; Save disabled", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [
          { id: true, name: "X" },
          { id: true, name: "Y" }
        ]
      },
      allowlistOptions: { options: [] }
    });
    expect(badgeTexts()).toHaveLength(2);
    badgeTexts().forEach((t) => expect(t).toContain("allowlist_badge_invalid"));
    expect(saveButton()).toBeDisabled();
  });

  test("mounted Case-0 precedence: invalid badge wins over re-created", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 0, name: "Final Poster" }]
      },
      allowlistOptions: { options: [dropboxType(99, "Final Poster")] }
    });
    expect(badgeTexts()[0]).toContain("allowlist_badge_invalid");
    expect(badgeTexts()[0]).not.toContain("allowlist_badge_recreated");
  });
});

describe("Allowlist panel - payload dedupe under double relink", () => {
  test("two stale ids both relinking to one live type -> id appears once in payload", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [
          { id: 1, name: "Final Poster" },
          { id: 2, name: "final poster" }
        ]
      },
      allowlistOptions: { options: [dropboxType(99, "Final Poster")] }
    });
    // both rows render a re-created badge
    expect(badgeTexts()).toHaveLength(2);
    badgeTexts().forEach((t) =>
      expect(t).toContain("allowlist_badge_recreated")
    );
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 99, name: "Final Poster" }]);
  });
});

describe("Allowlist panel - remove vs uncheck (two-set model)", () => {
  test("uncheck: row stays, option does NOT resurface, selection empties (Save disabled)", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Poster" }]
      },
      allowlistOptions: { options: [dropboxType(1, "Poster")] }
    });
    // suppressed while checked
    expect(screen.queryByTestId("allowlist-option-1")).not.toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-check-stored-0"));
    });
    // still visible, still suppressing its option, selection now empty
    expect(screen.getByTestId("allowlist-check-stored-0")).toBeInTheDocument();
    expect(screen.queryByTestId("allowlist-option-1")).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    // re-check restores
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-check-stored-0"));
    });
    expect(saveButton()).not.toBeDisabled();
  });

  test("remove: row disappears, option resurfaces, re-pick puts live {id,name} back", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Poster" }]
      },
      allowlistOptions: { options: [dropboxType(1, "Poster")] }
    });
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-remove-stored-0"));
    });
    // row gone, option resurfaced
    expect(
      screen.queryByTestId("allowlist-check-stored-0")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("allowlist-option-1")).toBeInTheDocument();
    // pick the resurfaced option
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-option-1"));
    });
    expect(saveButton()).not.toBeDisabled();
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 1, name: "Poster" }]);
  });
});

describe("Allowlist panel - Case 7 remove-and-repick", () => {
  test("ambiguous row removable; payload drops it; re-pick adds live record", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [
          { id: 1, name: "Final Poster" },
          { id: 2, name: "Keynote Deck" }
        ]
      },
      allowlistOptions: {
        options: [
          dropboxType(99, "Final Poster"),
          dropboxType(100, "FINAL POSTER"),
          dropboxType(2, "Keynote Deck")
        ]
      }
    });
    // ambiguous badge present, stored entry present in payload while visible
    expect(badgeTexts()[0]).toContain("allowlist_badge_ambiguous");
    clickSave();
    expect(lastSavePayload()).toEqual([
      { id: 1, name: "Final Poster" },
      { id: 2, name: "Keynote Deck" }
    ]);
    // remove the ambiguous row
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-remove-stored-0"));
    });
    expect(saveButton()).not.toBeDisabled();
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 2, name: "Keynote Deck" }]);
    // re-pick one of the ambiguous live types
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-option-99"));
    });
    clickSave();
    expect(lastSavePayload()).toEqual([
      { id: 2, name: "Keynote Deck" },
      { id: 99, name: "Final Poster" }
    ]);
  });
});

describe("Allowlist panel - error + empty gating", () => {
  test("error state: options hidden, Alert + Retry rendered, Save disabled", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Poster" }]
      },
      allowlistOptions: { options: [], error: "fetch failed" }
    });
    expect(screen.getByTestId("allowlist-error")).toBeInTheDocument();
    expect(screen.queryByTestId("allowlist-option-1")).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    // Retry re-dispatches the aggregator (already called once on mount)
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-retry"));
    });
    expect(getAllMediaUploadTypesForAllowlist).toHaveBeenCalledTimes(2);
  });

  test("recovery: fresh mount with options + selection re-enables Save", () => {
    mountPanel({
      syncConfig: {
        materialized_media_upload_types: [{ id: 1, name: "Poster" }]
      },
      allowlistOptions: { options: [dropboxType(1, "Poster")], error: null }
    });
    expect(saveButton()).not.toBeDisabled();
  });

  test("empty selection disables Save; picking one enables; deselecting re-disables", () => {
    mountPanel({
      syncConfig: { materialized_media_upload_types: [] },
      allowlistOptions: { options: [dropboxType(1, "Poster")] }
    });
    expect(saveButton()).toBeDisabled();
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-option-1"));
    });
    expect(saveButton()).not.toBeDisabled();
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-option-1"));
    });
    expect(saveButton()).toBeDisabled();
  });
});

// ===========================================================================
// Stable empty-array fallbacks — regression guard
// ===========================================================================
// Before the fix: `syncConfig.materialized_media_upload_types || []` and
// `allowlistOptions?.options || []` mint a NEW array identity on every render
// when the field is absent/undefined. Both arrays are deps of the reset
// useEffect, so the effect fires every render → 4× setState → re-render loop
// → "Maximum update depth exceeded".
// After the fix: module-scope EMPTY_ARRAY + Array.isArray guard gives a stable
// identity, breaking the loop.
describe("Allowlist panel - stable empty-array fallbacks (regression)", () => {
  test("renders without throwing when syncConfig lacks materialized_media_upload_types", () => {
    // Simulate an out-of-contract RECEIVE_SYNC_CONFIG that omits the key entirely
    const state = {
      currentSummitState: {
        currentSummit: { id: 1, name: "Test Summit" }
      },
      currentLocationListState: { locations: [], totalLocations: 0 },
      dropboxSyncState: {
        loading: false,
        syncConfig: {
          summit_id: 1,
          dropbox_sync_enabled: true,
          preflight_alert_email: null
          // materialized_media_upload_types intentionally omitted
        },
        allowlistOptions: { options: [], error: null }
      }
    };
    renderWithRedux(<LocationListPage history={{ push: jest.fn() }} />, {
      initialState: state
    });
    // Page must render — banner is the first always-visible element in the panel
    expect(screen.getByTestId("allowlist-banner")).toBeInTheDocument();
  });

  test("renders without throwing when allowlistOptions.options is undefined", () => {
    const state = {
      currentSummitState: {
        currentSummit: { id: 1, name: "Test Summit" }
      },
      currentLocationListState: { locations: [], totalLocations: 0 },
      dropboxSyncState: {
        loading: false,
        syncConfig: {
          summit_id: 1,
          dropbox_sync_enabled: true,
          preflight_alert_email: null,
          materialized_media_upload_types: []
        },
        allowlistOptions: { options: undefined, error: null }
      }
    };
    renderWithRedux(<LocationListPage history={{ push: jest.fn() }} />, {
      initialState: state
    });
    expect(screen.getByTestId("allowlist-banner")).toBeInTheDocument();
  });
});

describe("Allowlist panel - saved-state banner", () => {
  test("active + non-empty: names in stored order", () => {
    mountPanel({
      syncConfig: {
        dropbox_sync_enabled: true,
        materialized_media_upload_types: [
          { id: 1, name: "Alpha" },
          { id: 2, name: "Bravo" }
        ]
      },
      allowlistOptions: {
        options: [dropboxType(1, "Alpha"), dropboxType(2, "Bravo")]
      }
    });
    const banner = screen.getByTestId("allowlist-banner").textContent;
    expect(banner).toContain("banner_active");
    expect(banner).toContain("Alpha, Bravo");
  });

  test("active + stored-empty: nothing-will-sync banner", () => {
    mountPanel({
      syncConfig: {
        dropbox_sync_enabled: true,
        materialized_media_upload_types: []
      }
    });
    expect(screen.getByTestId("allowlist-banner").textContent).toContain(
      "banner_active_empty"
    );
  });

  test("active + only-invalid stored entries: nothing-will-sync banner, no crash", () => {
    mountPanel({
      syncConfig: {
        dropbox_sync_enabled: true,
        materialized_media_upload_types: [null, "oops", { id: 1 }]
      }
    });
    expect(screen.getByTestId("allowlist-banner").textContent).toContain(
      "banner_active_empty"
    );
  });

  test("active + mixed valid/invalid stored entries: only valid names shown", () => {
    mountPanel({
      syncConfig: {
        dropbox_sync_enabled: true,
        materialized_media_upload_types: [
          null,
          { id: 1, name: "Alpha" },
          { id: 2 }
        ]
      },
      allowlistOptions: { options: [dropboxType(1, "Alpha")] }
    });
    const banner = screen.getByTestId("allowlist-banner").textContent;
    expect(banner).toContain("Alpha");
    expect(banner).not.toContain("undefined");
  });

  test("inactive: inactive banner regardless of stored allowlist", () => {
    mountPanel({
      syncConfig: {
        dropbox_sync_enabled: false,
        materialized_media_upload_types: [{ id: 1, name: "Alpha" }]
      },
      allowlistOptions: { options: [dropboxType(1, "Alpha")] }
    });
    expect(screen.getByTestId("allowlist-banner").textContent).toContain(
      "banner_inactive"
    );
  });

  test("transition proof: unsaved edit does not move banner; Save PUTs new payload; fresh mount shows new names", () => {
    // (a) pre-save mount
    mountPanel({
      syncConfig: {
        dropbox_sync_enabled: true,
        materialized_media_upload_types: [
          { id: 1, name: "Alpha" },
          { id: 2, name: "Bravo" }
        ]
      },
      allowlistOptions: {
        options: [dropboxType(1, "Alpha"), dropboxType(2, "Bravo")]
      }
    });
    // unsaved picker edit: uncheck Bravo
    act(() => {
      fireEvent.click(screen.getByTestId("allowlist-check-stored-1"));
    });
    // banner reads SAVED config -> unchanged
    expect(screen.getByTestId("allowlist-banner").textContent).toContain(
      "Alpha, Bravo"
    );
    // (b) Save dispatches new payload
    clickSave();
    expect(lastSavePayload()).toEqual([{ id: 1, name: "Alpha" }]);

    // (c) fresh mount from the post-save syncConfig -> banner shows only Alpha
    mountPanel({
      syncConfig: {
        dropbox_sync_enabled: true,
        materialized_media_upload_types: [{ id: 1, name: "Alpha" }]
      },
      allowlistOptions: { options: [dropboxType(1, "Alpha")] }
    });
    const banners = screen.getAllByTestId("allowlist-banner");
    const fresh = banners[banners.length - 1].textContent;
    expect(fresh).toContain("Alpha");
    expect(fresh).not.toContain("Bravo");
  });
});
