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

import EmailTemplateForm from "../email-template-form";

// Mock heavy children that don't matter for the effect logic under test.
jest.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn(() => Promise.resolve({})) }
}));
jest.mock("mjml-browser", () => ({
  __esModule: true,
  default: () => ({ html: "<html></html>" })
}));
jest.mock("../../inputs/email-template-input", () => ({
  __esModule: true,
  default: () => null
}));

const baseProps = (entity) => ({
  entity,
  match: { params: { template_id: `${entity.id}` } },
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
  beforeEach(() => jest.useFakeTimers());
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
    // initial MJML-mode request
    expect(sharedRender).toHaveBeenLastCalledWith(
      mjProps.templateJsonData,
      mjmlEntity.mjml_content,
      true
    );

    // simulate in-place navigation to a DIFFERENT (HTML) template on the SAME form instance
    const htmlProps = {
      ...baseProps(htmlEntity),
      renderEmailTemplate: sharedRender
    };
    rerender(<EmailTemplateForm {...htmlProps} />);
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    // FIX: mode must re-init to HTML and send isMjml=false (pre-fix this stays true / sends mjml_content)
    expect(sharedRender).toHaveBeenLastCalledWith(
      htmlProps.templateJsonData,
      expect.any(String),
      false
    );
  });

  it("re-fires the HTML-mode preview when toggled from MJML to HTML", async () => {
    const props = baseProps(mjmlEntity);
    const { getByDisplayValue } = render(<EmailTemplateForm {...props} />);

    // initial mount → one MJML-mode request
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(props.renderEmailTemplate).toHaveBeenCalledTimes(1);
    expect(props.renderEmailTemplate).toHaveBeenLastCalledWith(
      props.templateJsonData,
      mjmlEntity.mjml_content,
      true
    );

    // click the "switch to HTML" button — button-only mode toggle,
    // mutates neither content field directly
    // T.translate returns the key string when no i18n config is loaded
    await act(async () => {
      fireEvent.click(getByDisplayValue("emails.display_html"));
    });
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    // the HTML-mode effect re-fires with isMjml=false
    expect(props.renderEmailTemplate).toHaveBeenCalledTimes(2);
    expect(props.renderEmailTemplate).toHaveBeenLastCalledWith(
      props.templateJsonData,
      expect.any(String),
      false
    );
  });
});
