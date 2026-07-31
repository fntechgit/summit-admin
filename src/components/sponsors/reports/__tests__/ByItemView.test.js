import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ByItemView, {
  groupLinesByItem,
  groupLinesBySponsorItem,
  sortItems
} from "../ByItemView";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k, opts) => (opts ? `${k}:${Object.values(opts).join(",")}` : k)
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
  ...over
});

describe("groupLinesBySponsorItem", () => {
  it("buckets by sponsor.id, not adjacency (dup-name interleave)", () => {
    const rows = [
      line({ sponsor: { id: 1, name: "Acme" } }),
      line({ sponsor: { id: 2, name: "Acme" }, item_code: "B1" }),
      line({ sponsor: { id: 1, name: "Acme" }, item_code: "C1" })
    ];
    const groups = groupLinesBySponsorItem(rows);
    expect(groups).toHaveLength(2);
    const g1 = groups.find((g) => g.sponsorId === 1);
    expect(g1.items).toHaveLength(2);
  });

  it("groups by trimmed item_code within a sponsor; blank code → one null bucket", () => {
    const rows = [
      line({ item_code: " AV1 " }),
      line({ item_code: "AV1", quantity: 3 }),
      line({ item_code: "", description: "Mystery A" }),
      line({ item_code: null, description: "Mystery B" })
    ];
    const [group] = groupLinesBySponsorItem(rows);
    expect(group.items).toHaveLength(2);
    const av1 = group.items.find((i) => i.itemCode === "AV1");
    expect(av1.qty).toBe(5);
    expect(av1.lines).toBe(2);
    const noCode = group.items.find((i) => i.itemCode === null);
    expect(noCode.lines).toBe(2);
    expect(noCode.label).toBe("Mystery A"); // first non-blank description
  });

  it("counts DISTINCT orders and builds statusMix as distinct orders per status", () => {
    const rows = [
      line({ purchase: { id: 1, number: "N1", status: "Paid" } }),
      line({ purchase: { id: 1, number: "N1", status: "Paid" } }),
      line({ purchase: { id: 2, number: "N2", status: "Pending Payment" } })
    ];
    const [group] = groupLinesBySponsorItem(rows);
    const [item] = group.items;
    expect(item.orders).toBe(2);
    expect(item.lines).toBe(3);
    expect(item.statusMix).toEqual({ Paid: 1, "Pending Payment": 1 });
  });

  it("RETAINS qty-0 lines and reports purchasedCount only over qty>0 items", () => {
    const rows = [
      line({ quantity: 3 }),
      line({
        item_code: "Z1",
        description: "Unbought",
        quantity: 0,
        line_total: 0
      })
    ];
    const [group] = groupLinesBySponsorItem(rows);
    expect(group.items).toHaveLength(2);
    expect(group.itemCount).toBe(2);
    expect(group.purchasedCount).toBe(1);
    expect(group.totalQty).toBe(3);
  });

  it("totalCents is null when every line_total is null, else the sum of non-nulls", () => {
    const rows = [
      line({ item_code: "A", line_total: null }),
      line({ item_code: "A", line_total: null }),
      line({ item_code: "B", line_total: 100, quantity: 1 }),
      line({ item_code: "B", line_total: null, quantity: 1 })
    ];
    const [group] = groupLinesBySponsorItem(rows);
    expect(group.items.find((i) => i.itemCode === "A").totalCents).toBeNull();
    expect(group.items.find((i) => i.itemCode === "B").totalCents).toBe(100);
  });

  it("sorts items qty desc then orders desc, sponsors by totalQty desc", () => {
    const rows = [
      line({ sponsor: { id: 1, name: "Small" }, item_code: "A", quantity: 1 }),
      line({
        sponsor: { id: 2, name: "Big" },
        item_code: "B",
        quantity: 9,
        purchase: { id: 7, number: "N7", status: "Paid" }
      }),
      line({ sponsor: { id: 2, name: "Big" }, item_code: "C", quantity: 9 }),
      line({
        sponsor: { id: 2, name: "Big" },
        item_code: "C",
        quantity: 0,
        purchase: { id: 8, number: "N8", status: "Paid" }
      })
    ];
    const groups = groupLinesBySponsorItem(rows);
    expect(groups.map((g) => g.sponsorName)).toEqual(["Big", "Small"]);
    // C: qty 9, orders 2 beats B: qty 9, orders 1
    expect(groups[0].items.map((i) => i.itemCode)).toEqual(["C", "B"]);
  });

  it("passes canceled lines through as contributors with isCanceled", () => {
    const rows = [line({ is_canceled: true })];
    const [group] = groupLinesBySponsorItem(rows);
    const [contrib] = group.items[0].contributors;
    expect(contrib).toEqual({
      sponsorName: "Acme",
      number: "OCP-1",
      formCode: "AV",
      addOnName: "Meeting Room T",
      sponsorBooth: null,
      checkoutAt: 1735000000,
      rateName: "Early",
      status: "Paid",
      qty: 2,
      lineTotalCents: 100000,
      isCanceled: true
    });
  });

  it("EXCLUDES canceled lines from qty/money/purchasedCount/Σqty but keeps them as contributors", () => {
    const rows = [
      line({
        item_code: "AV1",
        quantity: 2,
        line_total: 100000,
        is_canceled: true
      }),
      line({ item_code: "AV1", quantity: 3, line_total: 150000 }),
      line({
        item_code: "Z1",
        description: "Canceled only",
        quantity: 4,
        line_total: 40000,
        is_canceled: true
      })
    ];
    const [group] = groupLinesBySponsorItem(rows);
    const av1 = group.items.find((i) => i.itemCode === "AV1");
    // canceled qty (2) and money (100000) excluded; live line still counts
    expect(av1.qty).toBe(3);
    expect(av1.totalCents).toBe(150000);
    // both lines remain structurally, and the canceled one is still a contributor
    expect(av1.lines).toBe(2);
    expect(av1.contributors).toHaveLength(2);
    const z1 = group.items.find((i) => i.itemCode === "Z1");
    // an item whose only line is canceled reports qty 0 and null money (renders —)
    expect(z1.qty).toBe(0);
    expect(z1.totalCents).toBeNull();
    // Z1 is not "purchased"; only AV1 counts
    expect(group.purchasedCount).toBe(1);
    expect(group.totalQty).toBe(3);
  });

  it("excludes a canceled-only line's order from orders/statusMix, same as qty/money", () => {
    const rows = [
      line({
        item_code: "Z1",
        description: "Canceled only",
        quantity: 4,
        line_total: 40000,
        is_canceled: true,
        purchase: { id: 5001, number: "OCP-1", status: "Paid" }
      })
    ];
    const [group] = groupLinesBySponsorItem(rows);
    const z1 = group.items.find((i) => i.itemCode === "Z1");
    expect(z1.qty).toBe(0);
    expect(z1.totalCents).toBeNull();
    // no live line contributes this order, so it is not a distinct paid order
    expect(z1.orders).toBe(0);
    expect(z1.statusMix).toEqual({});
    // the canceled line is still visible in the drill-down
    expect(z1.lines).toBe(1);
    expect(z1.contributors).toHaveLength(1);
  });

  it("reconciles non-canceled input: Σ item qty == Σ input quantity and Σ contributors == input line count", () => {
    const rows = [
      line({ quantity: 3 }),
      line({ item_code: "B", quantity: 0 }),
      line({ sponsor: { id: 9, name: "Other" }, item_code: "C", quantity: 4 })
    ];
    const groups = groupLinesBySponsorItem(rows);
    const allItems = groups.flatMap((g) => g.items);
    const qtySum = allItems.reduce((acc, i) => acc + i.qty, 0);
    const contribCount = allItems.reduce(
      (acc, i) => acc + i.contributors.length,
      0
    );
    expect(qtySum).toBe(7);
    expect(contribCount).toBe(rows.length);
  });
});

describe("groupLinesByItem", () => {
  it("merges an item_code ACROSS sponsors into one row and names each sponsor in the drill-down", () => {
    const rows = [
      line({ sponsor: { id: 1, name: "Intel" }, quantity: 10 }),
      line({
        sponsor: { id: 2, name: "Nvidia" },
        purchase: { id: 5002, number: "OCP-2", status: "Paid" },
        quantity: 3,
        add_on_name: "Meeting Room T"
      })
    ];
    const items = groupLinesByItem(rows);
    expect(items).toHaveLength(1);
    const [av1] = items;
    expect(av1.itemCode).toBe("AV1");
    expect(av1.qty).toBe(13);
    expect(av1.orders).toBe(2);
    expect(av1.contributors.map((c) => c.sponsorName)).toEqual([
      "Intel",
      "Nvidia"
    ]);
  });

  it("counts PENDING orders toward the pull total, not just Paid", () => {
    const rows = [
      line({ quantity: 4, purchase: { id: 1, number: "A", status: "Paid" } }),
      line({
        quantity: 6,
        purchase: { id: 2, number: "B", status: "Pending Payment" }
      })
    ];
    const [av1] = groupLinesByItem(rows);
    expect(av1.qty).toBe(10);
    expect(av1.statusMix).toEqual({ Paid: 1, "Pending Payment": 1 });
  });

  it("excludes canceled lines from qty but keeps them as contributors (parity with the by-sponsor layout)", () => {
    const rows = [
      line({ quantity: 4 }),
      line({
        quantity: 9,
        is_canceled: true,
        purchase: { id: 2, number: "B", status: "Paid" }
      })
    ];
    const [av1] = groupLinesByItem(rows);
    expect(av1.qty).toBe(4);
    expect(av1.orders).toBe(1);
    expect(av1.contributors).toHaveLength(2);
  });

  it("reconciles with the by-sponsor layout AND with the raw input total", () => {
    const rows = [
      line({ sponsor: { id: 1, name: "Intel" }, quantity: 10 }),
      line({ sponsor: { id: 2, name: "Nvidia" }, quantity: 3 }),
      line({
        sponsor: { id: 2, name: "Nvidia" },
        item_code: "B1",
        quantity: 7
      }),
      // Pending counts toward the pull total, so it must survive BOTH groupings
      // and the independent sum below.
      line({
        sponsor: { id: 3, name: "Meta" },
        quantity: 6,
        purchase: { id: 9, number: "N9", status: "Pending Payment" }
      }),
      line({ quantity: 5, is_canceled: true })
    ];
    const flatQty = groupLinesByItem(rows).reduce((a, it) => a + it.qty, 0);
    const nestedQty = groupLinesBySponsorItem(rows).reduce(
      (a, g) => a + g.totalQty,
      0
    );
    // Computed from the fixture, NOT from the shared accumulator: cross-layout
    // equality alone would stay green if accumulateRow dropped a whole status.
    const inputQty = rows
      .filter((r) => !r.is_canceled)
      .reduce((a, r) => a + r.quantity, 0);
    expect(flatQty).toBe(nestedQty);
    expect(flatQty).toBe(inputQty);
    expect(flatQty).toBe(26);
  });
});

const item = (over = {}) => ({
  itemCode: "AV1",
  label: "Audio mixer",
  qty: 5,
  orders: 2,
  lines: 3,
  totalCents: 250000,
  statusMix: { Paid: 1, "Pending Payment": 1 },
  contributors: [
    {
      sponsorName: "Intel",
      number: "OCP-1",
      formCode: "AV",
      addOnName: "Meeting Room T",
      checkoutAt: 1735000000,
      rateName: "Early",
      status: "Paid",
      qty: 3,
      lineTotalCents: 150000,
      isCanceled: false
    },
    {
      sponsorName: "Nvidia",
      number: "OCP-2",
      formCode: "AV",
      addOnName: null,
      checkoutAt: null,
      rateName: "Standard",
      status: "Pending Payment",
      qty: 2,
      lineTotalCents: 100000,
      isCanceled: true
    }
  ],
  ...over
});

const group = (over = {}) => ({
  sponsorId: 17,
  sponsorName: "Acme",
  items: [item()],
  totalQty: 5,
  itemCount: 1,
  purchasedCount: 1,
  ...over
});

const renderView = (props = {}) =>
  render(
    <ByItemView
      groups={[group()]}
      currentPage={1}
      perPage={10}
      onPageChange={jest.fn()}
      onPerPageChange={jest.fn()}
      {...props}
    />
  );

describe("ByItemView", () => {
  it("renders one accordion per sponsor with the items chip and Σ Qty", () => {
    renderView({
      groups: [
        group(),
        group({ sponsorId: 9, sponsorName: "Beta", totalQty: 1 })
      ]
    });
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    // Interpolated mock: key:values
    expect(
      screen.getAllByText("sponsor_reports_page.byitem_sponsor_items_chip:1,1")
    ).toHaveLength(2);
    expect(
      screen.getAllByText("sponsor_reports_page.byitem_sum_qty:5")
    ).toHaveLength(1);
  });

  it("item row click toggles the contributing-orders drill-down", () => {
    renderView();
    expect(screen.queryByText("OCP-1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("AV1"));
    expect(screen.getByText("OCP-1")).toBeInTheDocument();
    expect(screen.getByText("Meeting Room T")).toBeInTheDocument();
    // Canceled contributor is rendered, marked, not filtered.
    const canceledRow = screen.getByText("OCP-2").closest("tr");
    expect(canceledRow).toHaveAttribute("data-canceled", "true");
    fireEvent.click(screen.getByText("AV1"));
    expect(screen.queryByText("OCP-1")).not.toBeInTheDocument();
  });

  it("expand button toggles the drill-down and reflects aria-expanded", () => {
    renderView();
    const toggle = screen.getByRole("button", {
      name: "sponsor_reports_page.byitem_contributing_orders"
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("OCP-1")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("OCP-1")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("OCP-1")).not.toBeInTheDocument();
  });

  it("renders the status mix as chips keyed by real purchase statuses", () => {
    renderView();
    expect(screen.getByText("Paid: 1")).toBeInTheDocument();
    expect(screen.getByText("Pending Payment: 1")).toBeInTheDocument();
  });

  it("renders — for a null totalCents and keeps zero-qty items visible", () => {
    renderView({
      groups: [
        group({
          items: [
            item(),
            item({
              itemCode: "Z1",
              label: "Unbought",
              qty: 0,
              totalCents: null
            })
          ],
          itemCount: 2
        })
      ]
    });
    expect(screen.getByText("Unbought")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("pages sponsor groups and clamps an out-of-range page", () => {
    const groups = Array.from({ length: 12 }, (_, i) =>
      group({ sponsorId: i + 1, sponsorName: `Sponsor ${i + 1}` })
    );
    // currentPage 5 is out of range for 12 groups @ 10/page → clamps to page 2.
    renderView({ groups, currentPage: 5, perPage: 10 });
    expect(screen.queryByText("Sponsor 1")).not.toBeInTheDocument();
    expect(screen.getByText("Sponsor 11")).toBeInTheDocument();
    expect(screen.getByText("Sponsor 12")).toBeInTheDocument();
  });

  it("wires TablePagination to the 1-based onPageChange / onPerPageChange", () => {
    const onPageChange = jest.fn();
    const onPerPageChange = jest.fn();
    const groups = Array.from({ length: 12 }, (_, i) =>
      group({ sponsorId: i + 1, sponsorName: `Sponsor ${i + 1}` })
    );
    renderView({ groups, onPageChange, onPerPageChange });
    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    // Rows-per-page (MUI 6 Select: trigger role="combobox", options role="option").
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "20" }));
    expect(onPerPageChange).toHaveBeenCalledWith(20);
  });
});

describe("sortItems", () => {
  const row = (over) => item(over);

  it("sorts by each supported key in both directions", () => {
    const rows = [
      row({ itemCode: "B1", label: "Beta", qty: 5, orders: 1 }),
      row({ itemCode: "A1", label: "Alpha", qty: 9, orders: 3 }),
      row({ itemCode: "C1", label: "Gamma", qty: 1, orders: 2 })
    ];
    const codes = (o, d) => sortItems(rows, o, d).map((r) => r.itemCode);
    expect(codes("itemCode", 1)).toEqual(["A1", "B1", "C1"]);
    expect(codes("itemCode", -1)).toEqual(["C1", "B1", "A1"]);
    expect(codes("label", 1)).toEqual(["A1", "B1", "C1"]);
    expect(codes("qty", 1)).toEqual(["C1", "B1", "A1"]);
    expect(codes("qty", -1)).toEqual(["A1", "B1", "C1"]);
    expect(codes("orders", 1)).toEqual(["B1", "C1", "A1"]);
  });

  it("is stable, so ties keep the rollup's canonical order", () => {
    // >10 rows so the engine takes its merge path, not just binary insertion,
    // and every row ties on the sort key: any reordering here is instability.
    const canonical = Array.from({ length: 16 }, (_, i) => `T${i}`);
    const rows = canonical.map((code) => row({ itemCode: code, qty: 4 }));
    expect(sortItems(rows, "qty", -1).map((r) => r.itemCode)).toEqual(
      canonical
    );
    expect(sortItems(rows, "qty", 1).map((r) => r.itemCode)).toEqual(canonical);
  });

  it("does not mutate the input and no-ops on an unknown key", () => {
    const rows = [row({ itemCode: "B1", qty: 1 }), row({ itemCode: "A1" })];
    const sorted = sortItems(rows, "itemCode", 1);
    expect(rows.map((r) => r.itemCode)).toEqual(["B1", "A1"]);
    expect(sorted).not.toBe(rows);
    expect(sortItems(rows, "nope", 1)).toBe(rows);
  });

  it("sorts the null item_code bucket as empty rather than throwing", () => {
    const rows = [row({ itemCode: "A1" }), row({ itemCode: null })];
    expect(sortItems(rows, "itemCode", 1).map((r) => r.itemCode)).toEqual([
      null,
      "A1"
    ]);
  });
});

describe("ByItemView sorting", () => {
  // The ACTIVE column's accessible name also carries the visually-hidden
  // direction announcement, so match on a prefix rather than the bare label.
  const SORTABLE = [
    /^sponsor_reports_page\.col_item_code/,
    /^sponsor_reports_page\.col_item_name/,
    /^sponsor_reports_page\.col_quantity/,
    /^sponsor_reports_page\.byitem_col_orders/
  ];

  it("offers a sort control on exactly the four sortable columns", () => {
    renderView({ order: "qty", orderDir: -1, onSort: jest.fn() });
    SORTABLE.forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });
    // The active column announces its direction to screen readers.
    expect(
      screen.getByRole("button", {
        name: /col_quantity mui_table\.sorted_desc/
      })
    ).toBeInTheDocument();
    // Total and Status are not sortable — plain header text, no button.
    expect(
      screen.queryByRole("button", {
        name: "sponsor_reports_page.byitem_col_total"
      })
    ).not.toBeInTheDocument();
  });

  it("flips the direction when the active column is clicked again", () => {
    const onSort = jest.fn();
    renderView({ order: "qty", orderDir: -1, onSort });
    fireEvent.click(
      screen.getByRole("button", {
        name: /^sponsor_reports_page\.col_quantity/
      })
    );
    expect(onSort).toHaveBeenCalledWith("qty", 1);
  });

  it("reports the new column with the current direction", () => {
    const onSort = jest.fn();
    renderView({ order: "qty", orderDir: -1, onSort });
    fireEvent.click(
      screen.getByRole("button", { name: "sponsor_reports_page.col_item_code" })
    );
    expect(onSort).toHaveBeenCalledWith("itemCode", 1);
  });

  it("marks only the active column with a sort direction", () => {
    renderView({ order: "label", orderDir: 1, onSort: jest.fn() });
    const active = screen
      .getByRole("button", { name: /col_item_name/ })
      .closest("th");
    expect(active).toHaveAttribute("aria-sort", "ascending");
    const inactive = screen
      .getByRole("button", { name: /col_quantity/ })
      .closest("th");
    expect(inactive).not.toHaveAttribute("aria-sort");
  });

  it("sorts BEFORE paging in the all-sponsors layout", () => {
    // 12 items arriving in DESCENDING qty (the rollup's canonical order), page
    // size 10. Ascending sort must pull the two smallest onto page 1 — which
    // only happens if the sort runs before the slice, not within the page.
    const items = Array.from({ length: 12 }, (_, i) =>
      item({ itemCode: `SKU${11 - i}`, label: `Item ${11 - i}`, qty: 11 - i })
    );
    renderView({
      layout: "item",
      items,
      groups: [],
      onLayoutChange: jest.fn(),
      order: "qty",
      orderDir: 1,
      onSort: jest.fn()
    });
    expect(screen.getByText("SKU0")).toBeInTheDocument();
    // The two largest fall to page 2.
    expect(screen.queryByText("SKU11")).not.toBeInTheDocument();
    expect(screen.queryByText("SKU10")).not.toBeInTheDocument();
  });

  it("reorders items within a sponsor without reordering the sponsors", () => {
    const groups = [
      group({
        sponsorId: 1,
        sponsorName: "Big",
        items: [
          item({ itemCode: "B1", label: "Beta", qty: 9 }),
          item({ itemCode: "A1", label: "Alpha", qty: 1 })
        ]
      }),
      group({ sponsorId: 2, sponsorName: "Small", items: [] })
    ];
    renderView({ groups, order: "label", orderDir: 1, onSort: jest.fn() });
    const codes = screen
      .getAllByText(/^(A1|B1)$/)
      .map((node) => node.textContent);
    expect(codes).toEqual(["A1", "B1"]);
    // Sponsor accordion order is independent of the item sort.
    const names = screen
      .getAllByText(/^(Big|Small)$/)
      .map((node) => node.textContent);
    expect(names).toEqual(["Big", "Small"]);
  });
});

describe("ByItemView expand/collapse all", () => {
  const clickBtn = (name) =>
    fireEvent.click(screen.getByRole("button", { name }));
  // The group accordion exposes its state as aria-expanded on the summary —
  // assert that rather than MUI's internal Mui-expanded class. Matched on the
  // Σ-units label, which only a group summary carries: the layout toggle shares
  // its name with the all-sponsors group title.
  const groupHeader = () =>
    screen.getByRole("button", { name: /byitem_sum_qty/ });

  it("expands every item drill-down AND the group, in the by-sponsor layout", () => {
    renderView({
      groups: [
        group({
          sponsorId: 1,
          sponsorName: "Intel",
          items: [item({ itemCode: "A1" }), item({ itemCode: "B1" })]
        })
      ]
    });
    // Drill-downs start closed: no contributing order visible.
    expect(screen.queryByText("OCP-1")).not.toBeInTheDocument();
    clickBtn("sponsor_reports_page.byitem_expand_all");
    // Both items' contributing orders now render (2 items x 2 contributors).
    expect(screen.getAllByText("OCP-1")).toHaveLength(2);
  });

  it("closes the drill-downs but LEAVES the group open — back to the default view", () => {
    renderView();
    clickBtn("sponsor_reports_page.byitem_expand_all");
    expect(screen.getByText("OCP-1")).toBeInTheDocument();
    clickBtn("sponsor_reports_page.byitem_collapse_all");
    expect(screen.queryByText("OCP-1")).not.toBeInTheDocument();
    // Collapsing the group too would leave a wall of headers and no data.
    expect(groupHeader()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("AV1")).toBeInTheDocument();
  });

  it("does not reopen a group the user closed by hand", () => {
    renderView();
    fireEvent.click(groupHeader());
    expect(groupHeader()).toHaveAttribute("aria-expanded", "false");
    clickBtn("sponsor_reports_page.byitem_collapse_all");
    expect(groupHeader()).toHaveAttribute("aria-expanded", "false");
  });

  it("works the same in the all-sponsors layout", () => {
    renderView({
      layout: "item",
      items: [item()],
      groups: [],
      onLayoutChange: jest.fn()
    });
    clickBtn("sponsor_reports_page.byitem_expand_all");
    expect(screen.getByText("OCP-1")).toBeInTheDocument();
    clickBtn("sponsor_reports_page.byitem_collapse_all");
    expect(screen.queryByText("OCP-1")).not.toBeInTheDocument();
    expect(groupHeader()).toHaveAttribute("aria-expanded", "true");
  });

  it("expands items beyond the current page, so paging keeps the state", () => {
    // 12 items over a 10-row page: the 11th is not rendered yet, but Expand All
    // must have keyed it too or it would come back collapsed on page 2.
    const items = Array.from({ length: 12 }, (_, i) =>
      item({ itemCode: `SKU${i}`, label: `Item ${i}` })
    );
    const { rerender } = renderView({
      layout: "item",
      items,
      groups: [],
      onLayoutChange: jest.fn()
    });
    clickBtn("sponsor_reports_page.byitem_expand_all");
    rerender(
      <ByItemView
        layout="item"
        items={items}
        groups={[]}
        onLayoutChange={jest.fn()}
        currentPage={2}
        perPage={10}
        onPageChange={jest.fn()}
        onPerPageChange={jest.fn()}
      />
    );
    expect(screen.getByText("SKU10")).toBeInTheDocument();
    // Page 2's rows arrive already expanded.
    expect(screen.getAllByText("OCP-1").length).toBeGreaterThan(0);
  });

  it("re-expands a group the user closed by hand, not just the drill-downs", () => {
    renderView();
    fireEvent.click(groupHeader());
    expect(groupHeader()).toHaveAttribute("aria-expanded", "false");
    clickBtn("sponsor_reports_page.byitem_expand_all");
    // The group must come back open — otherwise Expand All strands the user
    // with an expanded drill-down inside a collapsed accordion.
    expect(groupHeader()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("OCP-1")).toBeInTheDocument();
  });

  it("leaves individual toggles working after a bulk action", () => {
    renderView();
    clickBtn("sponsor_reports_page.byitem_expand_all");
    expect(screen.getByText("OCP-1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("AV1"));
    expect(screen.queryByText("OCP-1")).not.toBeInTheDocument();
  });
});

describe("ByItemView all-sponsors layout", () => {
  const renderAll = (props = {}) =>
    renderView({
      layout: "item",
      items: [item()],
      groups: [],
      onLayoutChange: jest.fn(),
      ...props
    });

  // Styling parity by construction: one shared container => one card surface,
  // summary divider and details inset, with no sx values to keep in step.
  // Asserted through the accordion's ACCESSIBLE contract — a collapsible group
  // header, and the item table living inside that group's region — so a MUI
  // class rename cannot fail this while behaviour is unchanged.
  it.each([
    ["by-sponsor", () => renderView()],
    ["all-sponsors", () => renderAll()]
  ])("renders the %s layout in the same group container", (_name, mount) => {
    mount();
    const header = screen.getByRole("button", { name: /byitem_sum_qty/ });
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(
      within(screen.getByRole("region")).getByRole("table")
    ).toBeInTheDocument();
  });

  it("drops the sponsor accordions and totals the show in one header", () => {
    renderAll({ items: [item(), item({ itemCode: "B1", qty: 7 })] });
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
    // 2 items, both purchased; Σ qty over the WHOLE list, not the page.
    expect(
      screen.getByText("sponsor_reports_page.byitem_sponsor_items_chip:2,2")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.byitem_sum_qty:12")
    ).toBeInTheDocument();
  });

  it("names the sponsor per contributing order in the drill-down", () => {
    renderAll();
    fireEvent.click(screen.getByText("AV1"));
    expect(screen.getByText("Intel")).toBeInTheDocument();
    expect(screen.getByText("Nvidia")).toBeInTheDocument();
    expect(screen.getByText("Meeting Room T")).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.col_sponsor")
    ).toBeInTheDocument();
  });

  it("omits the Sponsor column in the by-sponsor layout", () => {
    renderView();
    fireEvent.click(screen.getByText("AV1"));
    expect(
      screen.queryByText("sponsor_reports_page.col_sponsor")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Intel")).not.toBeInTheDocument();
  });

  it("pages over items, not sponsors, and labels the selector accordingly", () => {
    const onPageChange = jest.fn();
    renderAll({
      // perPage stays a real PER_PAGE_OPTIONS value (10) so MUI does not warn.
      items: Array.from({ length: 12 }, (_, i) =>
        item({ itemCode: `SKU${i}`, label: `Item ${i}` })
      ),
      onPageChange
    });
    expect(screen.getByText("1–10 of 12")).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.byitem_items_per_page")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("reports the picked layout to the parent, ignoring a null deselect", () => {
    const onLayoutChange = jest.fn();
    renderAll({ onLayoutChange });
    fireEvent.click(
      screen.getByRole("button", {
        name: "sponsor_reports_page.byitem_layout_sponsor"
      })
    );
    expect(onLayoutChange).toHaveBeenCalledWith("sponsor");
    onLayoutChange.mockClear();
    // Re-clicking the active button: MUI emits null, no layout change.
    fireEvent.click(
      screen.getByRole("button", {
        name: "sponsor_reports_page.byitem_layout_all_sponsors"
      })
    );
    expect(onLayoutChange).not.toHaveBeenCalled();
  });
});

describe("Destination booth fallback (By Item drill-down)", () => {
  it("carries sponsor_booth through grouping as contributor sponsorBooth", () => {
    const [withBooth] = groupLinesBySponsorItem([
      line({ sponsor_booth: "C3 | C4" })
    ]);
    expect(withBooth.items[0].contributors[0].sponsorBooth).toBe("C3 | C4");
    const [without] = groupLinesBySponsorItem([line()]);
    expect(without.items[0].contributors[0].sponsorBooth).toBeNull();
  });

  it("drill-down falls back to the sponsor booth on an empty add-on (|| precedence)", () => {
    renderView({
      groups: [
        group({
          items: [
            item({
              contributors: [
                {
                  number: "OCP-1",
                  formCode: "AV",
                  addOnName: "",
                  sponsorBooth: "C3 | C4",
                  checkoutAt: 1735000000,
                  rateName: "Early",
                  status: "Paid",
                  qty: 3,
                  lineTotalCents: 150000,
                  isCanceled: false
                }
              ]
            })
          ]
        })
      ]
    });
    fireEvent.click(screen.getByText("AV1"));
    expect(screen.getByText("C3 | C4")).toBeInTheDocument();
  });
});
