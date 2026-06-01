import React from "react";
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach
} from "@jest/globals";
import { render, act } from "@testing-library/react";

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
});
