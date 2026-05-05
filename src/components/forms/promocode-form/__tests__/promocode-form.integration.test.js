import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";

import PromocodeForm from "../index";

// jsdom does not implement scrollIntoView; polyfill so componentDidUpdate
// (which calls scrollToError → firstNode.scrollIntoView) does not throw.
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// openstack-uicore-foundation components used across the PromocodeForm tree.
// Master commit cd8b5b98 ("Reduce bundle size") rewrote barrel imports to
// direct paths to avoid pulling the entire components index. Each component
// the SUT renders is mocked at its direct path below. Each factory inlines the
// passthrough body because babel-plugin-jest-hoist hoists `jest.mock` calls
// above any `const` declarations — references outside the factory ReferenceError.
/* eslint-disable global-require */
jest.mock("openstack-uicore-foundation/lib/components/inputs/dropdown", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props) =>
      React.createElement("input", {
        id: props.id ?? "Dropdown",
        "data-mocked": "Dropdown",
        type: props.type ?? "text",
        value: props.value ?? "",
        onChange: props.onChange ?? (() => {})
      })
  };
});
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/text-input",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props) =>
        React.createElement("input", {
          id: props.id ?? "Input",
          "data-mocked": "Input",
          type: props.type ?? "text",
          value: props.value ?? "",
          onChange: props.onChange ?? (() => {})
        })
    };
  }
);
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/textarea-input",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props) =>
        React.createElement("input", {
          id: props.id ?? "TextArea",
          "data-mocked": "TextArea",
          type: props.type ?? "text",
          value: props.value ?? "",
          onChange: props.onChange ?? (() => {})
        })
    };
  }
);
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/datetimepicker",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props) =>
        React.createElement("input", {
          id: props.id ?? "DateTimePicker",
          "data-mocked": "DateTimePicker",
          type: props.type ?? "text",
          value: props.value ?? "",
          onChange: props.onChange ?? (() => {})
        })
    };
  }
);
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/ticket-types-input",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props) =>
        React.createElement("input", {
          id: props.id ?? "TicketTypesInput",
          "data-mocked": "TicketTypesInput",
          type: props.type ?? "text",
          value: props.value ?? "",
          onChange: props.onChange ?? (() => {})
        })
    };
  }
);
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/speaker-input",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props) =>
        React.createElement("input", {
          id: props.id ?? "SpeakerInput",
          "data-mocked": "SpeakerInput",
          type: props.type ?? "text",
          value: props.value ?? "",
          onChange: props.onChange ?? (() => {})
        })
    };
  }
);
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/sponsor-input",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props) =>
        React.createElement("input", {
          id: props.id ?? "SponsorInput",
          "data-mocked": "SponsorInput",
          type: props.type ?? "text",
          value: props.value ?? "",
          onChange: props.onChange ?? (() => {})
        })
    };
  }
);
jest.mock(
  "openstack-uicore-foundation/lib/components/free-text-search",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props) =>
        React.createElement("input", {
          id: props.id ?? "FreeTextSearch",
          "data-mocked": "FreeTextSearch",
          type: props.type ?? "text",
          value: props.value ?? "",
          onChange: props.onChange ?? (() => {})
        })
    };
  }
);
jest.mock("openstack-uicore-foundation/lib/components/table", () => ({
  __esModule: true,
  default: () => null
}));
/* eslint-enable global-require */

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/tag-input",
  () => {
    // eslint-disable-next-line global-require
    const React = require("react");
    const TagInputMock = (props) => {
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
    return { __esModule: true, default: TagInputMock };
  }
);

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
  // speakers fragment (speakers-base-pc-form.js) destructures entity.speakers;
  // provide an empty structure so SPEAKERS_* class renders without crashing.
  speakers: {
    filtered_speakers_list: [],
    speakers_list: [],
    term: "",
    order: "id",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1
  },
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

describe("validate() — domain-authorized email-domain enforcement", () => {
  it("blocks save on malformed allowed_email_domains for DOMAIN_AUTHORIZED_DISCOUNT_CODE", () => {
    const onSubmit = jest.fn();
    renderForm(
      baseEntity({
        class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE",
        allowed_email_domains: ["malformed-no-at-sign"]
      }),
      { onSubmit }
    );
    // T.translate("general.save") renders the raw key "general.save" in the
    // jest env (no locale loaded; same behavior the existing file documents
    // starting at :227). The regex /save/i matches the substring within the
    // raw key, so the button is found.
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("allows save on valid allowed_email_domains for DOMAIN_AUTHORIZED_DISCOUNT_CODE", () => {
    const onSubmit = jest.fn();
    renderForm(
      baseEntity({
        class_name: "DOMAIN_AUTHORIZED_DISCOUNT_CODE",
        allowed_email_domains: ["@valid.com", ".edu"]
      }),
      { onSubmit }
    );
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does NOT validate allowed_email_domains for non-DomainAuthorized classes (MEMBER_PROMO_CODE)", () => {
    const onSubmit = jest.fn();
    renderForm(
      baseEntity({
        class_name: "MEMBER_PROMO_CODE",
        allowed_email_domains: ["malformed"] // present but should be ignored
      }),
      { onSubmit }
    );
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("regression — non-DomainAuthorized classes are unaffected by the layout reflow", () => {
  // Block 1: classes whose own fragments render #auto_apply
  // (MEMBER, SPEAKER variants). See member-base-pc-form.js:27 and
  // speaker-base-pc-form.js:25 — both render <input id="auto_apply">
  // unconditionally.
  it.each([
    ["MEMBER_PROMO_CODE"],
    ["MEMBER_DISCOUNT_CODE"],
    ["SPEAKER_PROMO_CODE"],
    ["SPEAKER_DISCOUNT_CODE"]
  ])(
    "for %s: does NOT render the new DomainAuthorized layout but DOES render fragment-owned #auto_apply",
    (class_name) => {
      const { container } = renderForm(baseEntity({ class_name }));
      const quantityRow = container
        .querySelector("#quantity_available")
        .closest(".row.form-group");
      const cols = quantityRow.querySelectorAll(".col-md-4");
      expect(cols).toHaveLength(2);
      expect(
        container.querySelector("#quantity_per_account")
      ).not.toBeInTheDocument();
      expect(
        container.querySelector("[data-testid=\"allowed-email-domains-row\"]")
      ).not.toBeInTheDocument();
      // member/speaker fragments still render auto_apply (unchanged)
      expect(container.querySelector("#auto_apply")).toBeInTheDocument();
    }
  );

  // Block 2: classes that should have NO #auto_apply anywhere.
  // SUMMIT_*, PRE_PAID_*, SPEAKERS_*, SPONSOR_* — none of their fragments
  // render auto_apply. PRE_PAID_* routes through SummitPCForm /
  // SummitDiscountPCForm per index.js:494-518.
  it.each([
    ["SPONSOR_PROMO_CODE"],
    ["SPONSOR_DISCOUNT_CODE"],
    ["SUMMIT_PROMO_CODE"],
    ["SUMMIT_DISCOUNT_CODE"],
    ["PRE_PAID_PROMO_CODE"],
    ["PRE_PAID_DISCOUNT_CODE"],
    ["SPEAKERS_PROMO_CODE"],
    ["SPEAKERS_DISCOUNT_CODE"]
  ])(
    "for %s: does NOT render the new DomainAuthorized layout and does NOT render #auto_apply",
    (class_name) => {
      const { container } = renderForm(baseEntity({ class_name }));
      const quantityRow = container
        .querySelector("#quantity_available")
        .closest(".row.form-group");
      const cols = quantityRow.querySelectorAll(".col-md-4");
      expect(cols).toHaveLength(2);
      expect(
        container.querySelector("#quantity_per_account")
      ).not.toBeInTheDocument();
      expect(container.querySelector("#auto_apply")).not.toBeInTheDocument();
      expect(
        container.querySelector("[data-testid=\"allowed-email-domains-row\"]")
      ).not.toBeInTheDocument();
    }
  );
});
