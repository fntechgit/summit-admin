import React from "react";
import PropTypes from "prop-types";
import { useField } from "formik";
import SummitAddonSelect from "../summit-addon-select";

const MuiFormikSummitAddonSelect = ({
  name,
  summitId,
  placeholder = "Select..."
}) => {
  const [field, meta, helpers] = useField(name);

  return (
    <SummitAddonSelect
      value={field.value || ""}
      summitId={summitId}
      onChange={helpers.setValue}
      placeholder={placeholder}
      inputProps={{
        error: meta.touched && Boolean(meta.error),
        helperText: meta.touched && meta.error
      }}
    />
  );
};

MuiFormikSummitAddonSelect.propTypes = {
  name: PropTypes.string.isRequired,
  summitId: PropTypes.number.isRequired,
  placeholder: PropTypes.string
};

export default MuiFormikSummitAddonSelect;
