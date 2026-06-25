import { buildReportQuery } from "../report-query";

describe("buildReportQuery", () => {
  it("returns an empty object for no filters", () => {
    expect(buildReportQuery()).toStrictEqual({});
  });

  it("emits a single comma-OR bracket for multi-select sponsorIds", () => {
    expect(buildReportQuery({ sponsorIds: [1, 2, 3] })).toStrictEqual({
      "filter[]": ["sponsor_id==1,sponsor_id==2,sponsor_id==3"]
    });
  });

  it("coerces numeric-string sponsorIds to integers", () => {
    expect(buildReportQuery({ sponsorIds: ["10", "20"] })).toStrictEqual({
      "filter[]": ["sponsor_id==10,sponsor_id==20"]
    });
  });

  it("drops non-numeric sponsorIds so it never emits sponsor_id==NaN", () => {
    expect(
      buildReportQuery({ sponsorIds: [1, "abc", undefined, null, 2] })
    ).toStrictEqual({
      "filter[]": ["sponsor_id==1,sponsor_id==2"]
    });
  });

  it("omits the sponsor filter entirely when all ids are non-numeric", () => {
    expect(buildReportQuery({ sponsorIds: ["abc", null] })).toStrictEqual({});
  });

  it("adds single-value dimensions as separate AND brackets", () => {
    expect(
      buildReportQuery({ sponsorIds: [1], status: "Paid", formCode: "AS" })
    ).toStrictEqual({
      "filter[]": ["sponsor_id==1", "status==Paid", "form_code==AS"]
    });
  });

  it("sets include_cancelled when status is Canceled", () => {
    expect(buildReportQuery({ status: "Canceled" })).toStrictEqual({
      "filter[]": ["status==Canceled"],
      include_cancelled: "true"
    });
  });

  it("passes through search/order/pagination/group_by", () => {
    expect(
      buildReportQuery({
        search: "acme",
        order: "-number",
        page: 2,
        perPage: 25,
        groupBy: "sponsor"
      })
    ).toStrictEqual({
      search: "acme",
      order: "-number",
      page: 2,
      per_page: 25,
      group_by: "sponsor"
    });
  });
});
