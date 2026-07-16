import React from "react";
import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import SummitEventListPage from "../summit-event-list-page";
import { renderWithRedux } from "../../../utils/test-utils";
import { unpackJoinOperatorFromCriteria } from "../summit-event-list-page/helpers";
import {
  saveFilterCriteria,
  deleteFilterCriteria
} from "../../../actions/filter-criteria-actions";

const mockEditableTableSpy = jest.fn(() => null);

jest.mock("../../../actions/filter-criteria-actions", () => ({
  saveFilterCriteria: jest.fn(),
  deleteFilterCriteria: jest.fn()
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/bulk-edit-table",
  () =>
    function BulkEditTableMock(props) {
      mockEditableTableSpy(props);
      return null;
    },
  { virtual: true }
);

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key) => key
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(() => Promise.resolve({ value: false }))
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

jest.mock("react-bootstrap", () => {
  const Modal = ({ children }) => <div>{children}</div>;
  Modal.Header = ({ children }) => <div>{children}</div>;
  Modal.Title = ({ children }) => <div>{children}</div>;
  Modal.Body = ({ children }) => <div>{children}</div>;
  Modal.Footer = ({ children }) => <div>{children}</div>;

  return {
    Modal,
    Pagination: () => null
  };
});

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({
    ...jest.requireActual(
      "openstack-uicore-foundation/lib/components/mui/snackbar-notification"
    ),
    useSnackbarMessage: () => ({
      errorMessage: jest.fn(),
      successMessage: jest.fn()
    })
  })
);

// Stubs the real popup: exposes a button that calls onSave with a fixed
// "save this filter" payload, mirroring how the real dialog invokes onSave.
jest.mock(
  "../../../components/filters/save-filter-criteria",
  () =>
    function SaveFilterCriteriaMock({ onSave }) {
      return (
        <button
          type="button"
          onClick={() =>
            onSave({
              name: "My saved filter",
              id: null,
              visibility: "everyone"
            })
          }
        >
          save-filter-criteria
        </button>
      );
    }
);
jest.mock(
  "../../../components/filters/select-filter-criteria",
  () => () => null
);

// Mutable shared state so tests can seed the GridFilter's current
// filterValues/joinOperator before mounting the page.
const mockGridFilterState = {
  parsedFilter: [],
  resetFilters: jest.fn(),
  filterValues: [],
  setFilters: jest.fn(),
  joinOperator: undefined
};

jest.mock("openstack-uicore-foundation/lib/components/mui/grid-filter", () => ({
  ...jest.requireActual(
    "openstack-uicore-foundation/lib/components/mui/grid-filter"
  ),
  GridFilter: () => null,
  useGridFilter: () => mockGridFilterState
}));

describe("SummitEventListPage", () => {
  let windowOpenSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    windowOpenSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    mockGridFilterState.parsedFilter = [];
    mockGridFilterState.filterValues = [];
    mockGridFilterState.joinOperator = undefined;
    saveFilterCriteria.mockReturnValue(() => Promise.resolve());
    deleteFilterCriteria.mockReturnValue(() => Promise.resolve());
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  test("opens media upload material link using row event id", async () => {
    renderWithRedux(<SummitEventListPage />, {
      initialState: {
        currentSummitState: {
          currentSummit: {
            id: 12,
            time_zone: { name: "UTC" },
            time_zone_id: "UTC",
            selection_plans: [],
            tracks: [],
            event_types: [],
            locations: [],
            presentation_action_types: []
          }
        },
        mediaUploadListState: {
          media_uploads: []
        },
        currentEventListState: {
          events: [
            {
              id: 101,
              type: { id: 1, name: "Presentation", use_speakers: true },
              title: "Sample event",
              selection_status: "pending",
              media_uploads: [
                {
                  id: 999,
                  summit_id: 12,
                  presentation_id: 101,
                  event_id: null,
                  created: "now",
                  media_upload_type: { name: "Slides" }
                }
              ]
            }
          ],
          lastPage: 1,
          currentPage: 1,
          order: "id",
          orderDir: 1,
          totalEvents: 1,
          term: "",
          filters: {},
          extraColumns: ["media_uploads"],
          perPage: 10
        }
      }
    });

    const editableTableProps =
      mockEditableTableSpy.mock.calls[
        mockEditableTableSpy.mock.calls.length - 1
      ][0];
    const mediaUploadsColumn = editableTableProps.columns.find(
      (col) => col.columnKey === "media_uploads"
    );

    const mediaUploadItem = {
      id: 999,
      summit_id: 12,
      presentation_id: 101,
      event_id: 101,
      created: "now",
      media_upload_type: { name: "Slides" }
    };

    const rendered = mediaUploadsColumn.render([mediaUploadItem], { id: 101 });
    const firstRow = rendered.props.children[0];
    const firstButton = Array.isArray(firstRow.props.children)
      ? firstRow.props.children[0]
      : firstRow.props.children;

    firstButton.props.onClick({
      preventDefault: jest.fn()
    });

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "/app/summits/12/events/101/materials/999",
      "_blank",
      "noopener,noreferrer"
    );
  });

  test("opens media upload material link using current summit id fallback", async () => {
    renderWithRedux(<SummitEventListPage />, {
      initialState: {
        currentSummitState: {
          currentSummit: {
            id: 12,
            time_zone: { name: "UTC" },
            time_zone_id: "UTC",
            selection_plans: [],
            tracks: [],
            event_types: [],
            locations: [],
            presentation_action_types: []
          }
        },
        mediaUploadListState: {
          media_uploads: []
        },
        currentEventListState: {
          events: [
            {
              id: 101,
              type: { id: 1, name: "Presentation", use_speakers: true },
              title: "Sample event",
              selection_status: "pending",
              media_uploads: [
                {
                  id: 999,
                  created: "now",
                  media_upload_type: { name: "Slides" }
                }
              ]
            }
          ],
          lastPage: 1,
          currentPage: 1,
          order: "id",
          orderDir: 1,
          totalEvents: 1,
          term: "",
          filters: {},
          extraColumns: ["media_uploads"],
          perPage: 10
        }
      }
    });

    const editableTableProps =
      mockEditableTableSpy.mock.calls[
        mockEditableTableSpy.mock.calls.length - 1
      ][0];
    const mediaUploadsColumn = editableTableProps.columns.find(
      (col) => col.columnKey === "media_uploads"
    );

    const mediaUploadItem = {
      id: 999,
      created: "now",
      media_upload_type: { name: "Slides" }
    };

    const rendered = mediaUploadsColumn.render([mediaUploadItem], { id: 101 });
    const firstRow = rendered.props.children[0];
    const firstButton = Array.isArray(firstRow.props.children)
      ? firstRow.props.children[0]
      : firstRow.props.children;

    firstButton.props.onClick({
      preventDefault: jest.fn()
    });

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "/app/summits/12/events/101/materials/999",
      "_blank",
      "noopener,noreferrer"
    );
  });

  test("does not open media upload material link when row event id is missing", async () => {
    renderWithRedux(<SummitEventListPage />, {
      initialState: {
        currentSummitState: {
          currentSummit: {
            id: 12,
            time_zone: { name: "UTC" },
            time_zone_id: "UTC",
            selection_plans: [],
            tracks: [],
            event_types: [],
            locations: [],
            presentation_action_types: []
          }
        },
        mediaUploadListState: {
          media_uploads: []
        },
        currentEventListState: {
          events: [
            {
              id: 101,
              type: { id: 1, name: "Presentation", use_speakers: true },
              title: "Sample event",
              selection_status: "pending",
              media_uploads: [
                {
                  id: 999,
                  summit_id: 12,
                  created: "now",
                  media_upload_type: { name: "Slides" }
                }
              ]
            }
          ],
          lastPage: 1,
          currentPage: 1,
          order: "id",
          orderDir: 1,
          totalEvents: 1,
          term: "",
          filters: {},
          extraColumns: ["media_uploads"],
          perPage: 10
        }
      }
    });

    const editableTableProps =
      mockEditableTableSpy.mock.calls[
        mockEditableTableSpy.mock.calls.length - 1
      ][0];
    const mediaUploadsColumn = editableTableProps.columns.find(
      (col) => col.columnKey === "media_uploads"
    );

    const mediaUploadItem = {
      id: 999,
      summit_id: 12,
      created: "now",
      media_upload_type: { name: "Slides" }
    };

    const rendered = mediaUploadsColumn.render([mediaUploadItem], {});
    const firstRow = rendered.props.children[0];
    const firstButton = Array.isArray(firstRow.props.children)
      ? firstRow.props.children[0]
      : firstRow.props.children;

    firstButton.props.onClick({
      preventDefault: jest.fn()
    });

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  test("persists the ALL/ANY join operator when saving the current GridFilter criteria", async () => {
    mockGridFilterState.filterValues = [
      { criteria: "type", operator: "==", value: "1" }
    ];
    mockGridFilterState.joinOperator = "ANY";

    renderWithRedux(<SummitEventListPage />, {
      initialState: {
        currentSummitState: {
          currentSummit: {
            id: 12,
            time_zone: { name: "UTC" },
            time_zone_id: "UTC",
            selection_plans: [],
            tracks: [],
            event_types: [],
            locations: [],
            presentation_action_types: []
          }
        },
        mediaUploadListState: {
          media_uploads: []
        },
        currentEventListState: {
          events: [],
          lastPage: 1,
          currentPage: 1,
          order: "id",
          orderDir: 1,
          totalEvents: 0,
          term: "",
          filters: {},
          extraColumns: [],
          perPage: 10
        }
      }
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "save-filter-criteria" })
      );
      await flushPromises();
    });

    expect(saveFilterCriteria).toHaveBeenCalledTimes(1);
    const [savedPayload] = saveFilterCriteria.mock.calls[0];

    // The backend doesn't persist a top-level join_operator column yet
    // (confirmed empirically: it's silently dropped from the response), so
    // this is sent defensively for forward-compat...
    expect(savedPayload.join_operator).toBe("ANY");

    // ...but what actually round-trips today is the pack/unpack hack: the
    // join operator smuggled into the criteria array and stripped back out
    // on load. Assert the real, currently-working path.
    const {
      joinOperator: rehydratedJoinOperator,
      criteria: rehydratedCriteria
    } = unpackJoinOperatorFromCriteria(savedPayload);

    expect(rehydratedJoinOperator).toBe("ANY");
    expect(rehydratedCriteria).toEqual([
      { criteria: "type", operator: "==", value: "1" }
    ]);
  });
});
