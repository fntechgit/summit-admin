import React, { useEffect } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import T from "i18n-react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { getAllSummits } from "../../actions/summit-actions";

const SummitsDropdown = ({
  onlyActive = false,
  label = "Search by show",
  onChange,
  summits,
  getAllSummits
}) => {
  useEffect(() => {
    if (summits.length === 0) {
      getAllSummits(onlyActive);
    }
  }, []);

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        label={T.translate("general.select_summit")}
        fullWidth
        variant="outlined"
        onChange={(ev) => onChange(ev.target.value)}
      >
        {summits.map((s) => (
          <MenuItem key={`summits-ddl-${s.id}`} value={s.id}>
            {s.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

SummitsDropdown.propTypes = {
  onChange: PropTypes.func.isRequired
};

const mapStateToProps = ({ directoryState }) => ({
  summits: directoryState.allSummits
});

export default connect(mapStateToProps, {
  getAllSummits
})(SummitsDropdown);
