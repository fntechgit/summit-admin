import React from "react";

function OccupancyActionsTableCell(props) {
  const { actions, id, value } = props;
  const style = {
    marginLeft: "10px",
    marginRight: "10px",
    width: "90px",
    display: "inline-block",
    textAlign: "center"
  };

  const lessDisable = value === "EMPTY";
  const moreDisable = value === "OVERFLOW";

  return (
    <td className="actions" key="actions">
      <button
        className="btn btn-default"
        onClick={actions.onLess.bind(this, id)}
        disabled={lessDisable}
        aria-label="lessDisable"
      >
        <i className="fa fa-minus" />
      </button>
      <span style={style}>{value}</span>
      <button
        className="btn btn-default"
        onClick={actions.onMore.bind(this, id)}
        disabled={moreDisable}
        aria-label="moreDisable"
      >
        <i className="fa fa-plus" />
      </button>
    </td>
  );
}

export default OccupancyActionsTableCell;
