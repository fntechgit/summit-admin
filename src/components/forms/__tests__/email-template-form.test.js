import React from "react";
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach
} from "@jest/globals";
import { render, act, fireEvent } from "@testing-library/react";
import mjml2html from "mjml-browser";
import showConfirmDialog from "../../mui/showConfirmDialog";

import EmailTemplateForm from "../email-template-form";

jest.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: ({ id, value, onChange }) => (
    <textarea
      data-testid={`editor-${id}`}
      value={value}
      onChange={(ev) => onChange(ev.target.value)}
    />
  )
}));
jest.mock("../../mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(true))
}));
jest.mock("mjml-browser", () => ({
  __esModule: true,
  default: jest.fn(() => ({ html: "<html></html>" }))
}));
jest.mock("../../inputs/email-template-input", () => ({
  __esModule: true,
  default: () => null
}));

const baseProps = (entity) => ({
  entity,
  errors: {},
  clients: [],
  preview: null,
  templateLoading: false,
  renderErrors: [],
  onSubmit: jest.fn(),
  onRender: jest.fn(),
  templateJsonData: { summit_name: "Test Summit" },
  renderEmailTemplate: jest.fn(() => Promise.resolve())
});

const mjmlEntity = {
  id: 5,
  identifier: "mjml-tpl",
  html_content: "",
  mjml_content: "<mjml><mj-body></mj-body></mjml>",
  plain_content: "",
  versions: []
};

const htmlEntity = {
  id: 6,
  identifier: "html-tpl",
  html_content: "<p>{{summit_name}}</p>",
  mjml_content: "",
  plain_content: "",
  versions: []
};

describe("EmailTemplateForm preview dispatch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    showConfirmDialog.mockResolvedValue(true);
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("sends raw mjml with isMjml=true for an MJML template", async () => {
    const props = baseProps(mjmlEntity);
    render(<EmailTemplateForm {...props} />);
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(props.renderEmailTemplate).toHaveBeenCalledTimes(1);
    expect(props.renderEmailTemplate).toHaveBeenCalledWith(
      props.templateJsonData,
      mjmlEntity.mjml_content,
      true
    );
  });

  it("sends html with isMjml=false for an HTML template", async () => {
    const props = baseProps(htmlEntity);
    render(<EmailTemplateForm {...props} />);
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(props.renderEmailTemplate).toHaveBeenCalledTimes(1);
    expect(props.renderEmailTemplate).toHaveBeenCalledWith(
      props.templateJsonData,
      htmlEntity.html_content,
      false
    );
  });

  it("re-inits preview mode when the loaded template changes in place (MJML -> HTML)", async () => {
    const sharedRender = jest.fn(() => Promise.resolve());
    const mjProps = {
      ...baseProps(mjmlEntity),
      renderEmailTemplate: sharedRender
    };
    const { rerender } = render(<EmailTemplateForm {...mjProps} />);

    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(sharedRender).toHaveBeenLastCalledWith(
      mjProps.templateJsonData,
      mjmlEntity.mjml_content,
      true
    );

    // navigate to a different template on the same form instance (no remount)
    const htmlProps = {
      ...baseProps(htmlEntity),
      renderEmailTemplate: sharedRender
    };
    rerender(<EmailTemplateForm {...htmlProps} />);
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    expect(sharedRender).toHaveBeenLastCalledWith(
      htmlProps.templateJsonData,
      htmlEntity.html_content,
      false
    );
  });

  it("re-fires the HTML-mode preview when toggled from MJML to HTML", async () => {
    const props = baseProps(mjmlEntity);
    const { getByText } = render(<EmailTemplateForm {...props} />);

    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(props.renderEmailTemplate).toHaveBeenCalledTimes(1);
    expect(props.renderEmailTemplate).toHaveBeenLastCalledWith(
      props.templateJsonData,
      mjmlEntity.mjml_content,
      true
    );

    // T.translate returns the key string when no i18n config is loaded
    await act(async () => {
      fireEvent.click(getByText("emails.display_html"));
    });
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    expect(props.renderEmailTemplate).toHaveBeenCalledTimes(2);
    expect(props.renderEmailTemplate).toHaveBeenLastCalledWith(
      props.templateJsonData,
      expect.any(String),
      false
    );
  });

  it.each([
    [true, "emails.display_html"],
    [false, "emails.display_mjml"]
  ])(
    "holds HTML mode while the MJML switch warning is pending, then applies confirmed=%s",
    async (confirmed, finalButton) => {
      let resolveConfirm;
      showConfirmDialog.mockReturnValue(
        new Promise((resolve) => {
          resolveConfirm = resolve;
        })
      );
      const props = baseProps(htmlEntity);
      const { getByText } = render(<EmailTemplateForm {...props} />);

      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      props.renderEmailTemplate.mockClear();

      fireEvent.click(getByText("emails.display_mjml"));
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      // no preview request for the (empty) mjml_content while still asking
      expect(props.renderEmailTemplate).not.toHaveBeenCalled();
      expect(getByText("emails.display_mjml")).toBeTruthy();

      await act(async () => {
        resolveConfirm(confirmed);
      });
      expect(getByText(finalButton)).toBeTruthy();
    }
  );
});

describe("EmailTemplateForm submit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    showConfirmDialog.mockResolvedValue(true);
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it.each(["resolves", "rejects"])(
    "blocks a double submit while saving and re-enables Save once the save %s",
    async (outcome) => {
      let settleSave;
      const onSubmit = jest.fn(
        () =>
          new Promise((resolve, reject) => {
            settleSave = outcome === "resolves" ? resolve : reject;
          })
      );
      const props = { ...baseProps(htmlEntity), onSubmit };
      const { getByRole } = render(<EmailTemplateForm {...props} />);

      const saveButton = getByRole("button", { name: "general.save" });
      await act(async () => {
        fireEvent.click(saveButton);
      });
      expect(saveButton).toBeDisabled();

      await act(async () => {
        fireEvent.click(saveButton);
      });
      expect(onSubmit).toHaveBeenCalledTimes(1);

      await act(async () => {
        settleSave(new Error("save failed"));
      });
      expect(saveButton).not.toBeDisabled();
    }
  );

  it("shows server errors per field, clears only the edited field's error, and keeps unsaved edits", async () => {
    Element.prototype.scrollIntoView = jest.fn();
    const props = baseProps(htmlEntity);
    const { container, getByRole, findByText, queryByText, rerender } = render(
      <EmailTemplateForm {...props} />
    );

    fireEvent.change(container.querySelector("#subject"), {
      target: { name: "subject", value: "Edited subject" }
    });
    rerender(
      <EmailTemplateForm
        {...props}
        errors={{ identifier: "already taken", from_email: "invalid" }}
      />
    );
    expect(await findByText("already taken")).toBeTruthy();
    expect(container.querySelector("#subject").value).toBe("Edited subject");

    await act(async () => {
      fireEvent.change(container.querySelector("#identifier"), {
        target: { name: "identifier", value: "new-identifier" }
      });
    });
    expect(queryByText("already taken")).toBeNull();
    expect(queryByText("invalid")).toBeTruthy();

    await act(async () => {
      fireEvent.click(getByRole("button", { name: "general.save" }));
    });
    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Edited subject",
        identifier: "new-identifier"
      })
    );
  });
});

describe("EmailTemplateForm mjml validation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mjml2html.mockImplementation(() => {
      throw new Error("Malformed MJML");
    });
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
    mjml2html.mockImplementation(() => ({ html: "<html></html>" }));
  });

  it("does not compile unedited mjml (on load or a bare mode switch), so Save stays enabled", async () => {
    const { getByRole, getByText } = render(
      <EmailTemplateForm {...baseProps(mjmlEntity)} />
    );
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    await act(async () => {
      fireEvent.click(getByText("emails.display_html"));
    });
    await act(async () => {
      fireEvent.click(getByText("emails.display_mjml"));
    });

    expect(mjml2html).not.toHaveBeenCalled();
    expect(getByRole("button", { name: "general.save" })).not.toBeDisabled();
  });

  it("disables Save once an edit makes the mjml invalid", async () => {
    const { getByRole, getByTestId } = render(
      <EmailTemplateForm {...baseProps(mjmlEntity)} />
    );

    await act(async () => {
      fireEvent.change(getByTestId("editor-mjml_content"), {
        target: { value: "<mjml><mj-body><mj-text foo='1'>" }
      });
    });

    expect(mjml2html).toHaveBeenCalled();
    expect(getByRole("button", { name: "general.save" })).toBeDisabled();
  });

  it("never compiles a child template's raw mjml, even after an edit", async () => {
    const childEntity = {
      ...mjmlEntity,
      parent: { id: 3, identifier: "layout" },
      mjml_content: "{% extends 'layout' %}{% block content %}{% endblock %}"
    };
    const { getByRole, getByTestId } = render(
      <EmailTemplateForm {...baseProps(childEntity)} />
    );

    await act(async () => {
      fireEvent.change(getByTestId("editor-mjml_content"), {
        target: {
          value: "{% extends 'layout' %}{% block content %}x{% endblock %}"
        }
      });
    });

    expect(mjml2html).not.toHaveBeenCalled();
    expect(getByRole("button", { name: "general.save" })).not.toBeDisabled();
  });
});
