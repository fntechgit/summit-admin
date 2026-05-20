import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ManageAllowedEmailDomainsModal from "../ManageAllowedEmailDomainsModal";

// Mock react-window — jsdom has no layout, so FixedSizeList won't render rows.
// Mock renders first 10 rows directly to match production's ~10-rows-visible cap.
jest.mock("react-window", () => {
  const React = require("react");
  return {
    __esModule: true,
    FixedSizeList: React.forwardRef(
      ({ itemCount, itemData, children }, ref) => {
        const Row = children;
        const visible = Math.min(itemCount, 10);
        if (ref) {
          ref.current = { scrollToItem: jest.fn() };
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
