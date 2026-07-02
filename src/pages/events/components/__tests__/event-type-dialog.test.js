import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventTypeDialog from "../event-type-dialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: jest.fn((key) => key)
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () =>
    function MockTextField({ name }) {
      // eslint-disable-next-line global-require
      const { useField } = require("formik");
      const [field, meta] = useField(name);
      return (
        <>
          <input
            data-testid={`textfield-${name}`}
            name={name}
            value={field.value ?? ""}
            onChange={field.onChange}
          />
          {meta.touched && meta.error && <span>{meta.error}</span>}
        </>
      );
    }
);

jest.mock(
  "../../../../components/mui/formik-inputs/mui-formik-select",
  () =>
    function MockSelect({ name, children, disabled }) {
      return (
        <div data-testid={`select-${name}`} data-disabled={!!disabled}>
          {children}
        </div>
      );
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/table",
  () =>
    function MockTable() {
      return <div data-testid="mui-table" />;
    }
);

jest.mock("../../../../hooks/useScrollToError", () => jest.fn());

jest.mock("mui-color-input", () => ({
  MuiColorInput: ({ value, onChange }) => (
    <input
      data-testid="color-input"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}));

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  queryTicketTypes: jest.fn()
}));

const BASE_ENTITY = {
  id: 0,
  name: "",
  class_name: "",
  color: "",
  black_out_times: "None",
  use_sponsors: false,
  are_sponsors_mandatory: false,
  allows_location: false,
  allows_publishing_dates: false,
  should_be_available_on_cfp: false,
  use_speakers: false,
  are_speakers_mandatory: false,
  allow_custom_ordering: false,
  allow_attendee_vote: false,
  min_speakers: 0,
  max_speakers: 0,
  use_moderator: false,
  is_moderator_mandatory: false,
  moderator_label: "",
  min_moderators: 0,
  max_moderators: 0,
  allows_attachment: false,
  allowed_media_upload_types: [],
  allowed_ticket_types: [],
  allows_location_timeframe_collision: false,
  allows_speaker_event_collision: false,
  show_always_on_schedule: false,
  min_duration: 0,
  max_duration: 0
};

const CURRENT_SUMMIT = { id: 42, time_zone_id: "UTC" };

describe("EventTypeDialog", () => {
  let onSave;
  let onClose;
  let getMediaUploads;
  let onMediaUploadLink;
  let onMediaUploadUnLink;

  beforeEach(() => {
    jest.clearAllMocks();
    onSave = jest.fn(() => Promise.resolve());
    onClose = jest.fn();
    getMediaUploads = jest.fn(() => Promise.resolve({ options: [] }));
    onMediaUploadLink = jest.fn();
    onMediaUploadUnLink = jest.fn();
  });

  const renderDialog = (entity = BASE_ENTITY, errors = {}) =>
    render(
      <EventTypeDialog
        currentSummit={CURRENT_SUMMIT}
        entity={entity}
        errors={errors}
        onSave={onSave}
        onClose={onClose}
        getMediaUploads={getMediaUploads}
        onMediaUploadLink={onMediaUploadLink}
        onMediaUploadUnLink={onMediaUploadUnLink}
      />
    );

  it("renders the Main tab by default with the name field", () => {
    renderDialog();

    expect(screen.getByRole("tab", { name: /main/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /schedule_settings/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("textfield-name")).toBeInTheDocument();
  });

  it("disables the class_name select once the entity has an id", () => {
    renderDialog({ ...BASE_ENTITY, id: 5, class_name: "EVENT_TYPE" });

    expect(screen.getByTestId("select-class_name")).toHaveAttribute(
      "data-disabled",
      "true"
    );
  });

  it("leaves the class_name select enabled for a new entity", () => {
    renderDialog({ ...BASE_ENTITY, id: 0 });

    expect(screen.getByTestId("select-class_name")).toHaveAttribute(
      "data-disabled",
      "false"
    );
  });

  it("hides PRESENTATION_TYPE-only fields for an EVENT_TYPE entity", () => {
    renderDialog({ ...BASE_ENTITY, class_name: "EVENT_TYPE" });

    expect(
      screen.queryByTestId("textfield-min_speakers")
    ).not.toBeInTheDocument();
  });

  it("shows PRESENTATION_TYPE-only fields for a PRESENTATION_TYPE entity", () => {
    renderDialog({ ...BASE_ENTITY, class_name: "PRESENTATION_TYPE" });

    expect(screen.getByTestId("textfield-min_speakers")).toBeInTheDocument();
  });

  it("switching to the Schedule settings tab shows allowed_ticket_types", async () => {
    const user = userEvent.setup();
    renderDialog();

    await act(async () => {
      await user.click(screen.getByRole("tab", { name: /schedule_settings/i }));
    });

    expect(
      screen.getByText("edit_event_type.allowed_ticket_types")
    ).toBeInTheDocument();
  });

  it("disables the save button while saving and re-enables after resolve", async () => {
    let resolveSave;
    onSave = jest.fn(
      () =>
        new Promise((res) => {
          resolveSave = res;
        })
    );
    const user = userEvent.setup();
    renderDialog({ ...BASE_ENTITY, name: "Keynote", class_name: "EVENT_TYPE" });

    const saveButton = screen.getByText("general.save").closest("button");
    expect(saveButton).not.toBeDisabled();

    await act(async () => {
      await user.click(saveButton);
    });

    expect(saveButton).toBeDisabled();

    await act(async () => {
      resolveSave();
    });

    await waitFor(() => expect(saveButton).not.toBeDisabled());
  });

  it("keeps dialog open and re-enables save when onSave rejects", async () => {
    onSave = jest.fn(() => Promise.reject(new Error("server error")));
    const user = userEvent.setup();
    renderDialog({ ...BASE_ENTITY, name: "Keynote", class_name: "EVENT_TYPE" });

    const saveButton = screen.getByText("general.save").closest("button");

    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => expect(saveButton).not.toBeDisabled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when the close icon is clicked and not saving", async () => {
    const user = userEvent.setup();
    renderDialog();

    await act(async () => {
      await user.click(screen.getByLabelText("close"));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("Yup validation", () => {
    it("blocks submit and shows a required error when name is empty", async () => {
      const user = userEvent.setup();
      renderDialog({ ...BASE_ENTITY, name: "", class_name: "EVENT_TYPE" });

      await act(async () => {
        await user.click(screen.getByText("general.save").closest("button"));
      });

      expect(
        screen.getByTestId("textfield-name").nextSibling
      ).toHaveTextContent("validation.required");
      expect(onSave).not.toHaveBeenCalled();
    });

    it("blocks submit and shows an integer error for a non-numeric min_speakers value", async () => {
      const user = userEvent.setup();
      renderDialog({
        ...BASE_ENTITY,
        name: "Keynote",
        class_name: "PRESENTATION_TYPE"
      });

      const minSpeakersInput = screen.getByTestId("textfield-min_speakers");
      await act(async () => {
        await user.clear(minSpeakersInput);
        await user.type(minSpeakersInput, "abc");
        await user.click(screen.getByText("general.save").closest("button"));
      });

      expect(minSpeakersInput.nextSibling).toHaveTextContent(
        "validation.number"
      );
      expect(onSave).not.toHaveBeenCalled();
    });

    it("submits 0 instead of NaN when a numeric field is cleared to empty", async () => {
      const user = userEvent.setup();
      renderDialog({
        ...BASE_ENTITY,
        name: "Keynote",
        class_name: "PRESENTATION_TYPE",
        min_speakers: 1
      });

      const minSpeakersInput = screen.getByTestId("textfield-min_speakers");
      await act(async () => {
        await user.clear(minSpeakersInput);
        await user.click(screen.getByText("general.save").closest("button"));
      });

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ min_speakers: 0 })
      );
      const [submittedValues] = onSave.mock.calls[0];
      expect(Number.isNaN(submittedValues.min_speakers)).toBe(false);
    });
  });

  it("submits with integer-coerced numeric fields and the picked color", async () => {
    const user = userEvent.setup();
    renderDialog({
      ...BASE_ENTITY,
      name: "Keynote",
      class_name: "PRESENTATION_TYPE",
      color: "#ff0000",
      min_speakers: 1,
      max_speakers: 5,
      min_moderators: 0,
      max_moderators: 2,
      min_duration: 10,
      max_duration: 20
    });

    await act(async () => {
      await user.click(screen.getByText("general.save").closest("button"));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "#ff0000",
        min_speakers: 1,
        max_speakers: 5,
        min_moderators: 0,
        max_moderators: 2,
        min_duration: 10,
        max_duration: 20,
        allowed_ticket_types: []
      })
    );
  });

  it("renders an inline error for a field when the errors prop is populated", () => {
    renderDialog(
      { ...BASE_ENTITY, class_name: "EVENT_TYPE" },
      { name: "Name already in use" }
    );

    expect(screen.getByText("Name already in use")).toBeInTheDocument();
  });

  it("clears the selected ticket types when show_always_on_schedule is checked", async () => {
    const user = userEvent.setup();
    renderDialog({
      ...BASE_ENTITY,
      allowed_ticket_types: [{ id: 1, name: "VIP" }]
    });

    await act(async () => {
      await user.click(screen.getByRole("tab", { name: /schedule_settings/i }));
    });

    expect(screen.getByText("VIP")).toBeInTheDocument();

    await act(async () => {
      await user.click(
        screen.getByRole("checkbox", {
          name: "edit_event_type.show_always_on_schedule"
        })
      );
    });

    expect(screen.queryByText("VIP")).not.toBeInTheDocument();
  });

  it("shows pre-populated ticket types as selected chips when editing an existing entity", async () => {
    const user = userEvent.setup();
    renderDialog({
      ...BASE_ENTITY,
      id: 3,
      allowed_ticket_types: [
        { id: 1, name: "VIP" },
        { id: 2, name: "General" }
      ]
    });

    await act(async () => {
      await user.click(screen.getByRole("tab", { name: /schedule_settings/i }));
    });

    expect(screen.getByText("VIP")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  describe("media upload types", () => {
    const PRESENTATION_ENTITY_WITH_ID = {
      ...BASE_ENTITY,
      id: 7,
      class_name: "PRESENTATION_TYPE",
      allowed_media_upload_types: [
        { id: 1, name: "Slides", type_name: "Slides Type", max_size: "10MB" }
      ]
    };

    it("does not render the section for a new (id===0) entity", () => {
      renderDialog({ ...BASE_ENTITY, class_name: "PRESENTATION_TYPE" });
      expect(screen.queryByTestId("mui-table")).not.toBeInTheDocument();
    });

    it("does not render the section for EVENT_TYPE entities", () => {
      renderDialog({ ...BASE_ENTITY, id: 7, class_name: "EVENT_TYPE" });
      expect(screen.queryByTestId("mui-table")).not.toBeInTheDocument();
    });

    it("renders the linked media upload types table for an existing PRESENTATION_TYPE entity", () => {
      renderDialog(PRESENTATION_ENTITY_WITH_ID);
      expect(screen.getByTestId("mui-table")).toBeInTheDocument();
    });

    it("excludes already-linked media upload types from the search suggestions", async () => {
      const user = userEvent.setup();
      getMediaUploads.mockImplementation((input, callback) => {
        callback([
          { id: 1, name: "Slides" },
          { id: 2, name: "Handout" }
        ]);
        return Promise.resolve();
      });
      renderDialog(PRESENTATION_ENTITY_WITH_ID);

      const searchInput = screen.getByRole("combobox", {
        name: "edit_event_type.media_upload_types"
      });
      await act(async () => {
        await user.type(searchInput, "S");
      });

      expect(screen.queryByText("Slides")).not.toBeInTheDocument();
      expect(screen.getByText("Handout")).toBeInTheDocument();
    });
  });
});
