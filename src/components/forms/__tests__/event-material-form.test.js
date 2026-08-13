import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EventMaterialForm from "../event-material-form";

// jsdom does not implement scrollIntoView; polyfill so the errors effect
// (which calls scrollToError -> firstNode.scrollIntoView) does not throw.
window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/editor-input-v3",
  () => ({
    __esModule: true,
    default: ({ id, value }) => <div data-testid={id}>{value}</div>
  })
);

const EVENT = {
  title: "Event Title",
  description: "Event description",
  type: { allowed_media_upload_types: [] }
};

const populatedEntity = {
  id: 5,
  class_name: "PresentationLink",
  name: "Existing Material",
  description: "Existing description",
  link: "https://example.com/existing",
  display_on_site: false
};

const defaultEntity = {
  id: 0,
  class_name: "",
  name: "",
  description: "",
  link: "",
  display_on_site: false
};

const renderForm = (entity) =>
  render(
    <EventMaterialForm
      entity={entity}
      errors={{}}
      event={EVENT}
      onSubmit={jest.fn()}
    />
  );

describe("EventMaterialForm", () => {
  it("resets stale entity state when switching from an existing material to a new/default one", () => {
    const { rerender } = renderForm(populatedEntity);

    expect(screen.getByDisplayValue("Existing Material")).toBeInTheDocument();
    expect(screen.getByTestId("description")).toHaveTextContent(
      "Existing description"
    );

    rerender(
      <EventMaterialForm
        entity={defaultEntity}
        errors={{}}
        event={EVENT}
        onSubmit={jest.fn()}
      />
    );

    expect(
      screen.queryByDisplayValue("Existing Material")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("description")).toHaveTextContent("");
  });

  it("does not prefill a new material's name/description from the event", () => {
    const { rerender } = renderForm(populatedEntity);

    rerender(
      <EventMaterialForm
        entity={defaultEntity}
        errors={{}}
        event={EVENT}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.queryByDisplayValue("Event Title")).not.toBeInTheDocument();
    expect(screen.getByTestId("description")).not.toHaveTextContent(
      "Event description"
    );
  });

  it("keeps user edits and shows the error when a validation errors prop arrives", () => {
    const entity = { ...populatedEntity };
    const { rerender } = render(
      <EventMaterialForm
        entity={entity}
        errors={{}}
        event={EVENT}
        onSubmit={jest.fn()}
      />
    );

    fireEvent.change(screen.getByDisplayValue("Existing Material"), {
      target: { value: "Edited Material" }
    });
    expect(screen.getByDisplayValue("Edited Material")).toBeInTheDocument();

    // same entity reference, new errors object - mirrors the reducer's
    // VALIDATE case, which preserves state.entity and replaces errors
    rerender(
      <EventMaterialForm
        entity={entity}
        errors={{ name: "name is required" }}
        event={EVENT}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByDisplayValue("Edited Material")).toBeInTheDocument();
    expect(screen.getByText("name is required")).toBeInTheDocument();
  });
});
