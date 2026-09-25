import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import {
  getCriterias,
  buildTicketTypeFilters
} from "../ticket-type-list-page.helpers";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("getCriterias", () => {
  test("forwards the summit timezone to the sale_period_filter datetime criterion", () => {
    const criterias = getCriterias([], [], "America/Los_Angeles");
    const salePeriod = criterias.find((c) => c.key === "sale_period_filter");

    expect(salePeriod.values.props.timezone).toBe("America/Los_Angeles");
  });
});

describe("buildTicketTypeFilters", () => {
  test("returns empty/null defaults when no filter is set", () => {
    const result = buildTicketTypeFilters([]);

    expect(result).toEqual({
      audience_filter: [],
      badge_type_filter: [],
      sale_period_filter: [null, null]
    });
  });

  test("maps AFTER to sale_period_filter[0] and BEFORE to sale_period_filter[1]", () => {
    const result = buildTicketTypeFilters([
      {
        criteria: "sale_period_filter",
        operator: OPERATORS.BEFORE.value,
        value: 200
      },
      {
        criteria: "sale_period_filter",
        operator: OPERATORS.AFTER.value,
        value: 100
      }
    ]);

    expect(result.sale_period_filter).toEqual([100, 200]);
  });

  test("leaves the missing bound as null when only one date is set", () => {
    const result = buildTicketTypeFilters([
      {
        criteria: "sale_period_filter",
        operator: OPERATORS.AFTER.value,
        value: 100
      }
    ]);

    expect(result.sale_period_filter).toEqual([100, null]);
  });

  test("passes through the multi-select audience_filter value", () => {
    const result = buildTicketTypeFilters([
      {
        criteria: "audience_filter",
        operator: OPERATORS.IS.value,
        value: ["All", "WithPromoCode"]
      }
    ]);

    expect(result.audience_filter).toEqual(["All", "WithPromoCode"]);
  });

  test("passes through the multi-select badge_type_filter value", () => {
    const result = buildTicketTypeFilters([
      {
        criteria: "badge_type_filter",
        operator: OPERATORS.IS.value,
        value: [1, 2]
      }
    ]);

    expect(result.badge_type_filter).toEqual([1, 2]);
  });
});
