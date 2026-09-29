import RoomManifestReport from "../room-manifest-report";

// render the bare report class; the wrapper (redux, filters, export) is not under test
jest.mock("../report-wrapper", () => ({
  __esModule: true,
  default: (ReportComponent) => ReportComponent
}));

const currentSummit = { id: 73, time_zone_id: "UTC" };

const buildSpeaker = (n) => ({
  id: n,
  title: `Title ${n}`,
  fullName: `Speaker Name ${n}`,
  emails: `speaker${n}@example.com`,
  phoneNumber: `555-000${n}`,
  currentCompany: `Company ${n}`
});

const buildEvent = (id, speakerTotal, extra = {}) => ({
  id,
  title: `Event ${id}`,
  startDate: "2026-10-13T15:00:00+00:00",
  endDate: "2026-10-13T16:00:00+00:00",
  speakerCount: speakerTotal,
  type: { id: 1, type: "Panel" },
  location: {
    venueroom: { name: "Room A", capacity: 100, venue: { name: "Venue" } }
  },
  speakers: Array.from({ length: speakerTotal }, (_, i) => buildSpeaker(i + 1)),
  moderator: buildSpeaker(99),
  materials: [],
  ...extra
});

const preProcess = (data) => {
  const report = new RoomManifestReport({ currentSummit });
  const { reportData, tableColumns } = report.preProcessData(data, null, true);
  return { rows: Object.values(reportData).flat(), tableColumns };
};

describe("RoomManifestReport preProcessData", () => {
  it("adds one speaker column per speaker of the largest session, after moderator at the end", () => {
    const { tableColumns } = preProcess([buildEvent(1, 5), buildEvent(2, 1)]);

    expect(tableColumns.map((c) => c.columnKey)).toEqual([
      "id",
      "time",
      "event",
      "room",
      "venue",
      "capacity",
      "speakerCount",
      "type",
      "materials",
      "moderator",
      "speaker_1",
      "speaker_2",
      "speaker_3",
      "speaker_4",
      "speaker_5"
    ]);
    expect(tableColumns.slice(-5).map((c) => c.value)).toEqual([
      "Speaker 1",
      "Speaker 2",
      "Speaker 3",
      "Speaker 4",
      "Speaker 5"
    ]);
  });

  it("exports every speaker and leaves unused speaker cells empty", () => {
    const { rows } = preProcess([buildEvent(1, 5), buildEvent(2, 1)]);
    const big = rows.find((r) => r.id === 1);
    const small = rows.find((r) => r.id === 2);

    expect(big.speaker_4).toContain("Speaker Name 4");
    expect(big.speaker_5).toBe(
      "Speaker Name 5 \n Title 5, Company 5 \n speaker5@example.com \n 555-0005"
    );
    expect(small.speaker_1).toContain("Speaker Name 1");
    ["speaker_2", "speaker_3", "speaker_4", "speaker_5"].forEach((key) =>
      expect(small[key]).toBe("")
    );
  });

  it("keeps a single speaker column when no session has speakers", () => {
    const { rows, tableColumns } = preProcess([
      buildEvent(1, 0, { speakers: undefined, moderator: null })
    ]);

    expect(tableColumns.map((c) => c.columnKey).slice(-2)).toEqual([
      "moderator",
      "speaker_1"
    ]);
    expect(rows[0].speaker_1).toBe("");
    expect(rows[0].moderator).toBe("");
  });
});
