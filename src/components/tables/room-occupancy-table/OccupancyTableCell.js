import React from "react";
import RawHTML from "openstack-uicore-foundation/lib/components/raw-html";

const OccupancyTableCell = (props) => {
  let value = props.children ? props.children.toString() : "";

  return (
    <td {...props}>
      <RawHTML>{value}</RawHTML>
    </td>
  );
};

export default OccupancyTableCell;
