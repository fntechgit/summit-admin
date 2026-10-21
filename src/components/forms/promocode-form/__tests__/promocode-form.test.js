import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Formik, Form } from "formik";
import moment from "moment-timezone";
import PromocodeForm, {
  buildPromocodeValues,
  promocodeValidationSchema,
  toPromocodeEntity
} from "../index";
import { DEFAULT_ENTITY } from "../../../../reducers/promocodes/promocode-reducer";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  queryTags: jest.fn(),
  queryMembers: jest.fn(),
  querySpeakers: jest.fn(),
  querySpeakersRaw: jest.fn(),
  querySponsorsV2: jest.fn(),
  queryTicketTypes: jest.fn()
}));

jest.mock("../../../tables/dicount-ticket-table", () => ({
  DiscountTicketTable: () => <div data-testid="discount-ticket-table" />
}));

const SUMMIT = {
  id: 1,
  time_zone_id: "America/Chicago",
  badge_features: [{ id: 5, name: "VIP" }],
  ticket_types: [],
  default_ticket_type_currency_symbol: "$"
};

const ALL_CLASSES = [
  { class_name: "MEMBER_PROMO_CODE", type: ["VIP"] },
  { class_name: "SPONSOR_PROMO_CODE", type: [] },
  { class_name: "SUMMIT_DISCOUNT_CODE", type: [] },
  { class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE", type: [] }
];

const renderForm = (entityOverrides = {}, onSubmit = jest.fn()) => {
  const entity = { ...DEFAULT_ENTITY, ...entityOverrides };
  render(
    <Formik
      initialValues={buildPromocodeValues(entity, SUMMIT)}
      validationSchema={promocodeValidationSchema}
      onSubmit={onSubmit}
    >
      {({ values }) => (
        <Form>
          <PromocodeForm
            entity={entity}
            currentSummit={SUMMIT}
            allClasses={ALL_CLASSES}
            onSendEmail={jest.fn()}
            assignSpeaker={jest.fn()}
            getAssignedSpeakers={jest.fn()}
            unAssignSpeaker={jest.fn()}
          />
          <div data-testid="values">{JSON.stringify(values)}</div>
          <button type="submit">submit</button>
        </Form>
      )}
    </Formik>
  );
  return onSubmit;
};

const formValues = () => JSON.parse(screen.getByTestId("values").textContent);

describe("PromocodeForm", () => {
  test("picking another class starts the form over for that class", async () => {
    renderForm({ class_name: "SUMMIT_DISCOUNT_CODE", code: "OLD" });

    await userEvent.click(
      screen.getAllByRole("combobox").find((el) => el.id === "class_name")
    );
    await userEvent.click(
      within(screen.getByRole("listbox")).getByRole("option", {
        name: "MEMBER_PROMO_CODE"
      })
    );

    expect(formValues()).toMatchObject({
      class_name: "MEMBER_PROMO_CODE",
      code: ""
    });
    // member codes have types and an owner
    expect(screen.getByText("edit_promocode.type *")).toBeInTheDocument();
    expect(
      screen.getByText("edit_purchase_order.owner_email *")
    ).toBeInTheDocument();
  });

  test("a domain-authorized code shows its domains, max per account and auto apply", () => {
    renderForm({ class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE" });

    expect(screen.getByTestId("allowed-email-domains-row")).toBeInTheDocument();
    expect(
      screen.getByText("edit_promocode.quantity_per_account")
    ).toBeInTheDocument();
    expect(screen.getByText("edit_promocode.auto_apply")).toBeInTheDocument();
  });

  test("a sponsor code has no auto apply", () => {
    renderForm({ class_name: "SPONSOR_PROMO_CODE" });

    expect(
      screen.queryByText("edit_promocode.auto_apply")
    ).not.toBeInTheDocument();
  });

  test("a saved malformed domain blocks the save", async () => {
    const onSubmit = renderForm({
      class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE",
      allowed_email_domains: ["@ok.com", "not a domain"]
    });

    await userEvent.click(screen.getByRole("button", { name: "submit" }));

    expect(
      await screen.findByText(
        "edit_promocode.errors.allowed_email_domains_format"
      )
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("domains are not validated for other classes", async () => {
    const onSubmit = renderForm({
      class_name: "SUMMIT_DISCOUNT_CODE",
      allowed_email_domains: ["not a domain"]
    });

    await userEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  test("unchecking apply to all ticket types clears the amount and rate", async () => {
    renderForm({ class_name: "SUMMIT_DISCOUNT_CODE", amount: 10, rate: 0 });

    await userEvent.click(
      screen.getByRole("checkbox", { name: "edit_promocode.apply_to_all_tix" })
    );

    expect(formValues()).toMatchObject({
      apply_to_all_tix: false,
      amount: 0,
      rate: 0
    });
    // a new code has no id to attach ticket type rates to yet
    expect(
      screen.getByText("edit_promocode.save_before_ticket_rates")
    ).toBeInTheDocument();
  });

  test("a saved discount code edits its ticket type rates in the table", () => {
    renderForm({
      id: 7,
      class_name: "SUMMIT_DISCOUNT_CODE",
      apply_to_all_tix: false
    });

    expect(screen.getByTestId("discount-ticket-table")).toBeInTheDocument();
  });
});

describe("promo code form values", () => {
  const entity = {
    ...DEFAULT_ENTITY,
    id: 3,
    class_name: "SPONSOR_PROMO_CODE",
    email: "owner@x.com",
    first_name: "Ann",
    last_name: "Lee",
    owner: { email: "owner@x.com", first_name: "Ann", last_name: "Lee" },
    sponsor: { id: 9, company: { name: "Acme" } },
    allowed_ticket_types: [{ id: 11, name: "General" }],
    badge_features: [5],
    valid_since_date: 1767225600, // 2026-01-01 00:00 UTC
    speakers: { ...DEFAULT_ENTITY.speakers, speakers_list: [{ id: 1 }] }
  };

  test("load the sponsor by company name and ticket types as options", () => {
    const values = buildPromocodeValues(entity, SUMMIT);

    expect(values.sponsor).toEqual({ id: 9, name: "Acme" });
    expect(values.allowed_ticket_types).toEqual([
      { value: 11, label: "General" }
    ]);
    expect(values.valid_until_date).toBeNull();
    expect(values.valid_since_date.tz()).toBe("America/Chicago");
  });

  test("save dates at 00:00 summit time, ticket types as ids, and keep the assignments kept in redux", () => {
    const values = {
      ...buildPromocodeValues(entity, SUMMIT),
      first_name: "Bea",
      valid_since_date: moment.tz("2026-03-10 15:30", "America/Chicago")
    };

    const saved = toPromocodeEntity(values, entity, SUMMIT);

    expect(saved.valid_since_date).toBe(
      moment.tz("2026-03-10", "America/Chicago").unix()
    );
    expect(saved.valid_until_date).toBe("");
    expect(saved.allowed_ticket_types).toEqual([11]);
    expect(saved.owner).toEqual({
      email: "owner@x.com",
      first_name: "Bea",
      last_name: "Lee"
    });
    expect(saved.speakers).toBe(entity.speakers);
  });
});
