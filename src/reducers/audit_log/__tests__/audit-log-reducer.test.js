import moment from "moment-timezone";
import { formatAuditLog, parseSpeakerAuditLog } from "../audit-log-reducer";

describe("formatAuditLog", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("converts an embedded UTC datetime to the viewer's local timezone", () => {
    jest.spyOn(moment.tz, "guess").mockReturnValue("America/New_York");

    const result = formatAuditLog(
      "Presentation updated on 2026-06-01 12:00:00 by admin"
    );

    // 2026-06-01 12:00:00 UTC is 08:00:00 in America/New_York (EDT, UTC-4)
    expect(result).toBe("Presentation updated on 2026-06-01 08:00:00 by admin");
  });

  it("returns the string unchanged when it has no embedded datetime", () => {
    expect(formatAuditLog("Presentation updated by admin")).toBe(
      "Presentation updated by admin"
    );
  });
});

describe("parseSpeakerAuditLog", () => {
  it("reports a single addition", () => {
    const result = parseSpeakerAuditLog(
      "Speaker 'Jane Doe' (jane@example.com) added as featured speaker"
    );

    expect(result).toBe("Speaker jane@example.com was added to the collection");
  });

  it("reports a single removal", () => {
    const result = parseSpeakerAuditLog(
      "Speaker 'Jane Doe' (jane@example.com) removed from featured speakers"
    );

    expect(result).toBe(
      "Speaker jane@example.com was removed from the collection"
    );
  });

  it("returns the original string when an add and a remove for the same speaker net out to zero", () => {
    const original =
      "Speaker 'Jane Doe' (jane@example.com) added as featured speaker|Speaker 'Jane Doe' (jane@example.com) removed from featured speakers";

    expect(parseSpeakerAuditLog(original)).toBe(original);
  });

  it("joins net changes for multiple speakers", () => {
    const result = parseSpeakerAuditLog(
      "Speaker 'Jane Doe' (jane@example.com) added as featured speaker|Speaker 'John Roe' (john@example.com) removed from featured speakers"
    );

    expect(result).toBe(
      "Speaker jane@example.com was added to the collection|Speaker john@example.com was removed from the collection"
    );
  });
});
