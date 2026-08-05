import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import EventMaterialForm from "../event-material-form";

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
});
