import Ably from "ably";
import Swal from "sweetalert2";
import { getAccessTokenSafely } from "../utils/methods";

// pub-api app names, each one mapped to an Ably app and its capabilities
const ABLY_APP_SIGNAGE = "signage";
// the signs listen to {summit}:OVERFLOW:* on the schedule updates app (where pub-api
// publishes), not on the signage app: channels of different Ably apps never meet
const ABLY_APP_OVERFLOW = "overflow";

// Ably calls this on connect and again before the token expires; pub-api signs the
// TokenRequest, so no Ably key lives in the bundle
const mintAblyToken = (appName) => async (tokenParams, callback) => {
  try {
    const accessToken = await getAccessTokenSafely();
    const response = await fetch(
      `${window.PUB_API_BASE_URL}/api/v1/ably/token/${appName}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (!response.ok) {
      // a 401/403 statusCode makes Ably fail the connection instead of retrying
      callback(
        {
          statusCode: response.status,
          message: `pub-api ably token ${appName}: ${response.status}`
        },
        null
      );
      return;
    }
    callback(null, await response.json());
  } catch (err) {
    callback(err, null);
  }
};

// created on first use, once the user is logged in and the access token is available
const clients = {};

const getAblyClient = (appName) => {
  if (!clients[appName]) {
    clients[appName] = new Ably.Realtime({
      authCallback: mintAblyToken(appName)
    });
  }
  return clients[appName];
};

export const subscribeToAblyChannel = (channel, callback) => {
  const ablyChannel = getAblyClient(ABLY_APP_SIGNAGE).channels.get(channel);

  ablyChannel.subscribe((msg) => {
    callback(msg.data);
  });

  return true;
};

const publish = async (client, channel, key, message) => {
  // publish only: no implicit subscribe/attach, so the token needs just publish capability
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
    // e.g. the token has no publish capability on this channel
    Swal.fire("Publish failed", `${channel}: ${err.message}`, "warning");
    return false;
  }

  return true;
};

export const publishToAblyChannel = (channel, key, message) =>
  publish(getAblyClient(ABLY_APP_SIGNAGE), channel, key, message);

export const publishToScheduleUpdatesChannel = (channel, key, message) =>
  publish(getAblyClient(ABLY_APP_OVERFLOW), channel, key, message);
