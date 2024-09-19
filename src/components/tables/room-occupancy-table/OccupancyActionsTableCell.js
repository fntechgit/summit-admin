import React from "react";

function OccupancyActionsTableCell({ row, actions, id, value }) {
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
    if (value === "OVERFLOW" && actions.onOverflow) {
      return (
        <button
          className="btn btn-danger"
          style={{ margin: "0 10px" }}
          onClick={() => actions.onOverflow(row)}
        >
          OVERFLOW
        </button>
      );
    }

    return <span style={style}>{value}</span>;
  };

  const handleMore = () => {
    if (value === "FULL" && actions.onOverflow) {
      actions.onOverflow(row);
    } else {
      actions.onMore(id);
    }
  };

  return (
    <td className="actions" key="actions">
      <button
        className="btn btn-default"
        onClick={() => actions.onLess(id)}
        disabled={lessDisable}
      >
        <i className="fa fa-minus" />
      </button>
      {state()}
      <button
        className="btn btn-default"
        onClick={handleMore}
        disabled={moreDisable}
      >
        <i className="fa fa-plus" />
      </button>
    </td>
  );
}

export default OccupancyActionsTableCell;
