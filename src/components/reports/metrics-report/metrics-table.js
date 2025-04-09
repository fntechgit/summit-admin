import moment from "moment-timezone";
import React from "react";


const RawMetricsTable = ({ data, timezone }) => {
  const columns = [
    { columnKey: "ingressDate", value: "Ingress" },
    { columnKey: "outgressDate", value: "Outgress" },
    { columnKey: "ip", value: "Ip" }
  ];

  if (!data) return null;

  data.forEach((d) => {
    d.ingressDate = moment
      .utc(d.ingressDate)
      .tz(timezone)
      .format("dddd, MMMM Do YYYY, h:mm a (z)");
    d.outgressDate = d.outgressDate
      ? moment
        .utc(d.outgressDate)
        .tz(timezone)
        .format("dddd, MMMM Do YYYY, h:mm a (z)")
      : "-";
  });

  return <Table options={{ actions: {} }} data={data} columns={columns} />;
};

export default RawMetricsTable;