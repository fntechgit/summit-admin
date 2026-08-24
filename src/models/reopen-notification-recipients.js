/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

/**
 * Recipient rows for the CFP reopen notification (SDS section 7).
 *
 * The UI shows ROWS; the endpoint takes TWO CHANNELS (speaker_ids plus
 * include_submitter). A row is keyed by IDENTITY, never by email: "submitter"
 * for the creator, "speaker:<id>" for each speaker and the moderator. Email is
 * only the MERGE PREDICATE, because two people can legitimately share a mailbox
 * and the payload still has to name both of them.
 *
 * Two passes, in a fixed order (submitter, speakers in array order, moderator):
 *   1. dedupe by speaker id. The moderator is usually also in speakers, and one
 *      id must never yield two rows.
 *   2. merge by normalized email. An empty email is never a merge key, so two
 *      people with no address on file stay two rows.
 *
 * The first identity in that order keeps the row key, which is what makes keys
 * stable across renders and lets the checked set be a plain list of keys. This
 * is also why toggling a merged row clears every channel it spans: the key names
 * the whole row, so there is no way to clear one channel and leave the other live.
 */

export const ROLE = {
  SUBMITTER: "submitter",
  SPEAKER: "speaker",
  MODERATOR: "moderator"
};

export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const displayName = (person) => {
  const name = `${person?.first_name || ""} ${person?.last_name || ""}`.trim();
  if (name) return name;
  return typeof person?.email === "string" ? person.email.trim() : "";
};

export const buildRecipientRows = (entity) => {
  const identities = [];
  const bySpeakerId = new Map();

  // normalizeEventResponse coerces server nulls to "", so an absent submitter or
  // moderator is the empty string. Guard on the id, not on null.
  const submitter = entity?.created_by;
  if (submitter?.id) {
    identities.push({
      key: "submitter",
      name: displayName(submitter),
      names: [displayName(submitter)],
      roles: [ROLE.SUBMITTER],
      speakerIds: [],
      includeSubmitter: true,
      email: normalizeEmail(submitter.email)
    });
  }

  const addSpeaker = (person, role) => {
    if (!person?.id) return;
    // One expression for both the map key and the row key: a Map compares keys
    // strictly, so keying it on the raw id would let 7 and "7" miss each other
    // and produce two rows sharing one key.
    const key = `speaker:${person.id}`;
    const seen = bySpeakerId.get(key);
    if (seen) {
      if (!seen.roles.includes(role)) seen.roles.push(role);
      return;
    }
    const identity = {
      key,
      name: displayName(person),
      names: [displayName(person)],
      roles: [role],
      speakerIds: [person.id],
      includeSubmitter: false,
      email: normalizeEmail(person.email)
    };
    bySpeakerId.set(key, identity);
    identities.push(identity);
  };

  const speakers = Array.isArray(entity?.speakers) ? entity.speakers : [];
  speakers.forEach((s) => addSpeaker(s, ROLE.SPEAKER));
  addSpeaker(entity?.moderator, ROLE.MODERATOR);

  const rows = [];
  const byEmail = new Map();

  identities.forEach((identity) => {
    const target = identity.email ? byEmail.get(identity.email) : null;
    if (!target) {
      const row = { ...identity, disabled: !identity.email };
      if (identity.email) byEmail.set(identity.email, row);
      rows.push(row);
      return;
    }
    identity.roles.forEach((role) => {
      if (!target.roles.includes(role)) target.roles.push(role);
    });
    target.speakerIds = [...target.speakerIds, ...identity.speakerIds];
    target.includeSubmitter =
      target.includeSubmitter || identity.includeSubmitter;
    identity.names.forEach((n) => {
      if (n && !target.names.includes(n)) target.names.push(n);
    });
    target.name = target.names.join(", ");
  });

  return rows;
};

/**
 * Union of the channels of every checked, enabled row. Disabled rows are filtered
 * again here and not only at toggle time: a row can go disabled between mount and
 * send if the entity is refetched.
 */
export const toNotifyPayload = (rows, checkedKeys) => {
  const checked = rows.filter(
    (row) => !row.disabled && checkedKeys.includes(row.key)
  );
  return {
    speakerIds: [...new Set(checked.flatMap((row) => row.speakerIds))],
    includeSubmitter: checked.some((row) => row.includeSubmitter)
  };
};
