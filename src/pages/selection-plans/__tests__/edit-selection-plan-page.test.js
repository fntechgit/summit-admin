/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React from "react";
import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import EditSelectionPlanPage from "../edit-selection-plan-page";
import {
  saveSelectionPlan,
  saveSelectionPlanSettings
} from "../../../actions/selection-plan-actions";

jest.mock("../../../actions/selection-plan-actions", () => ({
  __esModule: true,
  saveSelectionPlan: jest.fn(),
  saveSelectionPlanSettings: jest.fn()
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Stub the real form: it needs a fuller entity/marketing-settings shape than
// set up here. Exposes onSave so the page's save/redirect logic can be
// exercised directly. The form now connects to the store itself for its
// entity, so the stub reads it from there too, mirroring the real component.
jest.mock("../../../components/forms/selection-plan-form", () => {
  const { useSelector } = jest.requireActual("react-redux");
  return {
    __esModule: true,
    default: ({ onSave }) => {
      const entity = useSelector(
        (state) => state.currentSelectionPlanState.entity
      );
      return (
        <div data-testid="selection-plan-form">
          <button
            type="button"
            onClick={() => onSave({ id: entity.id, marketing_settings: {} })}
          >
            save
          </button>
        </div>
      );
    }
  };
});

const mockHistory = { push: jest.fn() };

const stateFor = (entity) => ({
  currentSummitState: { currentSummit: { id: 1 } },
  currentSelectionPlanState: {
    entity,
    allowedMembers: { data: [], currentPage: 1, lastPage: 1 },
    errors: {}
  }
});

describe("EditSelectionPlanPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves and redirects to the new plan on create", async () => {
    saveSelectionPlan.mockReturnValue(() => Promise.resolve({ id: 42 }));
    saveSelectionPlanSettings.mockReturnValue(() => Promise.resolve());

    renderWithRedux(
      <MemoryRouter>
        <EditSelectionPlanPage history={mockHistory} />
      </MemoryRouter>,
      {
        initialState: stateFor({ id: 0 })
      }
    );

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "save" }));
      await flushPromises();
    });

    expect(saveSelectionPlan).toHaveBeenCalledWith({
      id: 0,
      marketing_settings: {}
    });
    expect(saveSelectionPlanSettings).toHaveBeenCalledWith({}, 42);
    expect(mockHistory.push).toHaveBeenCalledWith(
      "/app/summits/1/selection-plans/42"
    );
  });

  it("saves an existing plan without redirecting", async () => {
    saveSelectionPlan.mockReturnValue(() => Promise.resolve({ id: 5 }));
    saveSelectionPlanSettings.mockReturnValue(() => Promise.resolve());

    renderWithRedux(
      <MemoryRouter>
        <EditSelectionPlanPage history={mockHistory} />
      </MemoryRouter>,
      {
        initialState: stateFor({ id: 5 })
      }
    );

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "save" }));
      await flushPromises();
    });

    expect(saveSelectionPlan).toHaveBeenCalledWith({
      id: 5,
      marketing_settings: {}
    });
    expect(mockHistory.push).not.toHaveBeenCalled();
  });

  it("still redirects and re-enables the save button when saving marketing settings fails", async () => {
    saveSelectionPlan.mockReturnValue(() => Promise.resolve({ id: 42 }));
    saveSelectionPlanSettings.mockReturnValue(() =>
      Promise.reject(new Error("settings failed"))
    );

    renderWithRedux(
      <MemoryRouter>
        <EditSelectionPlanPage history={mockHistory} />
      </MemoryRouter>,
      {
        initialState: stateFor({ id: 0 })
      }
    );

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "save" }));
      await flushPromises();
      await flushPromises();
    });

    expect(mockHistory.push).toHaveBeenCalledWith(
      "/app/summits/1/selection-plans/42"
    );
    expect(
      screen.getByRole("button", { name: "general.save" })
    ).not.toBeDisabled();
  });

  it("does not save twice while a save is already in flight", async () => {
    let resolveSave;
    saveSelectionPlan.mockReturnValue(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );

    renderWithRedux(
      <MemoryRouter>
        <EditSelectionPlanPage history={mockHistory} />
      </MemoryRouter>,
      {
        initialState: stateFor({ id: 5 })
      }
    );

    const saveButton = screen.getByRole("button", { name: "save" });
    await userEvent.click(saveButton);
    await userEvent.click(saveButton);

    expect(saveSelectionPlan).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave({ id: 5 });
      await flushPromises();
    });
  });

  it("does not show the Add New action for an unsaved plan", () => {
    renderWithRedux(
      <MemoryRouter>
        <EditSelectionPlanPage history={mockHistory} />
      </MemoryRouter>,
      {
        initialState: stateFor({ id: 0 })
      }
    );

    expect(
      screen.queryByRole("button", { name: "general.add_new" })
    ).not.toBeInTheDocument();
  });
});
