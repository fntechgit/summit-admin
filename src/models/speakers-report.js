export const prepareReportFilters = (reportQueryFilters) => {
  let { selection_status, submission_status, ...newFilters } =
    reportQueryFilters;

  selection_status = selection_status?.toLowerCase() ?? "";
  if (selection_status === "rejected") {
    delete newFilters.publishedIn;
  }

  submission_status = submission_status?.toLowerCase() ?? "";
  if (submission_status === "received" || submission_status === "nonreceived") {
    delete newFilters.publishedIn;
  }

  return newFilters;
};
