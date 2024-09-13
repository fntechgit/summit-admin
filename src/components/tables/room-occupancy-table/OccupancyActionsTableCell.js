import React from "react";

function OccupancyActionsTableCell({ actions, id, value }) {
  const style = {
    marginLeft: "10px",
    marginRight: "10px",
    width: "103px",
    display: "inline-block",
    textAlign: "center"
  };

  const lessDisable = value === "EMPTY";
  const moreDisable = value === "OVERFLOW";

  const state = () => {
    if (value === "OVERFLOW" && actions.setOverflowStream) {
      return (
        <button
          className="btn btn-danger"
          style={{ margin: "0 10px" }}
          onClick={actions.setOverflowStream}
        >
          OVERFLOW
        </button>
      );
    }

    return <span style={style}>{value}</span>;
  };

  return (
    <td className="actions" key="actions">
      <button
        className="btn btn-default"
        onClick={actions.onLess.bind(this, id)}
        disabled={lessDisable}
      >
        <i className="fa fa-minus" />
      </button>
      {state()}
      <button
        className="btn btn-default"
        onClick={actions.onMore.bind(this, id)}
        disabled={moreDisable}
      >
        <i className="fa fa-plus" />
      </button>
    </td>
  );
}

export default OccupancyActionsTableCell;
