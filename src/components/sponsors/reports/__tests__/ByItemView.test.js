import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ByItemView, { groupLinesBySponsorItem } from "../ByItemView";

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
      number: "OCP-1",
      formCode: "AV",
      addOnName: "Meeting Room T",
      checkoutAt: 1735000000,
      rateName: "Early",
      status: "Paid",
      qty: 2,
      lineTotalCents: 100000,
      isCanceled: true
    });
  });

  it("reconciles: Σ item qty == Σ input quantity and Σ contributors == input line count", () => {
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
