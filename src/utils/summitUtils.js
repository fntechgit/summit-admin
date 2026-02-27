import moment from "moment-timezone";
import { MILLISECONDS } from "./constants";

// Default columns to show
export const defaultColumns = ["id", "event_type", "title", "selection_status"];

export const editableColumns = [
  "event_type",
  "title",
  "speakers",
  "track",
  "selection_plan",
  "streaming_url",
  "meeting_url",
  "etherpad_link"
];

const formatDuration = (duration) => {
  const d = moment.duration(duration, "seconds");
  return d.format("mm:ss") !== "00" ? d.format("mm:ss") : "TBD";
};

export const formatEventData = (e, summit) => {
  const published_date = e.is_published
    ? moment(e.published_date * MILLISECONDS)
        .tz(summit.time_zone.name)
        .format("MMMM Do YYYY, h:mm a")
    : "No";

  let speakers_companies =
    Array.isArray(e.speakers) && e.speakers.length > 0
      ? e.speakers?.map((e) => e.company)
      : [];
  speakers_companies =
    speakers_companies.length > 0
      ? speakers_companies.filter(
          (item, index) =>
            item !== "" && speakers_companies.indexOf(item) === index
        )
      : [];

  const event_type_capacity = [];

  if (e.type?.allows_location) event_type_capacity.push("Allows Location");
  if (e.type?.allows_attendee_vote)
    event_type_capacity.push("Allows Attendee Vote");
  if (e.type?.allows_publishing_dates)
    event_type_capacity.push("Allows Publishing Dates");

  let speakers_count;

  if (e.type.use_speakers) {
    if (e.speakers && e.speakers.length > 0) {
      speakers_count = e.speakers.length;
    } else {
      speakers_count = "0";
    }
  } else {
    speakers_count = "N/A";
  }

  return {
    id: e.id,
    type: e.type,
    summit_id: e.summit_id,
    title: e.title,
    status: e.status ?? "Not Submitted",
    selection_status:
      e.selection_status === "unaccepted" && e.is_published === true
        ? "accepted"
        : e.selection_status,
    published_date,
    created_by_fullname: e.hasOwnProperty("created_by")
      ? `${e.created_by.first_name} ${e.created_by.last_name} (${e.created_by.email})`
      : "TBD",
    submitter_company: e.hasOwnProperty("created_by")
      ? e.created_by.company
      : "N/A",
    speakers:
      Array.isArray(e.speakers) && e.speakers.length > 0
        ? e.speakers.map((s) => `${s.first_name} ${s.last_name}`).join(", ")
        : "N/A",
    speaker_company:
      speakers_companies.length > 0
        ? speakers_companies.reduce(
            (accumulator, company) =>
              accumulator + (accumulator !== "" ? ", " : "") + company,
            ""
          )
        : "N/A",
    duration:
      e.type?.allows_publishing_dates && e.duration
        ? formatDuration(e?.duration)
        : "N/A",
    speakers_count,
    event_type_capacity: event_type_capacity.reduce(
      (accumulator, capacity) =>
        accumulator + (accumulator !== "" ? ", " : "") + capacity,
      ""
    ),
    track: e?.track?.name ? e?.track?.name : "TBD",
    level: e.level ? e.level : "N/A",
    tags:
      Array.isArray(e.tags) && e.tags.length > 0
        ? e.tags.reduce(
            (accumulator, t) =>
              accumulator + (accumulator !== "" ? ", " : "") + t.tag,
            ""
          )
        : "N/A",
    selection_plan: e.selection_plan ? e.selection_plan : "N/A",
    location: e.location?.name ? e.location?.name : "N/A",
    streaming_url: e.streaming_url ? e.streaming_url : "N/A",
    meeting_url: e.meeting_url ? e.meeting_url : "N/A",
    etherpad_link: e.etherpad_link ? e.etherpad_link : "N/A",
    streaming_type: e.streaming_type ? e.streaming_type : "N/A",
    start_date: e.start_date
      ? moment(e.start_date * MILLISECONDS)
          .tz(summit.time_zone.name)
          .format("MMMM Do YYYY, h:mm a")
      : "TBD",
    end_date: e.end_date
      ? moment(e.end_date * MILLISECONDS)
          .tz(summit.time_zone.name)
          .format("MMMM Do YYYY, h:mm a")
      : "TBD",
    sponsor:
      Array.isArray(e.sponsors) && e.sponsors.length > 0
        ? e.sponsors.map((s) => s.name).join(", ")
        : "N/A",
    media_uploads:
      Array.isArray(e.media_uploads) && e.media_uploads?.length > 0
        ? e?.media_uploads?.map((m) => ({
            ...m,
            created: moment(m.created * MILLISECONDS)
              .tz(summit.time_zone.name)
              .format("MMMM Do YYYY, h:mm a")
          }))
        : "N/A",
    created: e.created
      ? moment(e.created * MILLISECONDS)
          .tz(summit.time_zone_id)
          .format("MMMM Do YYYY, h:mm a")
      : "TBD",
    modified: e.last_edited
      ? moment(e.last_edited * MILLISECONDS)
          .tz(summit.time_zone_id)
          .format("MMMM Do YYYY, h:mm a")
      : "TBD",
    progress_flags: e?.actions
      ?.map((a) => `${a.type.label} (${a.is_completed ? "ON" : "OFF"})`)
      .join(", "),
    submission_source: e.submission_source ? e.submission_source : "N/A",
    review_status: e.review_status ?? "N/A"
  };
};

export const getIdValue = (prop) => {
  if (prop && typeof prop === "number") {
    return prop;
  }
  return prop?.id;
};
