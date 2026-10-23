import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react";
import { InputLabel, MenuItem } from "@mui/material";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikAsyncAutocomplete from "openstack-uicore-foundation/lib/components/mui/formik-inputs/async-select";
import CompanyInputMUI from "openstack-uicore-foundation/lib/components/mui/formik-inputs/company-input";
import {
  querySpeakers,
  queryTags
} from "openstack-uicore-foundation/lib/utils/query-actions";
import { FILTER_TYPES } from "../../../actions/schedule-settings-actions";

const LEVELS = ["N/A", "Beginner", "Intermediate", "Advanced"];

const toOptions = (items = []) =>
  items.map((it) => ({ value: it.id, label: it.name }));

// pre-filter tags are stored by name, and summit-scoped queryTags nests the tag
const tagFormatOption = (item) => {
  const tag = typeof item.tag === "string" ? item.tag : item.tag?.tag;
  return { value: tag, label: tag };
};

export const speakerLabel = (speaker) =>
  [speaker.first_name, speaker.last_name].filter(Boolean).join(" ");

const speakerFormatOption = (item) => ({
  value: item.id.toString(),
  label: speakerLabel(item)
});

const getSelectConfig = (type, summit) => {
  switch (type) {
    case FILTER_TYPES.track:
      return { label: "track", options: toOptions(summit.tracks) };
    case FILTER_TYPES.track_groups:
      return { label: "track_groups", options: toOptions(summit.track_groups) };
    case FILTER_TYPES.venues:
      return { label: "locations", options: toOptions(summit.locations) };
    case FILTER_TYPES.level:
      return {
        label: "levels",
        options: LEVELS.map((l) => ({ value: l, label: l }))
      };
    case FILTER_TYPES.event_types:
      return { label: "event_types", options: toOptions(summit.event_types) };
    default:
      return null;
  }
};

const PreFilterInput = ({ name, type, summit, disabled = false }) => {
  const fieldName = `${name}.values`;
  const selectConfig = getSelectConfig(type, summit);

  const renderLabel = (key) => (
    <InputLabel htmlFor={fieldName}>
      {T.translate(`edit_schedule_settings.${key}`)}
    </InputLabel>
  );

  if (selectConfig) {
    const { label, options } = selectConfig;
    // stored ids may be strings while options are numbers, match loosely
    const optionLabel = (value) =>
      options.find((o) => String(o.value) === String(value))?.label ?? value;

    return (
      <>
        {renderLabel(label)}
        <MuiFormikSelect
          name={fieldName}
          multiple
          disabled={disabled}
          renderValue={(selected) => selected.map(optionLabel).join(", ")}
        >
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </MuiFormikSelect>
      </>
    );
  }

  switch (type) {
    case FILTER_TYPES.tags:
      return (
        <>
          {renderLabel("tags")}
          <MuiFormikAsyncAutocomplete
            name={fieldName}
            isMulti
            disabled={disabled}
            queryFunction={(input, callback) =>
              queryTags(summit.id, input, callback)
            }
            formatOption={tagFormatOption}
          />
        </>
      );
    case FILTER_TYPES.company:
      return (
        <>
          {renderLabel("companies")}
          <CompanyInputMUI name={fieldName} isMulti disabled={disabled} />
        </>
      );
    case FILTER_TYPES.speakers:
      return (
        <>
          {renderLabel("speakers")}
          <MuiFormikAsyncAutocomplete
            name={fieldName}
            isMulti
            disabled={disabled}
            queryFunction={(input, callback) =>
              querySpeakers(summit.id, input, callback)
            }
            formatOption={speakerFormatOption}
          />
        </>
      );
    default:
      return null;
  }
};

PreFilterInput.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  summit: PropTypes.object.isRequired,
  disabled: PropTypes.bool
};

export default PreFilterInput;
