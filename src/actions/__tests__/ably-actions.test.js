import Swal from "sweetalert2";
import flushPromises from "flush-promises";

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() }
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// factory mocks, so the fresh module registry of isolateModules gets them too
jest.mock("../../utils/methods", () => ({
  getAccessTokenSafely: jest.fn(() => Promise.resolve("TOKEN"))
}));

const mockPostRequest = jest.fn();

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: (...args) => mockPostRequest(...args)
}));

const mockPublish = jest.fn();
const mockSubscribe = jest.fn();
// options of the client each publish went through
const mockPublishedWithOptions = [];

jest.mock("ably", () => ({
  __esModule: true,
  default: {
    // promise API, as ably 2's Ably.Realtime: publish and subscribe return promises
    Realtime: jest.fn((options) => ({
      channels: {
        get: jest.fn(() => ({
          publish: (...args) => {
            mockPublishedWithOptions.push(options);
            return mockPublish(...args);
          },
          subscribe: (...args) => {
            mockPublishedWithOptions.push(options);
            return mockSubscribe(...args);
          }
        }))
      }
    }))
  }
}));

const PUB_API_BASE_URL = "https://pub-api.test";
const dispatch = jest.fn();

const loadAblyActions = () => {
  let actions;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    actions = require("../ably-actions");
  });
  return actions;
};

// postRequest(...)(params)(dispatch), as uicore's
const arrangeTokenResponse = (result) => {
  let params;
  mockPostRequest.mockReturnValue((p) => {
    params = p;
    return () => result;
  });
  return () => params;
};

// runs the authCallback Ably got, as Ably does on connect
const mintWith = (options) =>
  new Promise((resolve) => {
    options.authCallback({}, (err, tokenRequest) =>
      resolve({ err, tokenRequest })
    );
  });

describe("ably-actions", () => {
  const originalPubApiBaseUrl = window.PUB_API_BASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPublishedWithOptions.length = 0;
    window.PUB_API_BASE_URL = PUB_API_BASE_URL;
    mockPublish.mockResolvedValue(undefined);
    mockSubscribe.mockResolvedValue(null);
  });

  afterEach(() => {
    window.PUB_API_BASE_URL = originalPubApiBaseUrl;
  });

  it("resolves true only once Ably acknowledges the publish", async () => {
    let ack;
    mockPublish.mockImplementation(
      () =>
        new Promise((resolve) => {
          ack = resolve;
        })
    );
    const { publishToAblyChannel } = loadAblyActions();

    let settled = false;
    const result = publishToAblyChannel(
      "SIGNAGE:73:844",
      "RELOAD",
      {}
    )(dispatch).then((value) => {
      settled = true;
      return value;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    ack();
    await expect(result).resolves.toBe(true);
    // no trailing callback: ably 2 throws on the v1 callback signature
    expect(mockPublish).toHaveBeenCalledWith("RELOAD", {});
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  it("mints signage tokens from pub-api with the user's access token", async () => {
    const tokenRequest = { keyName: "signage.key", mac: "mac" };
    const requestParams = arrangeTokenResponse(
      Promise.resolve({ response: tokenRequest })
    );
    const { publishToAblyChannel } = loadAblyActions();

    await publishToAblyChannel("SIGNAGE:73:844", "RELOAD", {})(dispatch);

    await expect(mintWith(mockPublishedWithOptions[0])).resolves.toEqual({
      err: null,
      tokenRequest
    });
    const [requestAction, , url, payload, errorHandler] =
      mockPostRequest.mock.calls[0];
    expect(requestAction).toBeNull();
    expect(url).toBe(`${PUB_API_BASE_URL}/api/v1/ably/token/signage`);
    expect(payload).toBeNull();
    // the failed publish reports it, no popup of its own
    expect(errorHandler).toBeNull();
    expect(requestParams()).toEqual({ access_token: "TOKEN" });
  });

  it("publishes schedule updates channels through the overflow app, where the signs listen to OVERFLOW", async () => {
    arrangeTokenResponse(Promise.resolve({ response: {} }));
    const { publishToScheduleUpdatesChannel } = loadAblyActions();

    await expect(
      publishToScheduleUpdatesChannel("73:OVERFLOW:*", "EVENT", {})(dispatch)
    ).resolves.toBe(true);

    await mintWith(mockPublishedWithOptions[0]);
    expect(mockPostRequest.mock.calls[0][2]).toBe(
      `${PUB_API_BASE_URL}/api/v1/ably/token/overflow`
    );
  });

  it("subscribes through the signage app", async () => {
    arrangeTokenResponse(Promise.resolve({ response: {} }));
    const { subscribeToAblyChannel } = loadAblyActions();

    expect(subscribeToAblyChannel("OCCUPANCY:73", jest.fn())(dispatch)).toBe(
      true
    );

    await mintWith(mockPublishedWithOptions[0]);
    expect(mockPostRequest.mock.calls[0][2]).toBe(
      `${PUB_API_BASE_URL}/api/v1/ably/token/signage`
    );
  });

  it("passes the message data to the subscriber callback", () => {
    const callback = jest.fn();
    const { subscribeToAblyChannel } = loadAblyActions();

    subscribeToAblyChannel("OCCUPANCY:73", callback)(dispatch);

    expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
    const [listener] = mockSubscribe.mock.calls[0];
    listener({ data: { occupancy: "FULL", eventId: 1 } });
    expect(callback).toHaveBeenCalledWith({ occupancy: "FULL", eventId: 1 });
  });

  it("reports a failed subscribe naming the channel", async () => {
    mockSubscribe.mockRejectedValue({
      message: "Channel denied access based on given capability"
    });
    const { subscribeToAblyChannel } = loadAblyActions();

    expect(subscribeToAblyChannel("OCCUPANCY:73", jest.fn())(dispatch)).toBe(
      true
    );

    await flushPromises();
    expect(Swal.fire).toHaveBeenCalledWith(
      "signage.subscribe_failed",
      "OCCUPANCY:73: Channel denied access based on given capability",
      "warning"
    );
  });

  it("reuses one client per app", async () => {
    const { publishToAblyChannel, publishToScheduleUpdatesChannel } =
      loadAblyActions();

    await publishToAblyChannel("SIGNAGE:73:844", "RELOAD", {})(dispatch);
    await publishToAblyChannel("SIGNAGE:73:845", "RELOAD", {})(dispatch);
    await publishToScheduleUpdatesChannel(
      "73:OVERFLOW:*",
      "EVENT",
      {}
    )(dispatch);

    const [first, second, third] = mockPublishedWithOptions;
    expect(first).toBe(second);
    expect(third).not.toBe(first);
  });

  it("passes the pub-api status to Ably when the token cannot be minted", async () => {
    // uicore rejects with { err, res } (not an Error)
    // eslint-disable-next-line prefer-promise-reject-errors
    arrangeTokenResponse(Promise.reject({ err: {}, res: { status: 403 } }));
    const { publishToAblyChannel } = loadAblyActions();

    await publishToAblyChannel("SIGNAGE:73:844", "RELOAD", {})(dispatch);

    const { err, tokenRequest } = await mintWith(mockPublishedWithOptions[0]);
    expect(err.statusCode).toBe(403);
    expect(tokenRequest).toBeNull();
  });

  it("reports the Ably error naming the channel and resolves false", async () => {
    mockPublish.mockRejectedValue({
      message: "Channel denied access based on given capability"
    });
    const { publishToAblyChannel } = loadAblyActions();

    await expect(
      publishToAblyChannel("73:OVERFLOW:*", "EVENT", {})(dispatch)
    ).resolves.toBe(false);

    expect(Swal.fire).toHaveBeenCalledWith(
      "signage.publish_failed",
      "73:OVERFLOW:*: Channel denied access based on given capability",
      "warning"
    );
  });
});
