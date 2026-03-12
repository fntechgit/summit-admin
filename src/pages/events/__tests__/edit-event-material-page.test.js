import React from "react";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import EditEventMaterialPage from "../edit-event-material-page";
import { renderWithRedux } from "../../../utils/test-utils";

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

jest.mock("../../../components/buttons/add-new-button", () => () => null);

jest.mock("../../../components/forms/event-material-form", () => (props) => (
  <div>
    <button type="button" onClick={() => props.onSubmit({ id: 77 })}>
      submit-material
    </button>
    <button
      type="button"
      onClick={() =>
        props.onSubmitWithFile(
          { id: 88, class_name: "PresentationSlide" },
          new global.File(["dummy"], "slides.pdf", {
            type: "application/pdf"
          })
        )
      }
    >
      submit-material-with-file
    </button>
  </div>
));

jest.mock("../../../actions/event-material-actions", () => ({
  getEventMaterial: jest.fn(() => ({ type: "GET_EVENT_MATERIAL_MOCK" })),
  resetEventMaterialForm: jest.fn(() => ({
    type: "RESET_EVENT_MATERIAL_MOCK"
  })),
  saveEventMaterial: jest.fn(() => ({ type: "SAVE_EVENT_MATERIAL_MOCK" })),
  saveEventMaterialWithFile: jest.fn(() => ({
    type: "SAVE_EVENT_MATERIAL_WITH_FILE_MOCK"
  }))
}));

const EventMaterialActions = jest.requireMock(
  "../../../actions/event-material-actions"
);

describe("EditEventMaterialPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseState = {
    currentSummitState: {
      currentSummit: { id: 12 }
    },
    currentSummitEventState: {
      entity: {
        id: 321,
        materials: []
      }
    },
    currentEventMaterialState: {
      entity: { id: 0, class_name: "PresentationSlide" },
      errors: {}
    }
  };

  test("uses saveEventMaterial for regular material submit (non-bulk)", async () => {
    const user = userEvent.setup();

    renderWithRedux(
      <EditEventMaterialPage
        match={{
          params: { material_id: "15" },
          url: "/app/summits/12/events/321/materials/15"
        }}
      />,
      {
        initialState: baseState
      }
    );

    expect(EventMaterialActions.getEventMaterial).toHaveBeenCalledWith("15");

    await user.click(screen.getByText("submit-material"));

    expect(EventMaterialActions.saveEventMaterial).toHaveBeenCalledTimes(1);
    expect(EventMaterialActions.saveEventMaterial).toHaveBeenCalledWith({
      id: 77
    });
  });

  test("uses saveEventMaterialWithFile with slides slug for file submit", async () => {
    const user = userEvent.setup();

    renderWithRedux(
      <EditEventMaterialPage
        match={{
          params: { material_id: "15" },
          url: "/app/summits/12/events/321/materials/15"
        }}
      />,
      {
        initialState: baseState
      }
    );

    await user.click(screen.getByText("submit-material-with-file"));

    expect(
      EventMaterialActions.saveEventMaterialWithFile
    ).toHaveBeenCalledTimes(1);

    const [entityArg, fileArg, slugArg] =
      EventMaterialActions.saveEventMaterialWithFile.mock.calls[0];

    expect(entityArg).toEqual({ id: 88, class_name: "PresentationSlide" });
    expect(fileArg).toBeInstanceOf(global.File);
    expect(slugArg).toBe("slides");
  });
});
