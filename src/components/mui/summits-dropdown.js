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
  excludeSummitIds = [],
  getAllSummits
}) => {
  useEffect(() => {
    if (summits.length === 0) {
      getAllSummits(onlyActive);
    }
  }, []);

  const summitOptions = summits.filter(
    (s) => excludeSummitIds.indexOf(s.id) === -1
  );

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        label={T.translate("general.select_summit")}
        fullWidth
        variant="outlined"
        onChange={(ev) => onChange(ev.target.value)}
      >
        {summitOptions.map((s) => (
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
