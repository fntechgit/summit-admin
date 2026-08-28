import "@testing-library/jest-dom";
import React from "react";
import moment from "moment-timezone";
import { render, screen, within } from "@testing-library/react";
import LinesManifestView, {
  liveQuantity,
  liveAmountCents
} from "../LinesManifestView";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k, opts) =>
    opts && opts.count != null ? `${k}:${opts.count}` : k
}));

const line = (over = {}) => ({
  sponsor: { id: 17, name: "Acme" },
  purchase: {
    id: 5001,
    number: "OCP-1",
    status: "Paid",
    checkout_at: 1735000000
  },
  form: { code: "AV", name: "Audio Visual" },
  item_code: "AV1",
  description: "Audio mixer",
  rate_name: "Early",
  quantity: 2,
  unit_price: 50000,
  line_total: 100000,
  add_on_id: 3,
  add_on_name: "Meeting Room T",
  notes: "dock B",
  is_canceled: false,
  canceled_at: null,
  canceled_quantity: 0,
  canceled_amount: 0,
  is_partially_canceled: false,
  ...over
});

const renderView = (props = {}) =>
  render(
    <LinesManifestView
      rows={[line()]}
      total={1}
      currentPage={1}
      perPage={50}
      onPageChange={jest.fn()}
      onPerPageChange={jest.fn()}
      {...props}
    />
  );

describe("LinesManifestView", () => {
  it("KEEPS a canceled line in the rendered set (visual treatment, not filtered)", () => {
    renderView({
      rows: [
        line({ item_code: "AV2", is_canceled: true, canceled_at: 1735100000 })
      ]
    });
    expect(screen.getByText("AV2")).toBeInTheDocument();
    const row = screen.getByText("AV2").closest("tr");
    expect(row).toHaveAttribute("data-canceled", "true");
  });

  it("renders the LINE's own state, not the parent order's status", () => {
    // line() defaults to a Paid parent: the exact trap. A soft-canceled line leaves
    // its order Paid, so rendering purchase.status printed "Paid" on a dead row.
    renderView({ rows: [line({ is_canceled: true })] });
    expect(
      screen.getByText("sponsor_reports_page.status_canceled")
    ).toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });

  it("renders both freshness timestamps, in the row's final two cells", () => {
    // formatCheckoutTime is moment.unix(v).utc().format("YYYY-MM-DD h:mm A").
    // Distinct values (not the same epoch for both fields) so a swap or a
    // missing cell can't hide behind a shared string.
    const synced = 1755561600; // 2025-08-19
    const sourceUpdated = 1755648000; // 2025-08-20
    renderView({
      rows: [line({ synced_at: synced, source_updated_at: sourceUpdated })]
    });
    const syncedText = moment.unix(synced).utc().format("YYYY-MM-DD h:mm A");
    const sourceUpdatedText = moment
      .unix(sourceUpdated)
      .utc()
      .format("YYYY-MM-DD h:mm A");
    const row = screen.getByText("AV1").closest("tr");
    const cells = within(row).getAllByRole("cell");
    expect(cells[cells.length - 2]).toHaveTextContent(syncedText);
    expect(cells[cells.length - 1]).toHaveTextContent(sourceUpdatedText);
  });

  it("counts only live lines per sponsor group", () => {
    // Canceled lines still RENDER (struck through); the chip means LIVE lines,
    // matching the By Item units chip on the same screen. The module's local
    // i18n mock interpolates {count}, so the chip text carries the number.
    renderView({
      rows: [
        line({ is_canceled: false }),
        line({ is_canceled: true, item_code: "AV2" })
      ]
    });
    // header row + the 2 line rows, exactly — proves neither line was dropped.
    expect(screen.getAllByRole("row")).toHaveLength(3);
    const canceledRow = screen.getByText("AV2").closest("tr");
    expect(canceledRow).toHaveAttribute("data-canceled", "true");
    expect(
      screen.getByText("sponsor_reports_page.lines_count:1")
    ).toBeInTheDocument();
  });

  // A positional last-two-cells check (as used above for the freshness
  // columns) only proves a cell isn't missing — it says nothing about the
  // HEADER row, which is a separate array (HEADERS). If the two desync by
  // one, every column right of the break silently misaligns and stays
  // green. Assert exact header/cell cardinality directly.
  it("has exactly 13 column headers matching 13 cells per row", () => {
    renderView();
    expect(screen.getAllByRole("columnheader")).toHaveLength(13);
    const row = screen.getByText("AV1").closest("tr");
    expect(within(row).getAllByRole("cell")).toHaveLength(13);
  });

  // Sponsor bucketing (formerly bucketLinesBySponsor, now a private helper).
  describe("sponsor bucketing", () => {
    it("groups by sponsor.id preserving first-seen order", () => {
      renderView({
        rows: [
          line({ sponsor: { id: 17, name: "Acme" }, item_code: "A1" }),
          line({ sponsor: { id: 9, name: "Globex" }, item_code: "G1" }),
          line({ sponsor: { id: 17, name: "Acme" }, item_code: "A2" })
        ]
      });
      const tables = screen.getAllByRole("table");
      expect(tables).toHaveLength(2);
      // First-seen order: Acme (with A1 + A2) before Globex (G1).
      expect(within(tables[0]).getByText("A1")).toBeInTheDocument();
      expect(within(tables[0]).getByText("A2")).toBeInTheDocument();
      expect(within(tables[1]).getByText("G1")).toBeInTheDocument();
    });

    it("keeps a sponsor in ONE group when its rows are non-adjacent (same name, interleaved)", () => {
      // Two distinct ids sharing a name, interleaved by date as the backend orders them.
      renderView({
        rows: [
          line({ sponsor: { id: 17, name: "Dup Name" }, item_code: "X1" }),
          line({ sponsor: { id: 42, name: "Dup Name" }, item_code: "Y1" }),
          line({ sponsor: { id: 17, name: "Dup Name" }, item_code: "X2" })
        ]
      });
      const tables = screen.getAllByRole("table");
      expect(tables).toHaveLength(2);
      // X1 and X2 land in the same table (id 17) despite the interleaved Y1 row.
      const id17Table = screen.getByText("X1").closest("table");
      expect(within(id17Table).getByText("X2")).toBeInTheDocument();
      expect(within(id17Table).queryByText("Y1")).not.toBeInTheDocument();
    });

    it("buckets rows with a missing sponsor id under a single group", () => {
      renderView({
        rows: [
          { item_code: "Z1", purchase: { id: 1 } },
          { sponsor: {}, item_code: "Z2", purchase: { id: 2 } }
        ]
      });
      const tables = screen.getAllByRole("table");
      expect(tables).toHaveLength(1);
      expect(within(tables[0]).getByText("Z1")).toBeInTheDocument();
      expect(within(tables[0]).getByText("Z2")).toBeInTheDocument();
    });
  });
});

describe("Destination booth fallback", () => {
  it("prefers the line's own add_on_name over sponsor_booth", () => {
    renderView({ rows: [line({ sponsor_booth: "C3 | C4" })] });
    expect(screen.getByText("Meeting Room T")).toBeInTheDocument();
    expect(screen.queryByText("C3 | C4")).not.toBeInTheDocument();
  });

  it("falls back to the sponsor's booth when the line has no add-on", () => {
    renderView({
      rows: [line({ add_on_name: null, sponsor_booth: "C3 | C4" })]
    });
    expect(screen.getByText("C3 | C4")).toBeInTheDocument();
  });

  it("falls back on an EMPTY-STRING add_on_name (|| precedence, matching the backend CSV's `or`)", () => {
    // discriminates || from ??: a ?? implementation would render the muted
    // placeholder here instead of the booth
    renderView({
      rows: [line({ add_on_name: "", sponsor_booth: "C3 | C4" })]
    });
    expect(screen.getByText("C3 | C4")).toBeInTheDocument();
  });

  it("keeps the muted placeholder when neither add-on nor booth exists", () => {
    renderView({
      rows: [line({ add_on_name: null, sponsor_booth: null })]
    });
    expect(
      screen.getByText("sponsor_reports_page.destination_booth_fallback")
    ).toBeInTheDocument();
  });
});

describe("lines_count copy", () => {
  it("says the count is of LIVE lines, not all rendered lines", () => {
    // The chip is fed liveLineCount, but canceled lines still RENDER, so a group
    // showing two rows reports one. The copy has to say which number it is.
    // This module's i18n mock renders the chip from the KEY and COUNT only, so
    // the count assertion above is value-independent: the English could regress
    // to "{count} lines" and every DOM test would still pass. Pin it in the
    // catalog by exact equality, mirroring the By Item chip's copy test.
    // eslint-disable-next-line global-require
    const en = require("../../../../i18n/en.json");
    expect(en.sponsor_reports_page.lines_count).toBe("{count} live lines");
  });
});

describe("liveQuantity", () => {
  it("nets the cancelled portion off a partially cancelled line", () => {
    expect(
      liveQuantity(
        line({
          quantity: 5,
          canceled_quantity: 2,
          is_partially_canceled: true
        })
      )
    ).toBe(3);
  });

  it("clamps at 0 when a legacy line cancels more than it ordered", () => {
    // legacy shape: purchases-api defaults quantity to 1, the sync to 0
    expect(liveQuantity(line({ quantity: 0, canceled_quantity: 1 }))).toBe(0);
  });

  it("treats missing fields as zero rather than NaN", () => {
    expect(liveQuantity({})).toBe(0);
    expect(liveQuantity(undefined)).toBe(0);
  });
});

describe("liveAmountCents", () => {
  it("subtracts the frozen cancelled amount on a partially cancelled line", () => {
    // the source's own sum, not a proration of line_total
    expect(
      liveAmountCents(
        line({
          line_total: 100000,
          canceled_amount: 40000,
          quantity: 5,
          canceled_quantity: 2,
          is_partially_canceled: true
        })
      )
    ).toBe(60000);
  });

  it("clamps at 0 when the cancelled amount exceeds the line total", () => {
    expect(
      liveAmountCents(line({ line_total: 1000, canceled_amount: 5000 }))
    ).toBe(0);
  });
});

describe("partially cancelled lines", () => {
  const partial = () =>
    line({
      quantity: 5,
      canceled_quantity: 2,
      canceled_amount: 40000,
      is_canceled: false,
      is_partially_canceled: true,
      canceled_at: null
    });

  it("shows live units over ordered units in the quantity cell", () => {
    renderView({ rows: [partial()], total: 1 });
    expect(screen.getByText("3 / 5")).toBeInTheDocument();
  });

  it("renders the partially canceled pill, not the order status", () => {
    renderView({ rows: [partial()], total: 1 });
    expect(
      screen.getByText("sponsor_reports_page.status_partially_canceled")
    ).toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });

  it("does not strike through a partially cancelled row", () => {
    renderView({ rows: [partial()], total: 1 });
    expect(screen.getByText("AV1").closest("tr")).not.toHaveAttribute(
      "data-canceled"
    );
  });

  it("still counts a partially cancelled line as one live line", () => {
    renderView({ rows: [partial()], total: 1 });
    expect(
      screen.getByText("sponsor_reports_page.lines_count:1")
    ).toBeInTheDocument();
  });

  it("leaves a fully cancelled line struck through with the canceled pill", () => {
    const full = line({
      quantity: 5,
      canceled_quantity: 5,
      is_canceled: true,
      is_partially_canceled: false
    });
    renderView({ rows: [full], total: 1 });
    const row = screen.getByText("AV1").closest("tr");
    expect(row).toHaveAttribute("data-canceled", "true");
    expect(
      within(row).getByText("sponsor_reports_page.status_canceled")
    ).toBeInTheDocument();
    expect(within(row).getByText("5")).toBeInTheDocument();
  });

  it("leaves an active line's quantity as a bare number", () => {
    renderView({ rows: [line({ quantity: 2 })], total: 1 });
    const row = screen.getByText("AV1").closest("tr");
    expect(within(row).getByText("2")).toBeInTheDocument();
    expect(within(row).queryByText("2 / 2")).not.toBeInTheDocument();
  });
});
