import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SavedViews from "..";
import showConfirmDialog from "../../../mui/showConfirmDialog";
import { queryFilterCriterias } from "../../../../actions/filter-criteria-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../mui/showConfirmDialog", () => jest.fn());

jest.mock("../../../../actions/filter-criteria-actions", () => ({
  queryFilterCriterias: jest.fn()
}));

const VIEWS = [
  { id: 1, name: "Open Activities", visibility: "Everyone", criteria: [] },
  { id: 2, name: "Recently Modified", visibility: "Me", criteria: [] }
];

const renderViews = (props = {}) =>
  render(
    <SavedViews
      summitId={12}
      context="Activities"
      onChange={jest.fn()}
      onSave={jest.fn(() => Promise.resolve())}
      onDelete={jest.fn(() => Promise.resolve())}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );

const openMenu = (label = "saved_views.title") =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("SavedViews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryFilterCriterias.mockImplementation((summitId, context, input, cb) =>
      cb(VIEWS.filter((v) => v.name.includes(input)))
    );
  });

  test("lists the show's views for this context and applies the one picked", async () => {
    const onChange = jest.fn();
    renderViews({ onChange });

    await openMenu();

    expect(queryFilterCriterias).toHaveBeenCalledWith(
      12,
      "Activities",
      "",
      expect.any(Function)
    );
    await userEvent.click(
      screen.getByRole("menuitem", { name: /Recently Modified/ })
    );

    expect(onChange).toHaveBeenCalledWith(VIEWS[1]);
  });

  test("says there are no saved views only once they've loaded empty", async () => {
    let resolveViews;
    queryFilterCriterias.mockImplementation((summitId, context, input, cb) => {
      resolveViews = cb;
    });
    renderViews();

    await openMenu();
    expect(
      screen.queryByRole("menuitem", { name: "saved_views.no_views" })
    ).not.toBeInTheDocument();

    act(() => resolveViews([]));
    expect(
      screen.getByRole("menuitem", { name: "saved_views.no_views" })
    ).toBeInTheDocument();
  });

  test("searches views by name", async () => {
    renderViews();

    await openMenu();
    await userEvent.type(
      screen.getByRole("textbox", { name: "general.search" }),
      "Open"
    );

    expect(queryFilterCriterias).toHaveBeenLastCalledWith(
      12,
      "Activities",
      "Open",
      expect.any(Function)
    );
  });

  test("deletes a view after confirming, without applying it", async () => {
    const onChange = jest.fn();
    const onDelete = jest.fn(() => Promise.resolve());
    showConfirmDialog.mockResolvedValueOnce(true);
    renderViews({ onChange, onDelete });

    await openMenu();
    await userEvent.click(
      screen.getByRole("button", { name: "general.delete Open Activities" })
    );

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(
        screen.queryByRole("menuitem", { name: /Open Activities/ })
      ).not.toBeInTheDocument()
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  test("keeps the view when the delete is cancelled", async () => {
    const onDelete = jest.fn();
    showConfirmDialog.mockResolvedValueOnce(false);
    renderViews({ onDelete });

    await openMenu();
    await userEvent.click(
      screen.getByRole("button", { name: "general.delete Open Activities" })
    );

    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("offers clearing only while a view is active", async () => {
    const onChange = jest.fn();
    const { rerender } = renderViews({ onChange });

    await openMenu();
    expect(
      screen.queryByRole("menuitem", { name: "saved_views.clear" })
    ).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    rerender(
      <SavedViews
        summitId={12}
        context="Activities"
        selectedView={VIEWS[0]}
        onChange={onChange}
        onSave={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    await openMenu("Open Activities");
    await userEvent.click(
      screen.getByRole("menuitem", { name: "saved_views.clear" })
    );

    expect(onChange).toHaveBeenCalledWith(null);
  });

  test("requires a name and visibility before saving", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    renderViews({ onSave });

    await openMenu();
    await userEvent.click(
      screen.getByRole("menuitem", { name: "saved_views.save_current" })
    );
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(await screen.findAllByText("validation.required")).toHaveLength(2);
    expect(onSave).not.toHaveBeenCalled();
  });

  test("saves over the active view and closes once the save resolves", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    renderViews({ onSave, selectedView: VIEWS[0] });

    await openMenu("Open Activities");
    await userEvent.click(
      screen.getByRole("menuitem", { name: "saved_views.save_current" })
    );

    const name = screen.getByRole("textbox", { name: "saved_views.name" });
    expect(name).toHaveValue("Open Activities");
    await userEvent.clear(name);
    await userEvent.type(name, "Open Keynotes");
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(onSave).toHaveBeenCalledWith({
      id: 1,
      name: "Open Keynotes",
      visibility: "Everyone"
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  test("keeps the dialog open when the save fails", async () => {
    let rejectSave;
    const onSave = jest.fn(
      () =>
        new Promise((resolve, reject) => {
          rejectSave = reject;
        })
    );
    renderViews({ onSave });

    await openMenu();
    await userEvent.click(
      screen.getByRole("menuitem", { name: "saved_views.save_current" })
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "saved_views.name" }),
      "Mine"
    );
    await userEvent.click(
      screen.getByRole("radio", { name: "save_filter_criteria.me" })
    );
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).toBeDisabled()
    );
    await act(async () => rejectSave(new Error("nope")));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "general.save" })).toBeEnabled()
    );
  });
});
