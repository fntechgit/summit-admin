// @testing-library/react 12 (React 16) does not export renderHook; use a
// lightweight component wrapper instead.
import "@testing-library/jest-dom";
import React, { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import { useFormik } from "formik";
import useScrollToError from "../useScrollToError";

window.HTMLElement.prototype.scrollIntoView = jest.fn();

// jsdom implements no layout, so offsetParent is always null regardless of
// CSS. Reflect the one hiding mechanism this hook cares about (the `hidden`
// attribute) so tests can simulate real display:none semantics.
beforeAll(() => {
  Object.defineProperty(window.HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get() {
      let node = this;
      while (node) {
        if (node.hidden) return null;
        node = node.parentElement;
      }
      return document.body;
    }
  });
});

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView.mockClear();
});

const flushDoubleRaf = () =>
  act(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      })
  );

const TabbedHarness = ({ onActiveTabChange }) => {
  const [activeTab, setActiveTab] = useState("b");
  const formik = useFormik({
    initialValues: { name: "" },
    validate: (values) => (values.name ? {} : { name: "required" }),
    onSubmit: () => {}
  });

  useScrollToError(formik, true, (value) => {
    setActiveTab(value);
    onActiveTabChange?.(value);
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div role="tabpanel" id="tabpanel-a" hidden={activeTab !== "a"}>
        <input name="name" onChange={formik.handleChange} />
      </div>
      <div role="tabpanel" id="tabpanel-b" hidden={activeTab !== "b"} />
      <button type="submit">save</button>
    </form>
  );
};

const VisibleHarness = () => {
  const formik = useFormik({
    initialValues: { name: "" },
    validate: (values) => (values.name ? {} : { name: "required" }),
    onSubmit: () => {}
  });

  useScrollToError(formik, true, jest.fn());

  return (
    <form onSubmit={formik.handleSubmit}>
      <input name="name" onChange={formik.handleChange} />
      <button type="submit">save</button>
    </form>
  );
};

const MixedVisibilityHarness = ({ onActiveTabChange }) => {
  const [activeTab, setActiveTab] = useState("b");
  const formik = useFormik({
    initialValues: { hiddenField: "", visibleField: "" },
    validate: (values) => {
      const errors = {};
      if (!values.hiddenField) errors.hiddenField = "required";
      if (!values.visibleField) errors.visibleField = "required";
      return errors;
    },
    onSubmit: () => {}
  });

  useScrollToError(formik, true, (value) => {
    setActiveTab(value);
    onActiveTabChange?.(value);
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div role="tabpanel" id="tabpanel-a" hidden={activeTab !== "a"}>
        <input name="hiddenField" onChange={formik.handleChange} />
      </div>
      <div role="tabpanel" id="tabpanel-b" hidden={activeTab !== "b"}>
        <input name="visibleField" onChange={formik.handleChange} />
      </div>
      <button type="submit">save</button>
    </form>
  );
};

const ExternalErrorHarness = ({ serverErrors, onActiveTabChange }) => {
  const [activeTab, setActiveTab] = useState("b");
  const formik = useFormik({
    initialValues: { name: "ok" },
    validate: () => ({}),
    onSubmit: () => Promise.resolve()
  });

  // Mirrors how consumers sync server-side errors into Formik independently
  // of the submit lifecycle (e.g. event-type-dialog.js syncing Redux errors).
  React.useEffect(() => {
    if (serverErrors) formik.setErrors(serverErrors);
  }, [serverErrors]);

  useScrollToError(formik, true, (value) => {
    setActiveTab(value);
    onActiveTabChange?.(value);
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div role="tabpanel" id="tabpanel-a" hidden={activeTab !== "a"}>
        <input
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
        />
      </div>
      <div role="tabpanel" id="tabpanel-b" hidden={activeTab !== "b"} />
      <button type="submit">save</button>
    </form>
  );
};

const UntaggedHarness = () => {
  const formik = useFormik({
    initialValues: { name: "" },
    validate: (values) => (values.name ? {} : { name: "required" }),
    onSubmit: () => {}
  });

  useScrollToError(formik, true);

  return (
    <form onSubmit={formik.handleSubmit}>
      <input name="name" onChange={formik.handleChange} />
      <button type="submit">save</button>
    </form>
  );
};

describe("useScrollToError (tab-aware)", () => {
  it("switches to the owning tab and scrolls when the errored field is hidden", async () => {
    const onActiveTabChange = jest.fn();
    render(<TabbedHarness onActiveTabChange={onActiveTabChange} />);

    await act(async () => {
      screen.getByText("save").click();
    });
    await flushDoubleRaf();

    expect(onActiveTabChange).toHaveBeenCalledWith("a");
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("does not switch tabs when the errored field is already visible", async () => {
    render(<VisibleHarness />);

    await act(async () => {
      screen.getByText("save").click();
    });

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("scrolls to the visible field without activating the hidden field's tab when errors span both", async () => {
    const onActiveTabChange = jest.fn();
    render(<MixedVisibilityHarness onActiveTabChange={onActiveTabChange} />);

    await act(async () => {
      screen.getByText("save").click();
    });

    const visibleInput = document.querySelector("[name='visibleField']");

    expect(onActiveTabChange).not.toHaveBeenCalled();
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    expect(window.HTMLElement.prototype.scrollIntoView.mock.instances[0]).toBe(
      visibleInput
    );
  });

  it("scrolls to errors injected after submission settles, even into an inactive panel", async () => {
    const onActiveTabChange = jest.fn();
    const { rerender } = render(
      <ExternalErrorHarness
        serverErrors={null}
        onActiveTabChange={onActiveTabChange}
      />
    );

    await act(async () => {
      screen.getByText("save").click();
    });
    expect(window.HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();

    await act(async () => {
      rerender(
        <ExternalErrorHarness
          serverErrors={{ name: "server says no" }}
          onActiveTabChange={onActiveTabChange}
        />
      );
    });
    await flushDoubleRaf();

    expect(onActiveTabChange).toHaveBeenCalledWith("a");
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("behaves as before when setActiveTab is not passed", async () => {
    render(<UntaggedHarness />);

    await act(async () => {
      screen.getByText("save").click();
    });

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
