import React from "react";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../utils/test-utils";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";
import { publishOverflowEnd } from "../../../actions/signage-actions";
import SignagePage from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

jest.mock("../../../components/mui/showConfirmDialog", () => jest.fn());

jest.mock("../../../actions/signage-actions", () => {
  const noop = () => () => ({ type: "NOOP" });
  return {
    __esModule: true,
    getLocations: jest.fn(noop()),
    getSign: jest.fn(noop()),
    getSignBanners: jest.fn(noop()),
    getSignEvents: jest.fn(noop()),
    getTemplates: jest.fn(noop()),
    publishDate: jest.fn(noop()),
    publishOverflowEnd: jest.fn(noop()),
    publishReload: jest.fn(noop()),
    publishTemplate: jest.fn(noop()),
    saveStaticBanner: jest.fn(noop())
  };
});

const locationId = 844;

const overflowEvent = {
  id: 10140,
  title: "Welcome Address",
  occupancy: "OVERFLOW"
};

const fullEvent = {
  id: 10141,
  title: "Keynote",
  occupancy: "FULL"
};

const renderPage = () =>
  renderWithRedux(<SignagePage match={{ url: "/signage" }} />, {
    initialState: {
      currentSummitState: {
        currentSummit: { id: 73, time_zone_id: "UTC", locations: [] }
      },
      signageState: {
        locations: [],
        templates: [],
        events: [overflowEvent, fullEvent],
        banners: [],
        staticBanner: { content: "" },
        locationId,
        term: "",
        page: 1,
        currentPage: 1,
        lastPage: 1
      }
    }
  });

const endOverflowIcons = (container) =>
  container.querySelectorAll(".fa-stop-circle");

describe("SignagePage end overflow action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is offered only on activities in OVERFLOW", () => {
    const { container } = renderPage();

    const icons = endOverflowIcons(container);
    expect(icons).toHaveLength(1);
    expect(icons[0].closest("tr")).toHaveTextContent(overflowEvent.title);
  });

  it("publishes the overflow end for the activity once the user confirms", async () => {
    showConfirmDialog.mockResolvedValue(true);
    const { container } = renderPage();

    await userEvent.click(endOverflowIcons(container)[0]);

    await waitFor(() =>
      expect(publishOverflowEnd).toHaveBeenCalledWith(73, overflowEvent.id)
    );
  });

  it("publishes nothing when the user cancels", async () => {
    showConfirmDialog.mockResolvedValue(false);
    const { container } = renderPage();

    await userEvent.click(endOverflowIcons(container)[0]);

    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
    expect(publishOverflowEnd).not.toHaveBeenCalled();
  });
});
