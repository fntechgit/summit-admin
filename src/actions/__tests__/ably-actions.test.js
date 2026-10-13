import Swal from "sweetalert2";

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() }
}));

const mockPublish = jest.fn();
// api key of the client each publish went through
const mockPublishedWithKey = [];

jest.mock("ably", () => ({
  __esModule: true,
  default: {
    // callback API, as ably 1.2's Ably.Realtime: publish(name, data, callback) returns undefined
    Realtime: jest.fn((apiKey) => ({
      channels: {
        get: jest.fn(() => ({
          publish: (...args) => {
            mockPublishedWithKey.push(apiKey);
            return mockPublish(...args);
          }
        }))
      }
    }))
  }
}));

const signageKey = "signage.key:secret";
const scheduleUpdatesKey = "schedule.key:secret";

const loadAblyActions = () => {
  let actions;
  jest.isolateModules(() => {
    // the clients are created at module load, from these env vars
    process.env.SIGNAGE_ABLY_API_KEY = signageKey;
    process.env.ABLY_SCHEDULE_UPDATES_SUBSCRIBER_API_KEY = scheduleUpdatesKey;
    // eslint-disable-next-line global-require
    actions = require("../ably-actions");
  });
  return actions;
};

describe("publishToAblyChannel", () => {
  const originalKey = process.env.SIGNAGE_ABLY_API_KEY;
  const originalScheduleUpdatesKey =
    process.env.ABLY_SCHEDULE_UPDATES_SUBSCRIBER_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPublishedWithKey.length = 0;
  });

  afterAll(() => {
    process.env.SIGNAGE_ABLY_API_KEY = originalKey;
    process.env.ABLY_SCHEDULE_UPDATES_SUBSCRIBER_API_KEY =
      originalScheduleUpdatesKey;
  });

  it("resolves true only once Ably acknowledges the publish", async () => {
    let ack;
    mockPublish.mockImplementation((name, data, callback) => {
      ack = callback;
    });
    const { publishToAblyChannel } = loadAblyActions();

    let settled = false;
    const result = publishToAblyChannel("SIGNAGE:73:844", "RELOAD", {}).then(
      (value) => {
        settled = true;
        return value;
      }
    );

    await Promise.resolve();
    expect(settled).toBe(false);

    ack(null);
    await expect(result).resolves.toBe(true);
    expect(mockPublish).toHaveBeenCalledWith(
      "RELOAD",
      {},
      expect.any(Function)
    );
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(mockPublishedWithKey).toEqual([signageKey]);
  });

  it("publishes schedule updates channels with the schedule updates app key, where the signs listen to OVERFLOW", async () => {
    mockPublish.mockImplementation((name, data, callback) => callback(null));
    const { publishToScheduleUpdatesChannel } = loadAblyActions();

    await expect(
      publishToScheduleUpdatesChannel("73:OVERFLOW:*", "EVENT", {})
    ).resolves.toBe(true);

    expect(mockPublishedWithKey).toEqual([scheduleUpdatesKey]);
  });

  it("reports the Ably error naming the channel and resolves false", async () => {
    mockPublish.mockImplementation((name, data, callback) => {
      callback({ message: "Channel denied access based on given capability" });
    });
    const { publishToAblyChannel } = loadAblyActions();

    await expect(
      publishToAblyChannel("73:OVERFLOW:*", "EVENT", {})
    ).resolves.toBe(false);

    expect(Swal.fire).toHaveBeenCalledWith(
      "Publish failed",
      "73:OVERFLOW:*: Channel denied access based on given capability",
      "warning"
    );
  });
});
