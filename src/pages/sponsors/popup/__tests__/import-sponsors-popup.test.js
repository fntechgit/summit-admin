import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ImportSponsorsPopup, { CSV_TEMPLATE } from "../import-sponsors-popup";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: {
    translate: (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key)
  }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/upload-input",
  () => ({
    __esModule: true,
    default: ({ handleUpload, handleRemove }) => (
      <>
        <button
          type="button"
          onClick={() => handleUpload(new File(["a"], "a.csv"))}
          data-testid="upload-a"
        >
          pick a
        </button>
        <button
          type="button"
          onClick={() => handleUpload(new File(["b"], "b.csv"))}
          data-testid="upload-b"
        >
          pick b
        </button>
        <button type="button" onClick={handleRemove} data-testid="remove">
          remove
        </button>
      </>
    )
  })
);

const buildReport = (summary, rows, dryRun = true) => ({
  dry_run: dryRun,
  summary: {
    total: rows.length,
    sponsors_created: 0,
    companies_created: 0,
    skipped: 0,
    errors: 0,
    not_attempted: 0,
    ...summary
  },
  rows
});

const row = (overrides) => ({
  row: 1,
  company_input: "Acme",
  tier_input: "Gold",
  action: "create",
  company: { id: null, name: "Acme", match: "new" },
  tiers: ["Gold"],
  sponsor_id: null,
  duplicate_of_row: null,
  candidates: [],
  error: null,
  ...overrides
});

const previewReport = buildReport(
  { sponsors_created: 2, skipped: 1, errors: 1 },
  [
    row({ row: 1 }),
    row({ row: 2, company_input: "Initech" }),
    row({
      row: 3,
      company_input: "Initech",
      action: "skip_duplicate",
      duplicate_of_row: 2
    }),
    row({
      row: 4,
      company_input: "Globex",
      action: "error",
      company: null,
      tiers: [],
      error: "Unknown tier Platinum"
    })
  ]
);

const setup = ({
  onClose = jest.fn(),
  onPreview = jest.fn(),
  onImport = jest.fn()
} = {}) => {
  render(
    <ImportSponsorsPopup
      onClose={onClose}
      onPreview={onPreview}
      onImport={onImport}
    />
  );
  return { onClose, onPreview, onImport };
};

const btn = (name) => screen.getByRole("button", { name });

describe("ImportSponsorsPopup", () => {
  it("previews the selected file and shows each row's outcome", async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn().mockResolvedValue(previewReport);
    setup({ onPreview });

    await user.click(screen.getByTestId("upload-a"));
    await user.click(btn("sponsor_list.import.preview"));

    await waitFor(() =>
      expect(
        screen.getByText("sponsor_list.import.action_skip_duplicate:{\"row\":2}")
      ).toBeInTheDocument()
    );
    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onPreview.mock.calls[0][0]).toBeInstanceOf(File);
    expect(onPreview.mock.calls[0][0].name).toBe("a.csv");
    expect(screen.getByText("Unknown tier Platinum")).toBeInTheDocument();
    expect(
      screen.getAllByText("sponsor_list.import.action_create:{\"row\":null}")
        .length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("sponsor_list.import.new_company").length
    ).toBeGreaterThan(0);
  });

  it("offers the format example as a downloadable CSV template", () => {
    setup();

    const link = screen.getByRole("link", {
      name: "sponsor_list.import.download_template"
    });
    expect(link).toHaveAttribute("download", "sponsors-template.csv");
    const href = link.getAttribute("href");
    expect(href.startsWith("data:text/csv;charset=utf-8,")).toBe(true);
    expect(decodeURIComponent(href.split(",").slice(1).join(","))).toBe(
      CSV_TEMPLATE
    );
    expect(CSV_TEMPLATE.split("\n")[0]).toBe("\"company\",\"tier\"");
    // the on-screen example is the same text as the download
    expect(
      screen.getByText(/^"company","tier"/, { selector: "pre" }).textContent
    ).toBe(CSV_TEMPLATE);
  });

  it("marks error rows with an error icon next to the message", async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn().mockResolvedValue(previewReport);
    setup({ onPreview });

    await user.click(screen.getByTestId("upload-a"));
    await user.click(btn("sponsor_list.import.preview"));

    const message = await screen.findByText("Unknown tier Platinum");
    expect(
      message.parentElement.querySelector("[data-testid=\"ErrorOutlineIcon\"]")
    ).not.toBeNull();
    expect(screen.getAllByTestId("ErrorOutlineIcon")).toHaveLength(1);
  });

  it("explains a normalized company match in the preview", async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn().mockResolvedValue(
      buildReport({ sponsors_created: 1 }, [
        row({
          company_input: "acme inc",
          company: { id: 5, name: "Acme Inc.", match: "normalized" }
        })
      ])
    );
    setup({ onPreview });

    await user.click(screen.getByTestId("upload-a"));
    await user.click(btn("sponsor_list.import.preview"));

    expect(
      await screen.findByText("sponsor_list.import.normalized_hint")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_list.import.normalized_help")
    ).toBeInTheDocument();
  });

  it("labels created rows in past tense after the import", async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn().mockResolvedValue(previewReport);
    const onImport = jest
      .fn()
      .mockResolvedValue(
        buildReport({ sponsors_created: 1 }, [row({ row: 1 })], false)
      );
    setup({ onPreview, onImport });

    await user.click(screen.getByTestId("upload-a"));
    await user.click(btn("sponsor_list.import.preview"));
    await user.click(
      await screen.findByRole("button", { name: "sponsor_list.import.import" })
    );

    expect(
      await screen.findByText("sponsor_list.import.action_created:{\"row\":null}")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("sponsor_list.import.action_create:{\"row\":null}")
    ).not.toBeInTheDocument();
  });

  it("disables import when no row would be created", async () => {
    const user = userEvent.setup();
    const onPreview = jest
      .fn()
      .mockResolvedValue(
        buildReport({ errors: 1 }, [
          row({ action: "error", company: null, error: "bad" })
        ])
      );
    setup({ onPreview });

    await user.click(screen.getByTestId("upload-a"));
    await user.click(btn("sponsor_list.import.preview"));

    const importBtn = await screen.findByRole("button", {
      name: "sponsor_list.import.import"
    });
    expect(importBtn).toBeDisabled();
  });

  it("clears the preview when a different file is chosen", async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn().mockResolvedValue(previewReport);
    setup({ onPreview });

    await user.click(screen.getByTestId("upload-a"));
    await user.click(btn("sponsor_list.import.preview"));
    await screen.findByText("Unknown tier Platinum");

    await user.click(screen.getByTestId("upload-b"));

    expect(screen.queryByText("Unknown tier Platinum")).not.toBeInTheDocument();
    expect(btn("sponsor_list.import.preview")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "sponsor_list.import.import" })
    ).not.toBeInTheDocument();
  });

  it("ignores a preview that resolves after the file changed", async () => {
    const user = userEvent.setup();
    let resolvePreview;
    const onPreview = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePreview = resolve;
        })
    );
    setup({ onPreview });

    await user.click(screen.getByTestId("upload-a"));
    await user.click(btn("sponsor_list.import.preview"));
    await user.click(screen.getByTestId("upload-b"));

    await act(async () => {
      resolvePreview(previewReport);
    });

    expect(screen.queryByText("Unknown tier Platinum")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "sponsor_list.import.import" })
    ).not.toBeInTheDocument();
    expect(btn("sponsor_list.import.preview")).toBeInTheDocument();
  });

  it("sends one import while one is in flight", async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn().mockResolvedValue(previewReport);
    const onImport = jest.fn().mockImplementation(() => new Promise(() => {}));
    setup({ onPreview, onImport });

    await user.click(screen.getByTestId("upload-a"));
    await user.click(btn("sponsor_list.import.preview"));
    const importBtn = await screen.findByRole("button", {
      name: "sponsor_list.import.import"
    });

    await user.click(importBtn);
    fireEvent.click(importBtn);

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("shows the stopped-run message when rows were not attempted", async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn().mockResolvedValue(previewReport);
    const onImport = jest.fn().mockResolvedValue(
      buildReport(
        { sponsors_created: 1, not_attempted: 3 },
        [
          row({ row: 1 }),
          row({ row: 2, action: "error", error: "db down" }),
          row({
            row: 3,
            action: "not_attempted",
            error: "connection reset"
          }),
          row({ row: 4, action: "not_attempted" })
        ],
        false
      )
    );
    setup({ onPreview, onImport });

    await user.click(screen.getByTestId("upload-a"));
    await user.click(btn("sponsor_list.import.preview"));
    await user.click(
      await screen.findByRole("button", { name: "sponsor_list.import.import" })
    );

    expect(
      await screen.findByText(
        "sponsor_list.import.stopped_warning:{\"not_attempted\":3}"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("db down")).toBeInTheDocument();
    expect(screen.getByText("connection reset")).toBeInTheDocument();
    expect(btn("sponsor_list.import.close")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "sponsor_list.import.import" })
    ).not.toBeInTheDocument();
  });
});
