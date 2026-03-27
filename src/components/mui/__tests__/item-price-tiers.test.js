import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form } from "formik";
import "@testing-library/jest-dom";
import ItemPriceTiers from "../formik-inputs/item-price-tiers";

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const ALL_ENABLED = {
  early_bird_rate: 0,
  standard_rate: 500,
  onsite_rate: 1000
};

const ALL_DISABLED = {
  early_bird_rate: null,
  standard_rate: null,
  onsite_rate: null
};

const MIXED = {
  early_bird_rate: 0,
  standard_rate: null,
  onsite_rate: 1000
};

const renderComponent = (initialValues, props = {}, onSubmit = jest.fn()) =>
  render(
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form>
        <ItemPriceTiers {...props} />
        <button type="submit">submit</button>
      </Form>
    </Formik>
  );

describe("ItemPriceTiers", () => {
  describe("all enabled", () => {
    it("should render all 3 checkboxes as unchecked", () => {
      renderComponent(ALL_ENABLED);
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(3);
      checkboxes.forEach((cb) => expect(cb).not.toBeChecked());
    });
  });

  describe("all disabled", () => {
    it("should render all 3 checkboxes as checked", () => {
      renderComponent(ALL_DISABLED);
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(3);
      checkboxes.forEach((cb) => expect(cb).toBeChecked());
    });
  });

  describe("mixed state", () => {
    it("should render the correct number of checked and unchecked checkboxes", () => {
      renderComponent(MIXED);
      const checkboxes = screen.getAllByRole("checkbox");
      const checked = checkboxes.filter((cb) => cb.checked);
      const unchecked = checkboxes.filter((cb) => !cb.checked);
      expect(checked).toHaveLength(1);
      expect(unchecked).toHaveLength(2);
    });
  });

  describe("marking as N/A", () => {
    it("should check the checkbox when an active tier is clicked", async () => {
      renderComponent(ALL_ENABLED);
      const checkboxes = screen.getAllByRole("checkbox");

      await act(async () => {
        await userEvent.click(checkboxes[0]);
      });

      expect(checkboxes[0]).toBeChecked();
    });

    it("should set the field value to null when marked as N/A", async () => {
      const onSubmit = jest.fn();
      renderComponent(ALL_ENABLED, {}, onSubmit);
      const checkboxes = screen.getAllByRole("checkbox");

      await act(async () => {
        await userEvent.click(checkboxes[0]);
        await userEvent.click(screen.getByText("submit"));
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ early_bird_rate: null }),
        expect.anything()
      );
    });
  });

  describe("enabling", () => {
    it("should uncheck the checkbox when an N/A tier is clicked", async () => {
      renderComponent(ALL_DISABLED);
      const checkboxes = screen.getAllByRole("checkbox");

      await act(async () => {
        await userEvent.click(checkboxes[0]);
      });

      expect(checkboxes[0]).not.toBeChecked();
    });

    it("should set the field value to 0 when enabled", async () => {
      const onSubmit = jest.fn();
      renderComponent(ALL_DISABLED, {}, onSubmit);
      const checkboxes = screen.getAllByRole("checkbox");

      await act(async () => {
        await userEvent.click(checkboxes[0]);
        await userEvent.click(screen.getByText("submit"));
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ early_bird_rate: 0 }),
        expect.anything()
      );
    });
  });

  describe("readOnly prop", () => {
    it("should disable all checkboxes when readOnly is true", () => {
      renderComponent(ALL_ENABLED, { readOnly: true });
      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((cb) => expect(cb).toBeDisabled());
    });

    it("should not disable checkboxes when readOnly is false", () => {
      renderComponent(ALL_ENABLED, { readOnly: false });
      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((cb) => expect(cb).not.toBeDisabled());
    });
  });
});
