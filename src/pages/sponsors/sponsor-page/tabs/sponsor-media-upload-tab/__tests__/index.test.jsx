import React from "react";
import { screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../../../../utils/test-utils";
import SponsorMediaUploadTab from "../index";
import {
  uploadFileForSponsorMU,
  removeFileForSponsorMU,
  uploadTextForSponsorMU,
  removeTextForSponsorMU
} from "../../../../../../actions/sponsor-mu-actions";

jest.mock("../../../../../../actions/sponsor-mu-actions", () => ({
  getSponsorMURequests: jest.fn(() => () => Promise.resolve()),
  getGeneralMURequests: jest.fn(() => () => Promise.resolve()),
  uploadFileForSponsorMU: jest.fn(() => () => Promise.resolve()),
  removeFileForSponsorMU: jest.fn(() => () => Promise.resolve()),
  uploadTextForSponsorMU: jest.fn(() => () => Promise.resolve()),
  removeTextForSponsorMU: jest.fn(() => () => Promise.resolve())
}));

jest.mock("../../../../../../components/mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(true))
}));

jest.mock("../../../../../../components/upload-dialog", () => ({
  __esModule: true,
  default: ({ open, onUpload, onClose }) =>
    open ? (
      <div data-testid="upload-dialog">
        <button type="button" onClick={() => onUpload({ name: "file.pdf" })}>
          submit-file
        </button>
        <button type="button" onClick={onClose}>
          close-upload
        </button>
      </div>
    ) : null
}));

jest.mock("../components/text-value-dialog", () => ({
  __esModule: true,
  default: ({ open, onSubmit, onClose }) =>
    open ? (
      <div data-testid="text-value-dialog">
        <button type="button" onClick={() => onSubmit("new answer")}>
          submit-text
        </button>
        <button type="button" onClick={onClose}>
          close-text
        </button>
      </div>
    ) : null
}));

jest.mock("../../../../../../components/mui/PreviewModal", () => ({
  __esModule: true,
  default: ({ open, url }) =>
    open ? <div data-testid="preview-modal">{url}</div> : null
}));

jest.mock("../components/text-preview-modal", () => ({
  __esModule: true,
  default: ({ open, value }) =>
    open ? <div data-testid="text-preview-modal">{value}</div> : null
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ columns, data }) => (
    <div data-testid="mui-table">
      {data.map((row) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          {columns.map((col) => (
            <span
              key={col.columnKey}
              data-testid={`cell-${row.id}-${col.columnKey}`}
            >
              {col.render ? col.render(row) : row[col.columnKey]}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const fileRowWithValue = {
  id: 1,
  page_id: 10,
  name: "Logo",
  mu_type: "file",
  status: "Complete",
  media_upload: {
    file_mimetype: "image/png",
    public_url: "https://example.com/logo.png",
    file_name: "logo.png",
    file_created: 123
  }
};

const fileRowWithoutValue = {
  id: 2,
  page_id: 10,
  name: "Brochure",
  mu_type: "file",
  status: "Pending",
  media_upload: null
};

const textRowWithValue = {
  id: 3,
  page_id: 10,
  name: "Company Bio",
  mu_type: "text",
  status: "Complete",
  media_upload: { value: "Sponsor's bio text" }
};

const textRowWithoutValue = {
  id: 4,
  page_id: 10,
  name: "Tagline",
  mu_type: "text",
  status: "Pending",
  media_upload: null
};

const buildInitialState = (requests) => ({
  sponsorPageMUListState: {
    sponsorRequests: {
      requests,
      order: "name",
      orderDir: 1,
      currentPage: 1,
      lastPage: 1,
      perPage: 10,
      totalCount: requests.length
    },
    generalRequests: {
      requests: [],
      order: "name",
      orderDir: 1,
      currentPage: 1,
      lastPage: 1,
      perPage: 10,
      totalCount: 0
    },
    summitTZ: ""
  },
  currentSponsorState: { entity: { id: 99 } }
});

const getCell = (rowId, columnKey) =>
  screen.getByTestId(`cell-${rowId}-${columnKey}`);

describe("SponsorMediaUploadTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "open").mockImplementation(() => {});
  });

  it("enables view but keeps download disabled for a text row with a saved value, and previews the text", async () => {
    renderWithRedux(<SponsorMediaUploadTab />, {
      initialState: buildInitialState([textRowWithValue])
    });

    const viewButton = within(getCell(3, "view")).getByRole("button");
    const downloadButton = within(getCell(3, "download")).getByRole("button");

    expect(viewButton).toBeEnabled();
    expect(downloadButton).toBeDisabled();

    await userEvent.click(viewButton);

    expect(screen.getByTestId("text-preview-modal")).toHaveTextContent(
      "Sponsor's bio text"
    );
    expect(screen.queryByTestId("preview-modal")).not.toBeInTheDocument();
  });

  it("disables view and download for a text row with no saved value", () => {
    renderWithRedux(<SponsorMediaUploadTab />, {
      initialState: buildInitialState([textRowWithoutValue])
    });

    expect(within(getCell(4, "view")).getByRole("button")).toBeDisabled();
    expect(within(getCell(4, "download")).getByRole("button")).toBeDisabled();
  });

  it("opens the text dialog for an empty text row and submits via uploadTextForSponsorMU", async () => {
    renderWithRedux(<SponsorMediaUploadTab />, {
      initialState: buildInitialState([textRowWithoutValue])
    });

    await userEvent.click(
      within(getCell(4, "upload_delete")).getByRole("button")
    );

    expect(screen.getByTestId("text-value-dialog")).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "submit-text" })
      );
    });

    expect(uploadTextForSponsorMU).toHaveBeenCalledWith(10, 4, "new answer");
  });

  it("deletes a text row with a saved value via removeTextForSponsorMU", async () => {
    renderWithRedux(<SponsorMediaUploadTab />, {
      initialState: buildInitialState([textRowWithValue])
    });

    await act(async () => {
      await userEvent.click(
        within(getCell(3, "upload_delete")).getByRole("button")
      );
    });

    expect(removeTextForSponsorMU).toHaveBeenCalledWith(10, 3);
    expect(removeFileForSponsorMU).not.toHaveBeenCalled();
  });

  it("keeps File-row behavior unchanged: image preview, public_url download, upload dialog, file delete", async () => {
    renderWithRedux(<SponsorMediaUploadTab />, {
      initialState: buildInitialState([fileRowWithValue, fileRowWithoutValue])
    });

    expect(within(getCell(1, "view")).getByRole("button")).toBeEnabled();
    expect(within(getCell(1, "download")).getByRole("button")).toBeEnabled();

    await userEvent.click(within(getCell(1, "view")).getByRole("button"));
    expect(screen.getByTestId("preview-modal")).toHaveTextContent(
      "https://example.com/logo.png"
    );
    expect(screen.queryByTestId("text-preview-modal")).not.toBeInTheDocument();

    await userEvent.click(within(getCell(1, "download")).getByRole("button"));
    expect(window.open).toHaveBeenCalledWith(
      "https://example.com/logo.png",
      "_blank",
      "noopener,noreferrer"
    );

    await act(async () => {
      await userEvent.click(
        within(getCell(1, "upload_delete")).getByRole("button")
      );
    });
    expect(removeFileForSponsorMU).toHaveBeenCalledWith(10, 1);
    expect(removeTextForSponsorMU).not.toHaveBeenCalled();

    await userEvent.click(
      within(getCell(2, "upload_delete")).getByRole("button")
    );
    expect(screen.getByTestId("upload-dialog")).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "submit-file" })
      );
    });
    expect(uploadFileForSponsorMU).toHaveBeenCalledWith(10, 2, {
      name: "file.pdf"
    });
  });
});
