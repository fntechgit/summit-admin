/**
 * Copyright 2017 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import moment from "moment-timezone";
import {
  findElementPos,
  epochToMomentTimeZone
} from "openstack-uicore-foundation/lib/utils/methods";
import {
  getAccessToken,
  initLogOut
} from "openstack-uicore-foundation/lib/security/methods";
import Swal from "sweetalert2";
import * as Sentry from "@sentry/react";
import T from "i18n-react/dist/i18n-react";
import {
  ERROR_CODE_401,
  ERROR_CODE_403,
  ERROR_CODE_412,
  ERROR_CODE_500,
  HEX_RADIX,
  MILLISECONDS_TO_SECONDS,
  ONE_MINUTE,
  INT_BASE,
  OR_FILTER
} from "./constants";

const DAY_IN_SECONDS = 86400; // 86400 seconds per day
const ELLIPSIS = 3;

export const trim = (string, length) =>
  string?.length > length
    ? `${string.substring(0, length - ELLIPSIS)}...`
    : string;

export const canonicalizeObject = (entity) => {
  Object.entries(entity).forEach(([key, value]) => {
    entity[key] = value == null ? "" : value;
  });
};

export const groupByDate = (array, prop, sortBy) => {
  const groupedUnordered = array.reduce((groups, item) => {
    const val = item[prop];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});

  const groupedOrdered = {};
  Object.keys(groupedUnordered)
    .sort((a, b) => {
      const compareA = groupedUnordered[a][0][sortBy];
      const compareB = groupedUnordered[b][0][sortBy];
      const ONE = 1;
      const MINUS_ONE = 1;
      if (compareA > compareB) {
        return ONE;
      }
      if (compareA < compareB) {
        return MINUS_ONE;
      }
      return 0;
    })
    .forEach((key) => {
      groupedOrdered[key] = groupedUnordered[key];
    });

  return groupedOrdered;
};

export const scrollToError = (errors) => {
  if (Object.keys(errors).length > 0) {
    const firstError = Object.keys(errors)[0];
    const firstNode = document.getElementById(firstError);
    if (firstNode) window.scrollTo(0, findElementPos(firstNode));
  }
};

export const hasErrors = (field, errors) => {
  if (field in errors) {
    return errors[field];
  }
  return "";
};

export const shallowEqual = (object1, object2) => {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  // Check if all keys in object1 have the same value in object2
  return keys1.every((key) => object1[key] === object2[key]);
};

export const isEmpty = (obj) => Object.keys(obj).length === 0;

export const isEmptyString = (str) => !str || str.trim().length === 0;

export const stripTags = (s) => s?.replace(/(<([^>]+)>)/gi, "") || "";

export const boolToStr = (boolean) => (boolean ? "Yes" : "No");

export const parseAndFormat = (
  dateString,
  inputFormat,
  outputFormat = "MM/DD/YYYY h:mma",
  inputTZ = "UTC",
  outputTZ = "UTC"
) => {
  const parsedDate = moment.tz(dateString, inputFormat, inputTZ).tz(outputTZ);
  return parsedDate.format(outputFormat);
};

export const getAccessTokenSafely = async () => {
  try {
    return await getAccessToken();
  } catch (e) {
    Sentry.captureException(e);
    return initLogOut();
  }
};

export const escapeFilterValue = (value) => {
  value = value.replace(/,/g, "\\,");
  value = value.replace(/;/g, "\\;");
  return value;
};

export const fetchResponseHandler = (response) => {
  if (!response.ok) {
    throw response;
  } else {
    return response.json();
  }
};

export const fetchErrorHandler = (response) => {
  const code = response.status;
  const msg = response.statusText;

  switch (code) {
    case ERROR_CODE_403:
      Swal.fire("ERROR", T.translate("errors.user_not_authz"), "warning");
      break;
    case ERROR_CODE_401:
      Swal.fire("ERROR", T.translate("errors.session_expired"), "error");
      break;
    case ERROR_CODE_412:
      Swal.fire("ERROR", msg, "warning");
      break;
    case ERROR_CODE_500:
      Swal.fire("ERROR", T.translate("errors.server_error"), "error");
      break;
    default:
      break;
  }
};

export const adjustEventDuration = (evt, entity) => {
  const adjustedEntity = { ...entity };
  const { id, type } = evt.target;
  let { value } = evt.target;

  if (type === "datetime") {
    const empty = moment(0);
    if (value.valueOf() === empty.valueOf()) value = null;
    if (value !== null) value = value.valueOf() / MILLISECONDS_TO_SECONDS;
    // if we have both dates, update duration
    if (id === "start_date" && adjustedEntity.end_date) {
      adjustedEntity.duration =
        adjustedEntity.end_date > value ? adjustedEntity.end_date - value : 0;
    } else if (id === "end_date" && adjustedEntity.start_date) {
      adjustedEntity.duration =
        adjustedEntity.start_date < value
          ? value - adjustedEntity.start_date
          : 0;
    } else if (adjustedEntity.duration) {
      // if one of the dates is missing but we have duration, update missing date
      if (id === "start_date") {
        adjustedEntity.end_date = value + adjustedEntity.duration;
      } else {
        adjustedEntity.start_date = value - adjustedEntity.duration;
      }
    }
    adjustedEntity[id] = value;
  } else if (value !== "") {
    // updating duration unless is empty
    const parsedValue = parseInt(value, INT_BASE) * ONE_MINUTE;
    if (!Number.isNaN(parsedValue)) {
      if (adjustedEntity.start_date) {
        // if we have start date, update end date
        adjustedEntity.end_date = adjustedEntity.start_date + parsedValue;
      } else if (adjustedEntity.end_date) {
        // if we only have end date, update start date
        adjustedEntity.start_date = adjustedEntity.end_date - parsedValue;
      }
      adjustedEntity[id] = parsedValue;
    }
  }

  return adjustedEntity;
};

/* eslint no-bitwise: "warn" */
export const uuidv4 = () =>
  // eslint-disable-next-line no-magic-numbers
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      // eslint-disable-next-line no-magic-numbers
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(HEX_RADIX)
  );

export const getSummitDays = (summit) => {
  const days = [];
  const summitLocalStartDate = epochToMomentTimeZone(
    summit.start_date,
    summit.time_zone_id
  );
  const summitLocalEndDate = epochToMomentTimeZone(
    summit.end_date,
    summit.time_zone_id
  );
  let currentAuxDay = summitLocalStartDate.clone();

  do {
    const option = {
      value: currentAuxDay.valueOf() / MILLISECONDS_TO_SECONDS,
      label: currentAuxDay.format("MMM Do YYYY")
    };

    days.push(option);

    currentAuxDay = currentAuxDay.clone();
    const ONE_DAY = 1;
    currentAuxDay.add(ONE_DAY, "day");
  } while (!currentAuxDay.isAfter(summitLocalEndDate));

  return days;
};

export const isNumericString = (value) => /^[0-9]*$/.test(value);

export const checkOrFilter = (filters, filter) => {
  // check if filter is OR to return the correct filter
  if (filters?.orAndFilter === OR_FILTER) {
    return filter.map((f) => `or(${f})`);
  }
  return filter;
};

export const validateEmail = (email) =>
  String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );

export const parseSpeakerAuditLog = (logString) => {
  const logEntries = logString.split("|");
  const userChanges = {};
  const emailRegExp =
    /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
  // eslint-disable-next-line
  for (const entry of logEntries) {
    const emailMatch = entry.match(emailRegExp);
    if (!emailMatch) continue;
    const email = emailMatch[0];
    if (entry.includes("added")) {
      // eslint-disable-next-line no-magic-numbers
      userChanges[email] = (userChanges[email] || 0) + 1;
    } else if (entry.includes("removed")) {
      // eslint-disable-next-line no-magic-numbers
      userChanges[email] = (userChanges[email] || 0) - 1;
    }
  }

  const relevantChanges = [];
  // eslint-disable-next-line
  for (const [email, changeCount] of Object.entries(userChanges)) {
    if (changeCount !== 0) {
      relevantChanges.push(
        `Speaker ${email} ${
          changeCount > 0
            ? "was added to the collection"
            : "was removed from the collection"
        }`
      );
    }
  }

  return relevantChanges.length > 0 ? relevantChanges.join("|") : logString;
};

export const formatAuditLog = (logString) => {
  const timeZone = moment.tz.guess();
  const dateTimeRegExp = /\d{4}([.\-/ ])\d{2}\1\d{2} \d{1,2}:\d{2}:\d{2}/g;
  const dateTimeMatch = logString.match(dateTimeRegExp);
  if (!dateTimeMatch) return logString;
  const dt = moment.utc(dateTimeMatch[0], "YYYY-MM-DD HH:mm:ss");
  if (!moment.isMoment(dt)) return logString;
  const userDt = epochToMomentTimeZone(dt.unix(), timeZone);
  if (!moment.isMoment(userDt)) return logString;
  return logString.replace(
    dateTimeMatch[0],
    userDt.format("YYYY-MM-DD HH:mm:ss")
  );
};

export const getAvailableBookingDates = (summit) => {
  const isValidStartDate =
    new Date(summit.begin_allow_booking_date).getTime() > 0;
  const isValidEndDate = new Date(summit.end_allow_booking_date).getTime() > 0;
  const now = moment().tz(summit.time_zone_id).startOf("day");
  const dates = [];

  if (!isValidStartDate || !isValidEndDate) return dates;

  const bookStartDate = epochToMomentTimeZone(
    summit.begin_allow_booking_date,
    summit.time_zone_id
  ).startOf("day");
  const bookEndDate = epochToMomentTimeZone(
    summit.end_allow_booking_date,
    summit.time_zone_id
  ).startOf("day");

  while (bookStartDate <= bookEndDate) {
    if (bookStartDate >= now) {
      const tmp = bookStartDate.clone();
      dates.push({ str: tmp.format("MMM Do YYYY"), epoch: tmp.unix() });
    }
    bookStartDate.add(1, "days");
  }
  return dates;
};

const isEntityWithinDay = (dayValue, entity) => {
  const startOfDay = dayValue;
  const endOfDay = dayValue + DAY_IN_SECONDS;

  return entity.start_datetime >= startOfDay && entity.end_datetime <= endOfDay;
};

export const getDayFromReservation = (entity, availableDates) => {
  const matchingDay = availableDates.find((date) =>
    isEntityWithinDay(date.epoch, entity)
  );
  return matchingDay?.epoch || null;
};

export const wrapFormFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
};

export const joinCVSChunks = (chunks) => {
  // if we get result try to get first the header
  const header = chunks[0].split("\n")[0];
  // and rebuild all the chunks using reduce
  const csv = chunks.reduce((final, currentCvs) => {
    const lines = currentCvs.split("\n");
    // remove one line, starting at the first position
    // eslint-disable-next-line no-magic-numbers
    lines.splice(0, 1);
    const rawContent = lines.join("\n");
    return final === "" ? rawContent : `${final}${rawContent}`;
  }, "");

  return `${header}\n${csv}`;
};

export const htmlToString = (html) =>
  new DOMParser().parseFromString(html, "text/html").documentElement
    .textContent;

export const capitalize = (string) => {
  const ONE_LETTER = 1;
  return string
    ? string.charAt(0).toUpperCase() + string.slice(ONE_LETTER)
    : "";
};

export const parseDateRangeFilter = (
  filterObject,
  filterToParse,
  filterName
) => {
  if (filterToParse && filterToParse.some((e) => e !== null && e !== 0)) {
    if (filterToParse.every((e) => e !== null && e !== 0)) {
      filterObject.push(
        `${filterName}[]${filterToParse[0]}&&${filterToParse[1]}`
      );
    } else {
      filterObject.push(
        `${
          filterToParse[0] !== null && filterToParse[0] !== 0
            ? `${filterName}>=${filterToParse[0]}`
            : ""
        }${
          filterToParse[1] !== null && filterToParse[1] !== 0
            ? `${filterName}<=${filterToParse[1]}`
            : ""
        }`
      );
    }
  }
};

export const handleDDLSortByLabel = (ddlArray) =>
  ddlArray.sort((a, b) => a.label.localeCompare(b.label));

export const range = (start, stop, step) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
