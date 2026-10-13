import Swal from "sweetalert2";

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() }
}));

const mockPublish = jest.fn();

jest.mock("ably", () => ({
  __esModule: true,
  default: {
    // callback API, as ably 1.2's Ably.Realtime: publish(name, data, callback) returns undefined
    Realtime: jest.fn(() => ({
      channels: { get: jest.fn(() => ({ publish: mockPublish })) }
    }))
  }
}));

const loadAblyActions = () => {
  let actions;
  jest.isolateModules(() => {
    // the client is created at module load, from this env var
    process.env.SIGNAGE_ABLY_API_KEY = "app.key:secret";
    // eslint-disable-next-line global-require
    actions = require("../ably-actions");
  });
  return actions;
};

describe("publishToAblyChannel", () => {
  const originalKey = process.env.SIGNAGE_ABLY_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.SIGNAGE_ABLY_API_KEY = originalKey;
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
