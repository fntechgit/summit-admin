// src/pages/sponsors/sponsor-users/edit-user-popup/__tests__/EditUserPopup.test.js
import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  renderWithRedux,
  findButtonByIcon,
  createMockUser,
  createMockSummit,
  createMockUserGroups
} from "../../../../../../utils/test-utils";
import EditUserPopup from "../index";
import * as sponsorUsersActions from "../../../../../../actions/sponsor-users-actions";

// Add global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    status: 200,
    statusText: "OK",
    headers: new Headers()
  })
);

// Mock the actions to return plain objects (not async functions)
jest.mock("../../../../../../actions/sponsor-users-actions", () => ({
  getUserGroups: jest.fn().mockReturnValue({
    type: "GET_USER_GROUPS",
    payload: Promise.resolve([])
  }),
  updateShowSponsorUser: jest.fn().mockReturnValue({
    type: "UPDATE_SPONSOR_USER",
    payload: Promise.resolve({})
  })
}));

// Mock the confirm dialog
jest.mock("../../../../../../components/mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

describe("EditUserPopup", () => {
  // Setup test data
  const mockUser = createMockUser();
  const mockSummit = createMockSummit();
  const mockUserGroups = createMockUserGroups();

  // Setup initial store state
  const initialState = {
    sponsorUsersListState: {
      userGroups: mockUserGroups
    },
    currentSummitState: {
      currentSummit: mockSummit
    }
  };

  const onCloseMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    global.fetch.mockClear();
  });

  it("renders correctly and loads user groups", async () => {
    // Render the component with Redux
    const { store } = renderWithRedux(
      <EditUserPopup user={mockUser} onClose={onCloseMock} />,
      { initialState }
    );

    // Find the h5 element that contains the title using pure Jest matchers
    const titleElement = screen.getByRole("heading", { level: 5 });
    expect(titleElement.textContent).toBe("sponsor_users.edit_user.title");

    // Without jest-dom, use simpler assertions
    const dialogTitle = screen.getByRole("dialog");
    const titleInDialog = within(dialogTitle).getByText(
      "sponsor_users.edit_user.title"
    );
    expect(titleInDialog).toBeTruthy(); // Simple existence check

    // Check form fields are rendered with correct values
    const nameInput = screen.getByLabelText("sponsor_users.edit_user.name");
    expect(nameInput.value).toBe("John");

    const emailInput = screen.getByLabelText("sponsor_users.edit_user.email");
    expect(emailInput.value).toBe("john.doe@example.com");

    // Verify that the action was dispatched
    expect(sponsorUsersActions.getUserGroups).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "GET_USER_GROUPS"
      })
    );
  });

  it("closes when the close button is clicked", async () => {
    renderWithRedux(<EditUserPopup user={mockUser} onClose={onCloseMock} />, {
      initialState
    });

    // Find and click the close button
    const closeButtons = screen.getAllByRole("button");
    const closeButton = findButtonByIcon(closeButtons, "CloseIcon");
    await userEvent.click(closeButton);

    // Verify onClose was called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("submits the form and calls updateShowSponsorUser", async () => {
    // Spy on the action rather than replacing its implementation
    const updateSpy = jest.spyOn(sponsorUsersActions, "updateShowSponsorUser");

    // Render the component
    renderWithRedux(<EditUserPopup user={mockUser} onClose={onCloseMock} />, {
      initialState
    });

    // Find the submit button
    const submitButton = screen.getByRole("button", {
      name: "sponsor_users.edit_user.save"
    });

    // Click the submit button
    await userEvent.click(submitButton);

    // Wait for the action to be called
    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled();
    });
  });
});
