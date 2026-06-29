// src/components/sponsors/reports/__tests__/ContentTypeToggle.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import ContentTypeToggle from "../ContentTypeToggle";

jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

describe("ContentTypeToggle", () => {
  it("shows the active value and calls onChange with the other value", () => {
    const onChange = jest.fn();
    renderWithRedux(
      <ContentTypeToggle value="collected" onChange={onChange} />
    );
    fireEvent.click(screen.getByText("sponsor_reports_page.content_all"));
    expect(onChange).toHaveBeenCalledWith("all");
  });

  it("ignores a null toggle (clicking the already-active button) — never clears", () => {
    const onChange = jest.fn();
    renderWithRedux(
      <ContentTypeToggle value="collected" onChange={onChange} />
    );
    fireEvent.click(screen.getByText("sponsor_reports_page.content_collected"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
