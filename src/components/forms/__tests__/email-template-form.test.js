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
  default: () => null
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

  it("warns before switching to MJML on an HTML-only template and keeps the switch on confirm", async () => {
    showConfirmDialog.mockResolvedValue(true);
    const props = baseProps(htmlEntity);
    const { getByText } = render(<EmailTemplateForm {...props} />);

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    await act(async () => {
      fireEvent.click(getByText("emails.display_mjml"));
    });

    expect(showConfirmDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "emails.mjml_warning",
        iconType: "warning"
      })
    );

    expect(getByText("emails.display_html")).toBeTruthy();
  });

  it("reverts to HTML mode when the MJML switch warning is cancelled", async () => {
    showConfirmDialog.mockResolvedValue(false);
    const props = baseProps(htmlEntity);
    const { getByText } = render(<EmailTemplateForm {...props} />);

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    await act(async () => {
      fireEvent.click(getByText("emails.display_mjml"));
    });

    expect(getByText("emails.display_mjml")).toBeTruthy();
  });

  it("does not preview or compile the empty mjml_content while the switch warning is still pending", async () => {
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

    // the dialog hasn't resolved yet -- mode must still be HTML, so no
    // preview request went out for the (empty) mjml_content
    expect(props.renderEmailTemplate).not.toHaveBeenCalled();
    expect(getByText("emails.display_mjml")).toBeTruthy();

    await act(async () => {
      resolveConfirm(true);
    });
  });

  it("does not attempt to compile mjml on a bare mode switch with unchanged (empty) content", async () => {
    const props = baseProps(htmlEntity);
    const { getByText } = render(<EmailTemplateForm {...props} />);

    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    mjml2html.mockClear();

    await act(async () => {
      fireEvent.click(getByText("emails.display_mjml"));
    });

    // switching modes alone must not attempt a compile of the unchanged,
    // still-empty mjml_content -- doing so would leave a stale
    // mjmlRenderError behind after switching back to HTML
    expect(mjml2html).not.toHaveBeenCalled();
  });
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

  it("submits the current entity and disables the Save button while saving, blocking a double submit", async () => {
    let resolveSave;
    const onSubmit = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );
    const props = { ...baseProps(htmlEntity), onSubmit };
    const { getByRole } = render(<EmailTemplateForm {...props} />);

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    const saveButton = getByRole("button", { name: "general.save" });
    fireEvent.click(saveButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ id: htmlEntity.id })
    );
    expect(saveButton).toBeDisabled();

    fireEvent.click(saveButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave();
    });
  });

  it("re-enables the Save button after a rejected save", async () => {
    const onSubmit = jest.fn(() => Promise.reject(new Error("save failed")));
    const props = { ...baseProps(htmlEntity), onSubmit };
    const { getByRole } = render(<EmailTemplateForm {...props} />);

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    const saveButton = getByRole("button", { name: "general.save" });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(saveButton).not.toBeDisabled();
  });
});
