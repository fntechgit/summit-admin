import React from "react";
import { act, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import EditEmailTemplatePage from "../edit-email-template-page";
import {
  getEmailTemplate,
  resetTemplateForm,
  saveEmailTemplate,
  getAllClients
} from "../../../actions/email-actions";

jest.mock("../../../actions/email-actions", () => ({
  getEmailTemplate: jest.fn(),
  resetTemplateForm: jest.fn(),
  saveEmailTemplate: jest.fn(),
  getAllClients: jest.fn(),
  renderEmailTemplate: jest.fn(),
  updateTemplateJsonData: jest.fn()
}));

jest.mock("../../../components/forms/email-template-form", () => ({
  __esModule: true,
  default: ({ onSubmit }) => (
    <button
      type="button"
      data-testid="email-template-form"
      onClick={() => onSubmit({ id: 42 }).catch(() => {})}
    />
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const initialState = {
  emailTemplateState: {
    entity: { id: 0, identifier: "" },
    templateLoading: false,
    clients: null,
    preview: null,
    json_data: {},
    errors: {},
    render_errors: []
  }
};

describe("EditEmailTemplatePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEmailTemplate.mockReturnValue(() => Promise.resolve());
    resetTemplateForm.mockReturnValue({ type: "RESET_TEMPLATE_FORM" });
    getAllClients.mockReturnValue(() => Promise.resolve());
  });

  it("fetches the template and defers mounting the form until the fetch resolves", async () => {
    let resolveFetch;
    getEmailTemplate.mockReturnValue(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderWithRedux(
      <EditEmailTemplatePage
        match={{
          url: "/app/emails/templates/42",
          params: { template_id: "42" }
        }}
      />,
      { initialState }
    );

    expect(getEmailTemplate).toHaveBeenCalledWith("42");
    expect(resetTemplateForm).not.toHaveBeenCalled();
    expect(screen.getByText("emails.loading_template")).toBeInTheDocument();
    expect(screen.queryByTestId("email-template-form")).not.toBeInTheDocument();

    await act(async () => {
      resolveFetch();
      await flushPromises();
    });

    expect(
      screen.queryByText("emails.loading_template")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("email-template-form")).toBeInTheDocument();
  });

  it("ignores a stale fetch when template_id changes before it resolves", async () => {
    let resolveFirst;
    let resolveSecond;
    getEmailTemplate.mockImplementation((templateId) => () => {
      if (templateId === "1") {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return new Promise((resolve) => {
        resolveSecond = resolve;
      });
    });

    const { rerender } = renderWithRedux(
      <EditEmailTemplatePage
        match={{ url: "/app/emails/templates/1", params: { template_id: "1" } }}
      />,
      { initialState }
    );

    rerender(
      <EditEmailTemplatePage
        match={{ url: "/app/emails/templates/2", params: { template_id: "2" } }}
      />
    );

    await act(async () => {
      resolveFirst();
      await flushPromises();
    });

    // must stay in the loading state -- the stale response must not flip entityReady
    expect(screen.getByText("emails.loading_template")).toBeInTheDocument();
    expect(screen.queryByTestId("email-template-form")).not.toBeInTheDocument();

    await act(async () => {
      resolveSecond();
      await flushPromises();
    });

    expect(
      screen.queryByText("emails.loading_template")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("email-template-form")).toBeInTheDocument();
  });

  it("resets the form instead of fetching on the new-template route", () => {
    renderWithRedux(
      <EditEmailTemplatePage
        match={{ url: "/app/emails/templates/new", params: {} }}
      />,
      { initialState }
    );

    expect(resetTemplateForm).toHaveBeenCalled();
    expect(getEmailTemplate).not.toHaveBeenCalled();
  });

  it("does not mount the form with a stale entity when the template fetch fails", async () => {
    getEmailTemplate.mockReturnValue(() =>
      Promise.reject(Object.assign(new Error("Not Found"), { status: 404 }))
    );

    renderWithRedux(
      <MemoryRouter>
        <EditEmailTemplatePage
          match={{
            url: "/app/emails/templates/5",
            params: { template_id: "5" }
          }}
        />
      </MemoryRouter>,
      {
        initialState: {
          emailTemplateState: {
            ...initialState.emailTemplateState,
            // persisted from a previously viewed template
            entity: { id: 7, identifier: "other-template" }
          }
        }
      }
    );

    await act(async () => {
      await flushPromises();
    });

    expect(getEmailTemplate).toHaveBeenCalledWith("5");
    expect(screen.queryByTestId("email-template-form")).not.toBeInTheDocument();
  });

  it.each([
    { outcome: "succeeds", result: () => Promise.resolve(), redirects: true },
    {
      outcome: "fails",
      result: () => Promise.reject(new Error("412")),
      redirects: false
    }
  ])(
    "redirects to the list only when the save $outcome",
    async ({ result, redirects }) => {
      saveEmailTemplate.mockReturnValue(result);
      const history = { push: jest.fn() };

      renderWithRedux(
        <EditEmailTemplatePage
          match={{
            url: "/app/emails/templates/42",
            params: { template_id: "42" }
          }}
          history={history}
        />,
        { initialState }
      );

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("email-template-form"));
        await flushPromises();
      });

      expect(saveEmailTemplate).toHaveBeenCalledWith({ id: 42 });
      if (redirects) {
        expect(history.push).toHaveBeenCalledWith("/app/emails/templates");
      } else {
        expect(history.push).not.toHaveBeenCalled();
      }
    }
  );
});
