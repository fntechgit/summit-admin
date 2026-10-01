import React from "react";
import { withRouter } from "react-router-dom";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import T from "i18n-react";

function AddNewButtonMui({ entity, history }) {
  if (!entity?.id) return null;

  const handleClick = () => {
    history.push("new");
  };

  return (
    <Button
      variant="contained"
      onClick={handleClick}
      startIcon={<AddIcon />}
      sx={{ float: "right" }}
    >
      {T.translate("general.add_new")}
    </Button>
  );
}

export default withRouter(AddNewButtonMui);
