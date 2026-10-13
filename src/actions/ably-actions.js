import Ably from "ably";
import Swal from "sweetalert2";

const AblyApiKey = process.env.SIGNAGE_ABLY_API_KEY;
const realtimeAbly = AblyApiKey ? new Ably.Realtime(AblyApiKey) : null;

export const subscribeToAblyChannel = (channel, callback) => {
  if (!realtimeAbly) {
    Swal.fire("Subscribe failed", "No Ably API key found", "warning");
    return false;
  }

  const ablyChannel = realtimeAbly.channels.get(channel);

  ablyChannel.subscribe((msg) => {
    callback(msg.data);
  });

  return true;
};

export const publishToAblyChannel = async (channel, key, message) => {
  if (!realtimeAbly) {
    Swal.fire("Publish failed", "No Ably API key found", "warning");
    return false;
  }

  // publish only: no implicit subscribe/attach, so the key needs just publish capability
  const ablyChannel = realtimeAbly.channels.get(channel);

  try {
    await ablyChannel.publish(key, message);
  } catch (err) {
    // e.g. the key has no publish capability on this channel
    Swal.fire("Publish failed", `${channel}: ${err.message}`, "warning");
    return false;
  }

  return true;
};
