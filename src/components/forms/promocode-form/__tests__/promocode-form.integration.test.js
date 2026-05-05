import React from "react";
import { render, fireEvent } from "@testing-library/react";

import PromocodeForm from "../index";

// openstack-uicore-foundation components used across the PromocodeForm tree.
// Exhaustive list — verified by grep against src/components/forms/promocode-form/**:
//   Dropdown, Input, TagInput, TextArea, DateTimePicker, TicketTypesInput,
//   SpeakerInput, SponsorInput, FreeTextSearch, Table.
// TagInput mock exposes a `data-testid="taginput-onCreate-${id}"` button whose click
// invokes the component's onCreate with a value read from a sibling draft input.
jest.mock("openstack-uicore-foundation/lib/components", () => {
  const React = require("react");
  const passThrough = (id) => (props) =>
    React.createElement("input", {
      id: props.id ?? id,
      "data-mocked": id,
      type: props.type ?? "text",
      value: props.value ?? "",
      onChange: props.onChange ?? (() => {})
    });
  const TagInput = (props) => {
    const draftRef = React.useRef("");
    return React.createElement(
      "div",
      {
        id: props.id,
        "data-mocked": "TagInput",
        "data-field": props.id
      },
      React.createElement("input", {
        "data-testid": `taginput-draft-${props.id}`,
        onChange: (e) => {
          draftRef.current = e.target.value;
        }
      }),
      React.createElement(
        "button",
        {
          type: "button",
          "data-testid": `taginput-onCreate-${props.id}`,
          onClick: () => props.onCreate && props.onCreate(draftRef.current)
        },
        "add"
      )
    );
  };
  return {
    Dropdown: passThrough("Dropdown"),
    Input: passThrough("Input"),
    TagInput,
    TextArea: passThrough("TextArea"),
    DateTimePicker: passThrough("DateTimePicker"),
    TicketTypesInput: passThrough("TicketTypesInput"),
    SpeakerInput: passThrough("SpeakerInput"),
    SponsorInput: passThrough("SponsorInput"),
    FreeTextSearch: passThrough("FreeTextSearch"),
    Table: () => null
  };
});

jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  epochToMomentTimeZone: () => null
}));

// Other deep imports inside the PromocodeForm tree — stubbed so the component
// tree mounts in jsdom without pulling in chart libs, rich text editors, etc.
// Paths below are relative to THIS test file at
// src/components/forms/promocode-form/__tests__/promocode-form.integration.test.js
// and must resolve to the same files the SUT imports. Verify with:
//   node -e "require.resolve('<path>')" from the test file's directory if in doubt.
jest.mock("../../../inputs/owner-input", () => () => null);
jest.mock("../../../inputs/text-area-input-with-counter", () => (props) => {
  const React = require("react");
  return React.createElement("textarea", {
    id: props.id,
    value: props.value ?? "",
    onChange: props.onChange ?? (() => {})
  });
});
jest.mock("../../../tables/dicount-ticket-table", () => ({
  DiscountTicketTable: () => null
}));
jest.mock(
  "../../../../utils/fragmen-parser",
  () =>
    class FragmentParser {
      getParam() {
        return null;
      }
    }
);

const baseEntity = (overrides = {}) => ({
  id: 0,
  class_name: null,
  type: "",
  code: "",
  tags: [],
  description: "",
  allows_to_delegate: false,
  allows_to_reassign: true,
  allowed_ticket_types: [],
  allowed_email_domains: [],
  quantity_per_account: 0,
  auto_apply: false,
  quantity_available: 0,
  quantity_used: 0,
  valid_since_date: "",
  valid_until_date: "",
  badge_features: [],
  ticket_types_rules: [],
  apply_to_all_tix: true,
  badge_features_apply_to_all_tix_retroactively: false,
  amount: "",
  rate: "",
  owner: null,
  speaker: null,
  sponsor: null,
  ...overrides
});

const baseSummit = {
  id: 1,
  badge_features: [],
  ticket_types: [],
  time_zone_id: "UTC",
  default_ticket_type_currency_symbol: "$"
};

const renderForm = (entity, extraProps = {}) =>
  render(
    <PromocodeForm
      entity={entity}
      errors={{}}
      currentSummit={baseSummit}
      allClasses={[
        { class_name: "MEMBER_PROMO_CODE", type: [] },
        { class_name: "MEMBER_DISCOUNT_CODE", type: [] },
        { class_name: "SPEAKER_PROMO_CODE", type: [] },
        { class_name: "SPEAKER_DISCOUNT_CODE", type: [] },
        { class_name: "SPONSOR_PROMO_CODE", type: [] },
        { class_name: "SPONSOR_DISCOUNT_CODE", type: [] },
        { class_name: "SUMMIT_PROMO_CODE", type: [] },
        { class_name: "SUMMIT_DISCOUNT_CODE", type: [] },
        { class_name: "PRE_PAID_PROMO_CODE", type: [] },
        { class_name: "PRE_PAID_DISCOUNT_CODE", type: [] },
        { class_name: "SPEAKERS_PROMO_CODE", type: [] },
        { class_name: "SPEAKERS_DISCOUNT_CODE", type: [] },
        { class_name: "DOMAIN_AUTHORIZED_PROMO_CODE", type: [] },
        { class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE", type: [] }
      ]}
      onSubmit={() => {}}
      onSendEmail={() => {}}
      onBadgeFeatureLink={() => {}}
      onBadgeFeatureUnLink={() => {}}
      onCreateCompany={() => {}}
      assignSpeaker={() => {}}
      getAssignedSpeakers={() => {}}
      unAssignSpeaker={() => {}}
      resetPromocodeForm={() => {}}
      {...extraProps}
    />
  );

describe("PromocodeForm class switching", () => {
  it("renders domain-authorized access-only fields when class is DOMAIN_AUTHORIZED_PROMO_CODE", () => {
    const { container } = renderForm(
      baseEntity({ class_name: "DOMAIN_AUTHORIZED_PROMO_CODE" })
    );
    expect(
      container.querySelector("#allowed_email_domains")
    ).toBeInTheDocument();
    expect(
      container.querySelector("#quantity_per_account")
    ).toBeInTheDocument();
    expect(container.querySelector("#auto_apply")).toBeInTheDocument();
    expect(
      container.querySelector("#allowed_ticket_types")
    ).toBeInTheDocument();
    // Discount-only fields must NOT render on the access-only variant.
    expect(container.querySelector("#amount")).not.toBeInTheDocument();
    expect(container.querySelector("#rate")).not.toBeInTheDocument();
  });

  it("renders domain-authorized discount fields when class is DOMAIN_AUTHORIZED_DISCOUNT_CODE", () => {
    const { container } = renderForm(
      baseEntity({ class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE" })
    );
    expect(
      container.querySelector("#allowed_email_domains")
    ).toBeInTheDocument();
    expect(
      container.querySelector("#quantity_per_account")
    ).toBeInTheDocument();
    expect(container.querySelector("#auto_apply")).toBeInTheDocument();
    expect(container.querySelector("#amount")).toBeInTheDocument();
    expect(container.querySelector("#rate")).toBeInTheDocument();
  });

  it.each([
    "MEMBER_PROMO_CODE",
    "MEMBER_DISCOUNT_CODE",
    "SPEAKER_PROMO_CODE",
    "SPEAKER_DISCOUNT_CODE"
  ])("shows auto_apply checkbox when class is %s", (class_name) => {
    const { container } = renderForm(baseEntity({ class_name }));
    expect(container.querySelector("#auto_apply")).toBeInTheDocument();
  });

  it("does NOT show auto_apply checkbox when class is SPONSOR_PROMO_CODE", () => {
    const { container } = renderForm(
      baseEntity({ class_name: "SPONSOR_PROMO_CODE" })
    );
    expect(container.querySelector("#auto_apply")).not.toBeInTheDocument();
  });

  describe("allowed_email_domains onCreate path", () => {
    const addDomain = (container, value) => {
      const draft = container.querySelector(
        "[data-testid=\"taginput-draft-allowed_email_domains\"]"
      );
      const addBtn = container.querySelector(
        "[data-testid=\"taginput-onCreate-allowed_email_domains\"]"
      );
      fireEvent.change(draft, { target: { value } });
      fireEvent.click(addBtn);
    };

    it("rejects malformed entries inline and leaves handleChange (for domains) uncalled", () => {
      const { container } = renderForm(
        baseEntity({ class_name: "DOMAIN_AUTHORIZED_PROMO_CODE" })
      );
      addDomain(container, "acme.com"); // no leading @ — invalid
      // i18n-react renders the raw key in the jest env (no translator is
      // configured here), so we match the key itself rather than the
      // translated copy. The rendered string is:
      //   "edit_promocode.errors.allowed_email_domains_format"
      expect(
        container.querySelector(".text-danger")?.textContent ?? ""
      ).toMatch(/allowed_email_domains_format/i);
    });

    it("accepts a valid @domain entry", () => {
      const { container } = renderForm(
        baseEntity({ class_name: "DOMAIN_AUTHORIZED_PROMO_CODE" })
      );
      addDomain(container, "@acme.com");
      // No inline error after a valid add.
      expect(container.querySelector(".text-danger")).toBeNull();
    });

    it("accepts a valid .tld entry (case-insensitive)", () => {
      const { container } = renderForm(
        baseEntity({ class_name: "DOMAIN_AUTHORIZED_PROMO_CODE" })
      );
      addDomain(container, ".EDU");
      expect(container.querySelector(".text-danger")).toBeNull();
    });
  });
});

describe("DOMAIN_AUTHORIZED layout positions", () => {
  it("renders auto_apply as the third checkbox in the description-row column", () => {
    const { container } = renderForm(
      baseEntity({ class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE" })
    );
    const checkboxesDiv = container.querySelector(".checkboxes-div");
    const checkboxes = checkboxesDiv.querySelectorAll("input[type=\"checkbox\"]");
    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0].id).toBe("allows_to_delegate");
    expect(checkboxes[1].id).toBe("allows_to_reassign");
    expect(checkboxes[2].id).toBe("auto_apply");
  });

  it("renders quantity_per_account as the third col-md-4 in the quantity row", () => {
    const { container } = renderForm(
      baseEntity({ class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE" })
    );
    const quantityRow = container
      .querySelector("#quantity_available")
      .closest(".row.form-group");
    const cols = quantityRow.querySelectorAll(".col-md-4");
    expect(cols).toHaveLength(3);
    expect(cols[0].querySelector("#quantity_available")).toBeTruthy();
    expect(cols[1].querySelector("#quantity_used")).toBeTruthy();
    expect(cols[2].querySelector("#quantity_per_account")).toBeTruthy();
  });

  it("renders allowed-email-domains-row before the description row", () => {
    const { container } = renderForm(
      baseEntity({ class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE" })
    );
    const emailDomainsRow = container.querySelector(
      "[data-testid=\"allowed-email-domains-row\"]"
    );
    const descriptionRow = container
      .querySelector("#description")
      .closest(".row.form-group");
    expect(emailDomainsRow).toBeTruthy();
    expect(descriptionRow).toBeTruthy();
    /* eslint-disable no-bitwise */
    // bitmask 4 = DOCUMENT_POSITION_FOLLOWING
    const followsBit =
      emailDomainsRow.compareDocumentPosition(descriptionRow) & 4;
    /* eslint-enable no-bitwise */
    expect(followsBit).toBeTruthy();
  });
});
