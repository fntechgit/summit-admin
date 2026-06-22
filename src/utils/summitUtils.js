// Default columns to show
export const defaultColumns = ["id", "event_type", "title", "selection_status"];

export const editableColumns = [
  "event_type",
  "title",
  "speaker_names",
  "track_name",
  "selection_plan",
  "streaming_url",
  "meeting_url",
  "etherpad_link"
];

export const getIdValue = (prop) => {
  if (prop && typeof prop === "number") {
    return prop;
  }
  return prop?.id;
};
