import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../../../utils/test-utils";
import ProcessRequestPopup from "../process-request-popup";
import * as sponsorUsersActions from "../../../../../actions/sponsor-users-actions";
import summitsMock from "./summits.mock.json";
import userGroupsMock from "./userGroups.mock.json";

// Mock the actions to return plain objects (not async functions)
jest.mock("../../../../../actions/sponsor-users-actions", () => {
  const originalModule = jest.requireActual(
    "../../../../../actions/sponsor-users-actions"
  );

  return {
    __esModule: true,
    ...originalModule,
    processSponsorUserRequest: jest.fn(() => ({
      type: "processSponsorUserRequest",
      payload: {}
    })),
    updateShowSponsorUser: jest.fn(() => ({
      type: "processSponsorUserRequest",
      payload: {}
    })),
    fetchSponsorByCompany: jest.fn(() =>
      Promise.resolve({
        id: 29,
        name: "Accelink Technologies"
      })
    ),
    getUserGroups: jest.fn(() => ({
        type: "XXX",
        payload: {}
      }))
  };
});

jest.mock("../../../../../actions/company-actions", () => {
  const originalModule = jest.requireActual(
    "../../../../../actions/company-actions"
  );

  return {
    __esModule: true,
    ...originalModule,
    queryCompanies: jest.fn()
  };
});

jest.mock("../../../../../actions/sponsor-actions", () => {
  const originalModule = jest.requireActual(
    "../../../../../actions/sponsor-actions"
  );

  return {
    __esModule: true,
    ...originalModule,
    querySponsors: jest.fn()
  };
});

jest.mock("../../../../../actions/sponsorship-actions", () => {
  const originalModule = jest.requireActual(
    "../../../../../actions/sponsorship-actions"
  );

  return {
    __esModule: true,
    ...originalModule,
    querySponsorshipsBySummit: jest.fn()
  };
});

jest.mock("lodash", () => {
  const originalModule = jest.requireActual("lodash");

  return {
    __esModule: true,
    ...originalModule,
    debounce: jest.fn()
  };
});

describe("ProcessRequestPopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  it("closes modal on process request click", async () => {
    const onCloseMock = jest.fn();

    const requestMock = {
      id: 29,
      requester_first_name: "cespin101 Espinoza",
      requester_email: "cespin+101@gmail.com",
      company_id: 179,
      company_name: "Accelink Technologies",
      created: "December 29th 2025, 1:27:29 am"
    };

    renderWithRedux(
      <ProcessRequestPopup request={requestMock} onClose={onCloseMock} />,
      {
        initialState: {
          sponsorUsersListState: userGroupsMock,
          currentSummitState: summitsMock
        }
      }
    );

    const processRequestButton = screen.getAllByText(
      "sponsor_users.process_request.save"
    )[0];

    await act(async () => {
      await userEvent.click(processRequestButton);
    });
    expect(sponsorUsersActions.processSponsorUserRequest).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });
});
