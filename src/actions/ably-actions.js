import Ably from "ably";
import Swal from "sweetalert2";

const createAblyClient = (apiKey) =>
  apiKey ? new Ably.Realtime(apiKey) : null;

const realtimeAbly = createAblyClient(process.env.SIGNAGE_ABLY_API_KEY);
// the signs listen to {summit}:OVERFLOW:* on the schedule updates app (where pub-api
// publishes), not on the signage app: channels of different Ably apps never meet
const scheduleUpdatesAbly = createAblyClient(
  process.env.ABLY_SCHEDULE_UPDATES_PUBLISHER_API_KEY
);

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

const publish = async (client, channel, key, message) => {
  if (!client) {
    Swal.fire("Publish failed", "No Ably API key found", "warning");
    return false;
  }

  // publish only: no implicit subscribe/attach, so the key needs just publish capability
  const ablyChannel = client.channels.get(channel);

  try {
    // Ably.Realtime (1.2) is the callback API: publish returns undefined, so the
    // callback is the only way to wait for the ack and see a publish error
    await new Promise((resolve, reject) => {
      ablyChannel.publish(key, message, (err) =>
        err ? reject(err) : resolve()
      );
    });
  } catch (err) {
    // e.g. the key has no publish capability on this channel
    Swal.fire("Publish failed", `${channel}: ${err.message}`, "warning");
    return false;
  }

  return true;
};

export const publishToAblyChannel = (channel, key, message) =>
  publish(realtimeAbly, channel, key, message);

export const publishToScheduleUpdatesChannel = (channel, key, message) =>
  publish(scheduleUpdatesAbly, channel, key, message);
