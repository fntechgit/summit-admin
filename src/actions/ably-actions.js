import Ably from "ably";
import Swal from "sweetalert2";
import T from "i18n-react/dist/i18n-react";
import {
  createAction,
  postRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";

export const ABLY_TOKEN_MINTED = "ABLY_TOKEN_MINTED";

// pub-api app names, each one mapped to an Ably app and its capabilities
const ABLY_APP_SIGNAGE = "signage";
// the signs listen to {summit}:OVERFLOW:* on the schedule updates app (where pub-api
// publishes), not on the signage app: channels of different Ably apps never meet
const ABLY_APP_OVERFLOW = "overflow";

// Ably calls this on connect and again before the token expires; pub-api signs the
// TokenRequest, so no Ably key lives in the bundle
const mintAblyToken = (appName, dispatch) => async (tokenParams, callback) => {
  try {
    const accessToken = await getAccessTokenSafely();
    const { response } = await postRequest(
      null,
      createAction(ABLY_TOKEN_MINTED),
      `${window.PUB_API_BASE_URL}/api/v1/ably/token/${appName}`,
      null,
      // no popup of its own: the failed publish reports it
      null
    )({ access_token: accessToken })(dispatch);
    callback(null, response);
  } catch (e) {
    // uicore rejects with { err, res }; a 403 statusCode makes Ably fail the
    // connection instead of retrying, any other status is retried
    const status = e?.res?.status ?? e?.err?.status;
    callback(
      {
        statusCode: status,
        message: `pub-api ably token ${appName}: ${status ?? e?.message}`
      },
      null
    );
  }
};

// created on first use, once the user is logged in and the access token is available;
// the store's dispatch is stable, so the first one serves the token renewals too
const clients = {};

const getAblyClient = (appName, dispatch) => {
  if (!clients[appName]) {
    clients[appName] = new Ably.Realtime({
      authCallback: mintAblyToken(appName, dispatch)
    });
  }
  return clients[appName];
};

export const subscribeToAblyChannel = (channel, callback) => (dispatch) => {
  const ablyChannel = getAblyClient(ABLY_APP_SIGNAGE, dispatch).channels.get(
    channel
  );

  // subscribe attaches the channel and rejects if that fails, e.g. no subscribe capability
  ablyChannel
    .subscribe((msg) => {
      callback(msg.data);
    })
    .catch((err) => {
      Swal.fire(
        T.translate("signage.subscribe_failed"),
        `${channel}: ${err.message}`,
        "warning"
      );
    });

  return true;
};

const publish = async (client, channel, key, message) => {
  // publish only: no implicit subscribe/attach, so the token needs just publish capability
  const ablyChannel = client.channels.get(channel);

  try {
    // resolves once Ably acks the publish, rejects with the publish error
    await ablyChannel.publish(key, message);
  } catch (err) {
    // e.g. the token has no publish capability on this channel
    Swal.fire(
      T.translate("signage.publish_failed"),
      `${channel}: ${err.message}`,
      "warning"
    );
    return false;
  }

  return true;
};

export const publishToAblyChannel = (channel, key, message) => (dispatch) =>
  publish(getAblyClient(ABLY_APP_SIGNAGE, dispatch), channel, key, message);

export const publishToScheduleUpdatesChannel =
  (channel, key, message) => (dispatch) =>
    publish(getAblyClient(ABLY_APP_OVERFLOW, dispatch), channel, key, message);
