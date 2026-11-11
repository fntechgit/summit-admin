import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MuiLinkList from "../link-list";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: () => null
}));

const VIP = { id: 1, name: "VIP" };
const STAFF = { id: 2, name: "Staff" };

describe("MuiLinkList", () => {
  it("offers only unlinked options and links the selected one", async () => {
    const onLink = jest.fn();
    render(
      <MuiLinkList
        placeholder="search"
        values={[VIP]}
        options={[VIP, STAFF]}
        columns={[]}
        onLink={onLink}
        onUnLink={jest.fn()}
      />
    );

    await userEvent.click(screen.getByPlaceholderText("search"));
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Staff"
    ]);

    await userEvent.click(screen.getByRole("option", { name: "Staff" }));
    await userEvent.click(screen.getByRole("button", { name: "general.add" }));

    expect(onLink).toHaveBeenCalledWith(STAFF);
    expect(screen.getByPlaceholderText("search")).toHaveValue("");
  });
});
