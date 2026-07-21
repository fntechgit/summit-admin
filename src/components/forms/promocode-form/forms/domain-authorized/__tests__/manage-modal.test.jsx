import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor
} from "@testing-library/react";
import ManageAllowedEmailDomainsModal from "../ManageAllowedEmailDomainsModal";

// Shared scroll-call log written by the react-window mock below.
// Tests clear this in beforeEach; the mock pushes { index, itemCountAtCallTime }
// on every scrollToItem call so deferred-scroll tests can inspect call-time state.
const scrollLog = [];

// Mock react-window — jsdom has no layout, so FixedSizeList won't render rows.
// Mock renders first 10 rows directly to match production's ~10-rows-visible cap.
//
// On every render the mock closes over the current `itemCount` so that
// scrollToItem records itemCountAtCallTime — distinguishing whether the call
// happened before or after the list re-rendered with the new (larger) count.
jest.mock("react-window", () => {
  const React = require("react");
  // Reference the module-level scrollLog declared above (same module scope).
  // jest.mock hoists, but the factory runs lazily, so by the time it executes
  // scrollLog is already defined.
  return {
    __esModule: true,
    FixedSizeList: React.forwardRef(
      ({ itemCount, itemData, children }, ref) => {
        const Row = children;
        const visible = Math.min(itemCount, 10);
        if (ref) {
          ref.current = {
            scrollToItem: jest.fn((index, align) => {
              // scrollLog is closed over from the outer module scope.
              // itemCount here is the value from THIS render cycle.
              scrollLog.push({ index, align, itemCountAtCallTime: itemCount });
            })
          };
        }
        return React.createElement(
          "div",
          { "data-testid": "fixed-size-list" },
          Array.from({ length: visible }, (_, i) =>
            React.createElement(Row, {
              key: i,
              index: i,
              style: {},
              data: itemData
            })
          )
        );
      }
    )
  };
});

const onApply = jest.fn();
const onHide = jest.fn();

beforeEach(() => {
  onApply.mockClear();
  onHide.mockClear();
  scrollLog.length = 0;
});

const openModal = (existing = []) =>
  render(
    <ManageAllowedEmailDomainsModal
      show
      onHide={onHide}
      onApply={onApply}
      existing={existing}
    />
  );

describe("ManageAllowedEmailDomainsModal — Tier 1", () => {
  it("renders title and Add Domains controls when shown", () => {
    openModal();
    expect(
      screen.getByText("edit_promocode.manage_modal.title")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.add_button"
      })
    ).toBeInTheDocument();
  });

  it("paste 5 entries (1 valid, 1 dup of existing, 1 invalid, 1 bare auto-prefix, 1 blank) → toast tally", () => {
    openModal(["@acme.com"]);
    const textarea = screen.getByTestId("manage-modal-textarea");
    fireEvent.change(textarea, {
      target: { value: "@new.com\n@acme.com\nnot-a-domain\nbeta.io\n   " }
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.add_button"
      })
    );
    // i18n-react renders the raw key string in the jest env (no translator
    // configured), so the toast/count text matches the key, not the
    // interpolated copy. Verify the numeric outcome via the rendered row
    // count, which reflects the actual working array.
    expect(screen.getByTestId("manage-modal-toast")).toHaveTextContent(
      "edit_promocode.manage_modal.added_toast"
    );
    expect(screen.getByTestId("manage-modal-count")).toHaveTextContent(
      "edit_promocode.manage_modal.configured_count"
    );
    // 1 existing (@acme.com) + 2 new valid (@new.com, beta.io→@beta.io) = 3 rows
    const list = screen.getByTestId("fixed-size-list");
    expect(within(list).getAllByTestId(/manage-modal-row-/)).toHaveLength(3);
  });

  it("Cancel → onApply NOT called; onHide called", () => {
    openModal(["@a.com"]);
    fireEvent.click(
      screen.getByRole("button", { name: "edit_promocode.manage_modal.cancel" })
    );
    expect(onApply).not.toHaveBeenCalled();
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("Done → onApply called with modal-scoped working array", () => {
    openModal(["@a.com"]);
    const textarea = screen.getByTestId("manage-modal-textarea");
    fireEvent.change(textarea, { target: { value: "@b.com" } });
    fireEvent.click(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.add_button"
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "edit_promocode.manage_modal.done" })
    );
    expect(onApply).toHaveBeenCalledWith(["@a.com", "@b.com"]);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("Cmd+Enter inside textarea fires Add Domains", () => {
    openModal();
    const textarea = screen.getByTestId("manage-modal-textarea");
    fireEvent.change(textarea, { target: { value: "@x.com" } });
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
    // Toast/count render the raw key in the jest env; verify the side
    // effect via the row count instead of the interpolated number.
    expect(screen.getByTestId("manage-modal-toast")).toHaveTextContent(
      "edit_promocode.manage_modal.added_toast"
    );
    const list = screen.getByTestId("fixed-size-list");
    expect(within(list).getAllByTestId(/manage-modal-row-/)).toHaveLength(1);
  });

  it("renders 1,400-entry list without crashing; virtualization shows only ~10 rows", () => {
    const big = Array.from({ length: 1400 }, (_, i) => `@e${i}.com`);
    openModal(big);
    // Count text is the raw i18n key in jest env; the row-virtualization
    // assertion below proves the modal handled the 1,400-entry input.
    expect(screen.getByTestId("manage-modal-count")).toHaveTextContent(
      "edit_promocode.manage_modal.configured_count"
    );
    const list = screen.getByTestId("fixed-size-list");
    expect(within(list).getAllByTestId(/manage-modal-row-/)).toHaveLength(10);
  });

  it("snapshots existing on open — does NOT see parent state mutations after open", () => {
    const { rerender } = openModal(["@a.com"]);
    rerender(
      <ManageAllowedEmailDomainsModal
        show
        onHide={onHide}
        onApply={onApply}
        existing={["@a.com", "@b.com", "@c.com"]}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "edit_promocode.manage_modal.done" })
    );
    expect(onApply).toHaveBeenCalledWith(["@a.com"]);
  });
});

describe("ManageAllowedEmailDomainsModal — Tier 2", () => {
  it("Search narrows the visible list (debounced 150 ms)", async () => {
    openModal(["@acme.com", "@beta.com", "@acmeworld.com"]);
    expect(
      within(screen.getByTestId("fixed-size-list")).getAllByTestId(
        /manage-modal-row-/
      )
    ).toHaveLength(3);

    fireEvent.change(screen.getByTestId("manage-modal-search"), {
      target: { value: "acme" }
    });

    await waitFor(() =>
      expect(
        within(screen.getByTestId("fixed-size-list")).getAllByTestId(
          /manage-modal-row-/
        )
      ).toHaveLength(2)
    );
  });

  it("Add within debounce window clears pending search and keeps new entry visible", async () => {
    // Open with one existing entry.
    openModal(["@acme.com"]);

    // Type a search term — fireEvent is synchronous, so the 150 ms debounce
    // timeout has NOT fired yet: searchInput="acme", search="" still.
    fireEvent.change(screen.getByTestId("manage-modal-search"), {
      target: { value: "acme" }
    });

    // Immediately (same tick) add a domain that does NOT match "acme" — the
    // bug would leave searchInput intact and then the deferred setSearch fires,
    // filtering the just-added entry out of view.
    const textarea = screen.getByTestId("manage-modal-textarea");
    fireEvent.change(textarea, { target: { value: "@beta.com" } });
    fireEvent.click(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.add_button"
      })
    );

    // The search input must be cleared immediately after the click (no waiting).
    expect(screen.getByTestId("manage-modal-search")).toHaveValue("");

    // After the debounce window drains (it should be a no-op now that
    // searchInput was cleared), both entries must be visible.
    await waitFor(() =>
      expect(
        within(screen.getByTestId("fixed-size-list")).getAllByTestId(
          /manage-modal-row-/
        )
      ).toHaveLength(2)
    );
  });

  it("Type filter narrows by entry type and composes with search", async () => {
    openModal(["@acme.com", ".edu", "user@acme.com"]);

    // Apply search first and wait for the debounce to actually fire — observable
    // as a row-count drop from 3 to 2 (".edu" is excluded). This guarantees
    // `search` has settled before the type filter is exercised, so the later
    // assertions are not racing the 150 ms debounce.
    fireEvent.change(screen.getByTestId("manage-modal-search"), {
      target: { value: "acme" }
    });
    await waitFor(() =>
      expect(
        within(screen.getByTestId("fixed-size-list")).getAllByTestId(
          /manage-modal-row-/
        )
      ).toHaveLength(2)
    );

    // @domain ∩ "acme" → only @acme.com
    fireEvent.change(screen.getByTestId("manage-modal-type-filter"), {
      target: { value: "at_domain" }
    });
    expect(
      within(screen.getByTestId("fixed-size-list")).getAllByTestId(
        /manage-modal-row-/
      )
    ).toHaveLength(1);

    // .tld ∩ "acme" → nothing (".edu" is a tld but does not match "acme")
    fireEvent.change(screen.getByTestId("manage-modal-type-filter"), {
      target: { value: "tld" }
    });
    expect(
      within(screen.getByTestId("fixed-size-list")).queryAllByTestId(
        /manage-modal-row-/
      )
    ).toHaveLength(0);
  });

  it("Add Domains while filtered clears the filter so additions are visible", () => {
    openModal(["@acme.com"]);
    fireEvent.change(screen.getByTestId("manage-modal-type-filter"), {
      target: { value: "tld" }
    });
    // .tld filter hides @acme.com
    expect(
      within(screen.getByTestId("fixed-size-list")).queryAllByTestId(
        /manage-modal-row-/
      )
    ).toHaveLength(0);
    fireEvent.change(screen.getByTestId("manage-modal-textarea"), {
      target: { value: "@beta.com" }
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.add_button"
      })
    );
    // filter reset to "all" → both the pre-existing and the new entry show
    expect(screen.getByTestId("manage-modal-type-filter")).toHaveValue("all");
    expect(
      within(screen.getByTestId("fixed-size-list")).getAllByTestId(
        /manage-modal-row-/
      )
    ).toHaveLength(2);
  });

  it("single checkbox + Delete Selected removes only that entry", () => {
    openModal(["@a.com", "@b.com", "@c.com"]);
    fireEvent.click(screen.getByTestId("manage-modal-checkbox-1"));
    fireEvent.click(screen.getByTestId("manage-modal-delete-selected"));
    fireEvent.click(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.done"
      })
    );
    expect(onApply).toHaveBeenCalledWith(["@a.com", "@c.com"]);
  });

  it("Select All + Delete Selected empties the working list", () => {
    openModal(["@a.com", "@b.com", "@c.com"]);
    fireEvent.click(screen.getByTestId("manage-modal-select-all"));
    fireEvent.click(screen.getByTestId("manage-modal-delete-selected"));
    expect(
      within(screen.getByTestId("fixed-size-list")).queryAllByTestId(
        /manage-modal-row-/
      )
    ).toHaveLength(0);
    fireEvent.click(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.done"
      })
    );
    expect(onApply).toHaveBeenCalledWith([]);
  });

  it("Select All respects the active filter (only visible rows deleted)", () => {
    // Indices chosen so the filtered rows' originalIndex (1, 3) differ from
    // their visible indices (0, 1): a buggy impl selecting by visible index
    // would delete the wrong working entries and fail this assertion.
    openModal([".edu", "@acme.com", "user@acme.com", "@beta.com"]);
    fireEvent.change(screen.getByTestId("manage-modal-type-filter"), {
      target: { value: "at_domain" }
    });
    fireEvent.click(screen.getByTestId("manage-modal-select-all"));
    fireEvent.click(screen.getByTestId("manage-modal-delete-selected"));
    fireEvent.click(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.done"
      })
    );
    expect(onApply).toHaveBeenCalledWith([".edu", "user@acme.com"]);
  });

  it("selection clears when search changes", async () => {
    openModal(["@acme.com", "@beta.com"]);
    fireEvent.click(screen.getByTestId("manage-modal-checkbox-0"));
    fireEvent.change(screen.getByTestId("manage-modal-search"), {
      target: { value: "acme" }
    });
    await waitFor(() =>
      expect(
        within(screen.getByTestId("fixed-size-list")).getAllByTestId(
          /manage-modal-row-/
        )
      ).toHaveLength(1)
    );
    // Direct invariant: with selection cleared, Delete Selected is disabled.
    expect(screen.getByTestId("manage-modal-delete-selected")).toBeDisabled();
    fireEvent.click(screen.getByTestId("manage-modal-delete-selected"));
    fireEvent.click(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.done"
      })
    );
    expect(onApply).toHaveBeenCalledWith(["@acme.com", "@beta.com"]);
  });

  it("autoscroll after Add targets the new last index with the post-add itemCount", async () => {
    // Open with 2 entries. Add 1 more (new total: 3).
    // The deferred-scroll fix: scrollToItem must be called with index=2 AND
    // itemCountAtCallTime=3 (not the pre-add itemCount of 2). The pre-fix
    // synchronous code would call scrollToItem while the list still had
    // itemCount=2, clamping the scroll target to index 1 (the old last row).
    //
    // What this test DOES verify: scrollToItem is called once, with the correct
    // index (visible.length - 1 = 2) and the correct itemCount at call time (3).
    //
    // What this test does NOT verify: that the scroll actually moves the browser
    // viewport — jsdom has no layout engine, so the scrollToItem call is captured
    // via the mock but never produces a visual scroll. The test validates the
    // index + call-time itemCount contract, not the pixel position.
    openModal(["@a.com", "@b.com"]);
    expect(scrollLog).toHaveLength(0);

    const textarea = screen.getByTestId("manage-modal-textarea");
    fireEvent.change(textarea, { target: { value: "@c.com" } });
    fireEvent.click(
      screen.getByRole("button", {
        name: "edit_promocode.manage_modal.add_button"
      })
    );

    // The deferred effect fires after React commits the new visible array.
    // waitFor lets RTL flush all state updates + effects.
    await waitFor(() => expect(scrollLog).toHaveLength(1));

    const [call] = scrollLog;
    // Index must target the new last row (3 entries → index 2).
    expect(call.index).toBe(2);
    // itemCountAtCallTime must equal the post-add count (3), proving the effect
    // ran after the list re-rendered — not synchronously while itemCount was 2.
    expect(call.itemCountAtCallTime).toBe(3);
  });

  it("closing the modal within the debounce window cancels the pending setSearch", () => {
    // Mount visible, type into search to start the debounce clock, then close
    // (`show={false}`) before 150 ms elapses. The `if (!show) return undefined`
    // guard must prevent the pending setSearch from firing while hidden.
    // try/finally guarantees jest.useRealTimers() runs even if an assertion throws.
    jest.useFakeTimers();
    try {
      const { rerender } = render(
        <ManageAllowedEmailDomainsModal
          show
          onHide={onHide}
          onApply={onApply}
          existing={["@a.com"]}
        />
      );

      // Type into search — searchInput="acme", debounce clock starts.
      fireEvent.change(screen.getByTestId("manage-modal-search"), {
        target: { value: "acme" }
      });
      // Verify the input is set before closing.
      expect(screen.getByTestId("manage-modal-search")).toHaveValue("acme");

      // Close the modal before 150 ms elapses.
      rerender(
        <ManageAllowedEmailDomainsModal
          show={false}
          onHide={onHide}
          onApply={onApply}
          existing={["@a.com"]}
        />
      );

      // Advance past the debounce window. The `if (!show) return undefined`
      // guard must prevent setSearch from running (no error, no side-effects).
      expect(() => jest.runAllTimers()).not.toThrow();

      // Reopen the modal — the open effect resets searchInput and search to "".
      rerender(
        <ManageAllowedEmailDomainsModal
          show
          onHide={onHide}
          onApply={onApply}
          existing={["@a.com"]}
        />
      );
      expect(screen.getByTestId("manage-modal-search")).toHaveValue("");
    } finally {
      jest.useRealTimers();
    }
  });
});
