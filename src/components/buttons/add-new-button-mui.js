import React from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import T from "i18n-react";

const AddNewButton = ({ onClick }) => (
  <Button
    variant="contained"
    onClick={onClick}
    startIcon={<AddIcon />}
    sx={{ float: "right" }}
  >
    {T.translate("general.add_new")}
  </Button>
);

AddNewButton.propTypes = {
  onClick: PropTypes.func.isRequired
};

export default AddNewButton;
