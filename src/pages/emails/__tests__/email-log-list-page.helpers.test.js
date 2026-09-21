import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import { buildEmailFilters } from "../email-log-list-page.helpers";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../actions/email-actions", () => ({
  queryTemplates: jest.fn()
}));

describe("buildEmailFilters", () => {
  test("maps AFTER to sent_date_filter[0] and BEFORE to sent_date_filter[1]", () => {
    const result = buildEmailFilters([
      {
        criteria: "sent_date_filter",
        operator: OPERATORS.BEFORE.value,
        value: 200
      },
      {
        criteria: "sent_date_filter",
        operator: OPERATORS.AFTER.value,
        value: 100
      }
    ]);

    expect(result.sent_date_filter).toEqual([100, 200]);
  });

  test("returns [null, null] when no date criteria is present", () => {
    const result = buildEmailFilters([]);

    expect(result.sent_date_filter).toEqual([null, null]);
  });

  test("unwraps template_filter from the async option object", () => {
    const result = buildEmailFilters([
      {
        criteria: "template_filter",
        operator: OPERATORS.IS.value,
        value: { value: "welcome-email", label: "welcome-email" }
      }
    ]);

    expect(result.template_filter).toBe("welcome-email");
  });

  test("defaults template_filter to an empty string when absent", () => {
    const result = buildEmailFilters([]);

    expect(result.template_filter).toBe("");
  });

  test("defaults is_sent_filter to null when absent", () => {
    const result = buildEmailFilters([]);

    expect(result.is_sent_filter).toBeNull();
  });
});
