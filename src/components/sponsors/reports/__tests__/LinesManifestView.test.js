import "@testing-library/jest-dom";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import LinesManifestView from "../LinesManifestView";

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
