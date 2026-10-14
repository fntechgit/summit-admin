import Swal from "sweetalert2";

// a factory mock, so the fresh module registry of isolateModules gets it too
jest.mock("../../utils/methods", () => ({
  getAccessTokenSafely: jest.fn(() => Promise.resolve("TOKEN"))
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() }
}));

const mockPublish = jest.fn();
// options of the client each publish went through
const mockPublishedWithOptions = [];

jest.mock("ably", () => ({
  __esModule: true,
  default: {
    // callback API, as ably 1.2's Ably.Realtime: publish(name, data, callback) returns undefined
    Realtime: jest.fn((options) => ({
      channels: {
        get: jest.fn(() => ({
          publish: (...args) => {
            mockPublishedWithOptions.push(options);
            return mockPublish(...args);
          }
        }))
      }
    }))
  }
}));

const PUB_API_BASE_URL = "https://pub-api.test";

const loadAblyActions = () => {
  let actions;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    actions = require("../ably-actions");
  });
  return actions;
};

// runs the authCallback Ably got, as Ably does on connect
const mintWith = (options) =>
  new Promise((resolve) => {
    options.authCallback({}, (err, tokenRequest) =>
      resolve({ err, tokenRequest })
    );
  });

describe("ably-actions", () => {
  const originalFetch = global.fetch;
  const originalPubApiBaseUrl = window.PUB_API_BASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPublishedWithOptions.length = 0;
    window.PUB_API_BASE_URL = PUB_API_BASE_URL;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.PUB_API_BASE_URL = originalPubApiBaseUrl;
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
  });

  it("mints signage tokens from pub-api with the user's access token", async () => {
    const tokenRequest = { keyName: "signage.key", mac: "mac" };
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(tokenRequest)
    });
    mockPublish.mockImplementation((name, data, callback) => callback(null));
    const { publishToAblyChannel } = loadAblyActions();

    await publishToAblyChannel("SIGNAGE:73:844", "RELOAD", {});

    await expect(mintWith(mockPublishedWithOptions[0])).resolves.toEqual({
      err: null,
      tokenRequest
    });
    expect(global.fetch).toHaveBeenCalledWith(
      `${PUB_API_BASE_URL}/api/v1/ably/token/signage`,
      { method: "POST", headers: { Authorization: "Bearer TOKEN" } }
    );
  });

  it("publishes schedule updates channels through the overflow app, where the signs listen to OVERFLOW", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
    mockPublish.mockImplementation((name, data, callback) => callback(null));
    const { publishToScheduleUpdatesChannel } = loadAblyActions();

    await expect(
      publishToScheduleUpdatesChannel("73:OVERFLOW:*", "EVENT", {})
    ).resolves.toBe(true);

    await mintWith(mockPublishedWithOptions[0]);
    expect(global.fetch).toHaveBeenCalledWith(
      `${PUB_API_BASE_URL}/api/v1/ably/token/overflow`,
      expect.any(Object)
    );
  });

  it("reuses one client per app", async () => {
    mockPublish.mockImplementation((name, data, callback) => callback(null));
    const { publishToAblyChannel, publishToScheduleUpdatesChannel } =
      loadAblyActions();

    await publishToAblyChannel("SIGNAGE:73:844", "RELOAD", {});
    await publishToAblyChannel("SIGNAGE:73:845", "RELOAD", {});
    await publishToScheduleUpdatesChannel("73:OVERFLOW:*", "EVENT", {});

    const [first, second, third] = mockPublishedWithOptions;
    expect(first).toBe(second);
    expect(third).not.toBe(first);
  });

  it("passes the pub-api status to Ably when the token cannot be minted", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 403 });
    mockPublish.mockImplementation((name, data, callback) => callback(null));
    const { publishToAblyChannel } = loadAblyActions();

    await publishToAblyChannel("SIGNAGE:73:844", "RELOAD", {});

    const { err, tokenRequest } = await mintWith(mockPublishedWithOptions[0]);
    expect(err.statusCode).toBe(403);
    expect(tokenRequest).toBeNull();
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
