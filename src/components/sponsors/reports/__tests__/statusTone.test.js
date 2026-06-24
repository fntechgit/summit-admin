// src/components/sponsors/reports/__tests__/statusTone.test.js
import { statusTone } from "../statusTone";

describe("statusTone", () => {
  it("maps completed/paid/confirmed to success", () => {
    expect(statusTone("completed")).toBe("success");
    expect(statusTone("paid")).toBe("success");
    expect(statusTone("Confirmed")).toBe("success");
  });
  it("maps pending to warning, in_progress to info", () => {
    expect(statusTone("pending")).toBe("warning");
    expect(statusTone("in_progress")).toBe("info");
  });
  it("maps not_applicable/canceled and unknown to default", () => {
    expect(statusTone("not_applicable")).toBe("default");
    expect(statusTone("Canceled")).toBe("default");
    expect(statusTone("whatever")).toBe("default");
    expect(statusTone(null)).toBe("default");
  });
});
