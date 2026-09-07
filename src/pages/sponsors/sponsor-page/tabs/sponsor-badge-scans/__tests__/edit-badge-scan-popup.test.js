// edit-badge-scan-popup.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EditBadgeScanPopup from "../edit-badge-scan-popup";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/extra-questions-mui",
  () => {
    const React = require("react");
    const { toSlug } = require("../../../../../../utils/extra-questions");
    return {
      __esModule: true,
      default: ({ extraQuestions, formik }) => (
        <div data-testid="extra-questions">
          {extraQuestions
            .filter((q) => q.type === "CheckBox")
            .map((q) => {
              const slug = toSlug(q.name, q.id);
              return (
                <label key={slug} htmlFor={slug}>
                  {q.name}
                  <input
                    id={slug}
                    type="checkbox"
                    checked={!!formik.values[slug]}
                    onChange={(e) =>
                      formik.setFieldValue(slug, e.target.checked)
                    }
                  />
                </label>
              );
            })}
        </div>
      )
    };
  }
);

const buildBadgeScan = (overrides = {}) => ({
  id: 1,
  attendee_full_name: "John Doe",
  attendee_company: "Acme",
  notes: "",
  extra_questions: [],
  sponsor_extra_questions: [
    { id: 5, name: "Opted In", type: "CheckBox", order: 1 }
  ],
  ...overrides
});

const renderComponent = (props = {}) =>
  render(
    <EditBadgeScanPopup
      badgeScan={buildBadgeScan()}
      onClose={jest.fn()}
      onSubmit={jest.fn()}
      {...props}
    />
  );

describe("EditBadgeScanPopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Extra questions submission", () => {
    it("should submit an unchecked CheckBox answer as the string 'false' instead of dropping it", async () => {
      const onSubmit = jest.fn();
      renderComponent({ onSubmit });

      await userEvent.click(
        screen.getByRole("button", { name: "general.save" })
      );

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            extra_questions: [{ question_id: 5, answer: "false" }]
          })
        );
      });
    });
  });
});
