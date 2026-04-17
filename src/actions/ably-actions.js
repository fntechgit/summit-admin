import Swal from "sweetalert2";

const AblyApiKey = process.env.SIGNAGE_ABLY_API_KEY;
let realtimeAbly = null;

const getAblyClient = async () => {
  if (!AblyApiKey) return null;
  if (realtimeAbly) return realtimeAbly;
  const Ably = (await import("ably")).default;
  realtimeAbly = new Ably.Realtime(AblyApiKey);
  return realtimeAbly;
};

export const subscribeToAblyChannel = (channel, callback) => async (dispatch) => {
  const client = await getAblyClient();
  if (!client) {
    Swal.fire("Subscribe failed", "No Ably API key found", "warning");
    return false;
  }

  const ablyChannel = client.channels.get(channel);
  ablyChannel.subscribe((msg) => {
    callback(msg.data);
  });

  return true;
};

export const publishToAblyChannel = (channel, key, message) => async (dispatch) => {
  const client = await getAblyClient();
  if (!client) {
    Swal.fire("Publish failed", "No Ably API key found", "warning");
    return false;
  }

  const ablyChannel = client.channels.get(channel);

  ablyChannel.subscribe((msg) => {
    console.log(`Received: ${JSON.stringify(msg.data)}`);
  });

  ablyChannel.publish(key, message);

  return true;
};
