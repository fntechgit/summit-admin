import React from "react";
import SummitEventListPage from "../summit-event-list-page";
import { renderWithRedux } from "../../../utils/test-utils";

const mockEditableTableSpy = jest.fn(() => null);

jest.mock("openstack-uicore-foundation/lib/components", () => ({
  CompanyInput: () => null,
  DateTimePicker: () => null,
  Dropdown: () => null,
  FreeTextSearch: () => null,
  Input: () => null,
  MemberInput: () => null,
  OperatorInput: () => null,
  SpeakerInput: () => null,
  TagInput: () => null,
  UploadInput: () => null
}));

jest.mock(
  "../../../components/tables/editable-table/EditableTable",
  () =>
    function EditableTableMock(props) {
      mockEditableTableSpy(props);
      return null;
    }
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

jest.mock("../../../components/filters/media-type-filter", () => () => null);
jest.mock("../../../components/filters/or-and-filter", () => () => null);
jest.mock("../../../components/filters/save-filter-criteria", () => () => null);
jest.mock(
  "../../../components/filters/select-filter-criteria",
  () => () => null
);

describe("SummitEventListPage", () => {
  let windowOpenSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    windowOpenSpy = jest.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  test("does not pass afterUpdate prop to EditableTable in bulk mode", () => {
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
        currentEventListState: {
          events: [
            {
              id: 101,
              type: { id: 1, name: "Presentation", use_speakers: true },
              title: "Sample event",
              selection_status: "pending",
              media_uploads: []
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
          perPage: 10,
          enabledFilters: []
        }
      }
    });

    expect(mockEditableTableSpy).toHaveBeenCalled();

    const editableTableProps =
      mockEditableTableSpy.mock.calls[
        mockEditableTableSpy.mock.calls.length - 1
      ][0];
    expect(editableTableProps.afterUpdate).toBeUndefined();
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
          perPage: 10,
          enabledFilters: []
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
      "_blank"
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
          perPage: 10,
          enabledFilters: []
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
});
