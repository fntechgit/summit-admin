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

export const publishToAblyChannel = (channel, key, message) => {
  if (!realtimeAbly) {
    Swal.fire("Publish failed", "No Ably API key found", "warning");
    return false;
  }

  const ablyChannel = realtimeAbly.channels.get(channel);

  ablyChannel.subscribe((msg) => {
    console.log(`Received: ${JSON.stringify(msg.data)}`);
  });

  ablyChannel.publish(key, message);

  return true;
};
