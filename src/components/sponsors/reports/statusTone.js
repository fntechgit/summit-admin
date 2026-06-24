// Single source of truth: status token -> MUI Chip color. Case-insensitive.
const TONE_BY_STATUS = {
  completed: "success",
  paid: "success",
  confirmed: "success",
  pending: "warning",
  in_progress: "info",
  not_applicable: "default",
  canceled: "default",
  cancelled: "default"
};

export const statusTone = (status) =>
  TONE_BY_STATUS[String(status || "").toLowerCase()] || "default";

export default statusTone;
