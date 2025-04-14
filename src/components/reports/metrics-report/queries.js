import moment from "moment-timezone";
import Query from "graphql-query-builder";

const buildMemberQuery = (filters, listFilters, localFilters, summitId) => {
  const { fromDate, toDate, eventType, onlyFinished } = localFilters;
  const queryFilters = { ...listFilters };
  const resultsFilters = { ...filters };

  queryFilters.summitId = summitId;
  resultsFilters.ordering = "ingress_date";
  resultsFilters.limit = 3000;

  if (eventType) {
    queryFilters.type = eventType;
  }

  if (fromDate) {
    queryFilters.fromDate = moment(fromDate)
      .tz("UTC")
      .format("YYYY-MM-DDTHH:mm:ss+00:00");
  }

  if (toDate) {
    queryFilters.toDate = moment(toDate)
      .tz("UTC")
      .format("YYYY-MM-DDTHH:mm:ss+00:00");
  }

  if (onlyFinished) {
    queryFilters.onlyFinished = true;
  }

  const query = new Query("metrics", queryFilters);
  const results = new Query("results", resultsFilters);
  const eventmetric = new Query("eventmetric");
  eventmetric.find(["subType"]);
  results.find([
    "type",
    "ingressDate",
    "outgressDate",
    "memberName",
    "eventName",
    "sponsorName",
    "locationName",
    "ip",
    { eventmetric }
  ]);

  query.find([{ results }, "totalCount"]);

  return query;
};


const buildBaseQuery = (listFilters, summitId) => {
  const queryFilters = { ...listFilters, id: summitId };
  return new Query("summits", queryFilters);
};

const buildFindQuery = () => {
  const extraQuestions = new Query("orderExtraQuestions");
  extraQuestions.find(["id", "name"]);

  return ["id", "title", { extraQuestions }];
};



const buildMetricsQuery = (sortKey, sortDir, localFilters, isPoster = false) => {
  const {
    fromDate,
    toDate,
    eventType,
    showAnswers,
    onlyFinished,
    subTypeFilter,
  } = localFilters;
  const overallFilter = {};
  const metricsFields = [
    "name",
    "email",
    "company",
    "subType",
    "attendeeId",
    "memberId",
    "ingress",
    "outgress",
    "ip"
  ];

  if (showAnswers) {
    metricsFields.push("answers");
  }

  if (eventType) {
    overallFilter.metricType = eventType;
  }

  if (fromDate) {
    overallFilter.fromDate = moment(fromDate)
      .tz("UTC")
      .format("YYYY-MM-DDTHH:mm:ss+00:00");
  }

  if (toDate) {
    overallFilter.toDate = moment(toDate)
      .tz("UTC")
      .format("YYYY-MM-DDTHH:mm:ss+00:00");
  }

  if (onlyFinished) {
    overallFilter.onlyFinished = true;
  }

  if (subTypeFilter) {
    overallFilter.metricSubType = subTypeFilter;
  }

  if (sortKey && sortDir) {
    overallFilter.sortBy = this.translateSortKey(sortKey);
    overallFilter.sortDir = sortDir === "1" ? "ASC" : "DESC";
  }

  if (isPoster) {
    overallFilter.metricType = "POSTER";
  }

  const metrics = new Query("uniqueMetrics", overallFilter);
  metrics.find(metricsFields);

  return metrics;
}

const buildEventMetricQuery = (listFilters, localFilters, summitId, sortKey, sortDir) => {
  const { sponsor, eventFilter, roomFilter } = localFilters;
  const eventQueryFilter = {};
  const roomQueryFilter = {};

  const eventsMessage = ["events"];
  const roomsMessage = ["rooms"];

  const baseQuery = buildBaseQuery(listFilters, summitId);
  const metrics = buildMetricsQuery(sortKey, sortDir, localFilters);
  const findQueries = buildFindQuery();

  if (eventFilter) {
    eventQueryFilter.id = eventFilter.id;
  }

  if (roomFilter) {
    roomQueryFilter.id = roomFilter;
  }

  if (sponsor) {
    const sponsorId = parseInt(sponsor.id, 10);
    eventsMessage.push({ sponsors_Id: sponsorId })
    roomsMessage.push({ events_Sponsors_Id: sponsorId });
  }

  const events = new Query(...eventsMessage, eventQueryFilter);
  events.find(["id", "title", { metrics }]);
  const rooms = new Query(...roomsMessage, roomQueryFilter);

  rooms.find(["id", "name", { events }]);
  findQueries.push({ rooms });

  baseQuery.find(findQueries);

  return baseQuery;
}

const buildRoomMetricQuery = (listFilters, localFilters, summitId, sortKey, sortDir) => {
  const { sponsor, roomFilter } = localFilters;
  const roomQueryFilter = {};

  const roomsMessage = ["rooms"];

  const baseQuery = buildBaseQuery(listFilters, summitId);
  const metrics = buildMetricsQuery(sortKey, sortDir, localFilters);
  const findQueries = buildFindQuery();

  if (roomFilter) {
    roomQueryFilter.id = roomFilter;
  }

  if (sponsor) {
    const sponsorId = parseInt(sponsor.id, 10);
    roomsMessage.push({ events_Sponsors_Id: sponsorId });
  }

  const rooms = new Query(...roomsMessage, roomQueryFilter);
  const venueroom = new Query("venueroom");
  venueroom.find([{ metrics }]);

  rooms.find(["id", "name", { venueroom }]);
  findQueries.push({ rooms });

  baseQuery.find(findQueries);

  return baseQuery;
}


const buildSponsorMetricQuery = (listFilters, localFilters, summitId, sortKey, sortDir) => {
  const { sponsor } = localFilters;
  const sponsorsMessage = ["sponsors"];
  const baseQuery = buildBaseQuery(listFilters, summitId);
  const metrics = buildMetricsQuery(sortKey, sortDir, localFilters);
  const findQueries = buildFindQuery();

  if (sponsor) {
    const sponsorId = parseInt(sponsor.id, 10);
    sponsorsMessage.push({ company: sponsorId });
  }

  const sponsors = new Query(...sponsorsMessage);
  sponsors.find(["id", "companyName", { metrics }]);
  findQueries.push({ sponsors });

  baseQuery.find(findQueries);

  return baseQuery;
}


const buildPosterMetricQuery = (listFilters, localFilters, summitId, sortKey, sortDir) => {
  const baseQuery = buildBaseQuery(listFilters, summitId);
  const metrics = buildMetricsQuery(sortKey, sortDir, localFilters, true);
  const findQueries = buildFindQuery();

  const posters = new Query("events", { type_Type: "Poster" });
  posters.find(["id", "title", { metrics }]);
  findQueries.push({ posters });

  baseQuery.find(findQueries);

  return baseQuery;
}

const buildAllMetricQuery = (listFilters, localFilters, summitId, sortKey, sortDir) => {
  const baseQuery = buildBaseQuery(listFilters, summitId);
  const metrics = buildMetricsQuery(sortKey, sortDir, localFilters);
  const findQueries = buildFindQuery();

  findQueries.push({ metrics });
  baseQuery.find(findQueries);

  return baseQuery;
}

export const buildDrillDownQuery = (typeId, memberId, attendeeId, summitId, localFilters) => {
  const { fromDate, toDate, eventType, onlyFinished } = localFilters;
  const filters = { ordering: "ingress_date", limit: 3000 };
  const listFilters = { summitId, type: eventType };

  if (memberId) {
    listFilters.memberId = memberId;
  } else if (attendeeId) {
    listFilters.attendeeId = attendeeId;
  }

  if (eventType === "ROOM") {
    listFilters.roomId = typeId;
  } else if (eventType === "EVENT") {
    listFilters.eventId = typeId;
  }

  if (fromDate) {
    listFilters.fromDate = moment(fromDate)
      .tz("UTC")
      .format("YYYY-MM-DDTHH:mm:ss+00:00");
  }

  if (toDate) {
    listFilters.toDate = moment(toDate)
      .tz("UTC")
      .format("YYYY-MM-DDTHH:mm:ss+00:00");
  }

  if (onlyFinished) {
    listFilters.onlyFinished = true;
  }

  const query = new Query("metrics", listFilters);
  const results = new Query("results", filters);
  results.find([
    "type",
    "ingressDate",
    "outgressDate",
    "memberName",
    "attendeeName",
    "eventName",
    "sponsorName",
    "locationName",
    "subType",
    "ip"
  ]);

  query.find([{ results }, "totalCount"]);

  return `{ reportData: ${query} }`;
};

export const buildQuery = (filters, listFilters, localFilters, summitId, sortKey, sortDir) => {
  const { eventType, search } = localFilters;

  if (search) {
    return buildMemberQuery(filters, listFilters, localFilters, summitId);
  }

  switch (eventType) {
    case "EVENT":
      return buildEventMetricQuery(listFilters, localFilters, summitId, sortKey, sortDir);
    case "ROOM":
      return buildRoomMetricQuery(listFilters, localFilters, summitId, sortKey, sortDir);
    case "SPONSOR":
      return buildSponsorMetricQuery(listFilters, localFilters, summitId, sortKey, sortDir);
    case "POSTER":
      return buildPosterMetricQuery(listFilters, localFilters, summitId, sortKey, sortDir);
    default:
      return buildAllMetricQuery(listFilters, localFilters, summitId, sortKey, sortDir);
  }
}