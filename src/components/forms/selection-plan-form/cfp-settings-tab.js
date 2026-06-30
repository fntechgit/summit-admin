/**
 * Copyright 2017 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid2 from "@mui/material/Grid2";
import MuiSwitch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import {
  DEFAULT_ALLOWED_EDITABLE_QUESTIONS,
  DEFAULT_ALLOWED_QUESTIONS,
  DEFAULT_CFP_PRESENTATION_EDITION_TABS
} from "../../../reducers/selection_plans/selection-plan-reducer";

function renderAllowedQuestionsInput(params) {
  const placeholder = T.translate(
    "edit_selection_plan.placeholders.allowed_presentation_questions"
  );
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <TextField {...params} size="small" placeholder={placeholder} />;
}

function renderAllowedEditableQuestionsInput(params) {
  const placeholder = T.translate(
    "edit_selection_plan.placeholders.allowed_presentation_editable_questions"
  );
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <TextField {...params} size="small" placeholder={placeholder} />;
}

function renderDefaultTabInput(params) {
  const placeholder = T.translate(
    "edit_selection_plan.placeholders.cfp_presentation_edition_default_tab"
  );
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <TextField {...params} size="small" placeholder={placeholder} />;
}

const CfpSettingsTab = ({ hidden, currentSummit }) => {
  const { values, errors, setFieldValue } = useFormikContext();

  const hasErrors = (field) => errors[field] ?? "";

  const handleChange = (ev) => {
    const { id, value } = ev.target;
    if (id.startsWith("cfp_")) {
      const current = values.marketing_settings[id] || {};
      setFieldValue(`marketing_settings.${id}`, { ...current, value });
    } else {
      setFieldValue(id, value);
    }
  };

  const handleSwitchChange = (setting, value) => {
    const current = values.marketing_settings[setting] || {};
    setFieldValue(`marketing_settings.${setting}`, { ...current, value });
  };

  const ms = values.marketing_settings;

  return (
    <div role="tabpanel" id="tabpanel-cfp_settings" hidden={hidden}>
      <Box sx={{ pt: 2 }}>
        <Grid2 container spacing={2}>
          <Grid2 size={12}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              {T.translate(
                "edit_selection_plan.cfp_presentation_edition_custom_message"
              )}
              &nbsp;
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate(
                  "edit_selection_plan.cfp_presentation_edition_custom_message_info"
                )}
              />
            </label>
            <TextEditorV3
              id="cfp_presentation_edition_custom_message"
              error={hasErrors("cfp_presentation_edition_custom_message")}
              onChange={handleChange}
              value={ms.cfp_presentation_edition_custom_message?.value || ""}
              license={process.env.JODIT_LICENSE_KEY}
            />
          </Grid2>
          <Grid2 size={12}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              {T.translate(
                "edit_selection_plan.allowed_presentation_questions"
              )}
            </label>
            <Autocomplete
              multiple
              size="small"
              options={DEFAULT_ALLOWED_QUESTIONS}
              getOptionLabel={(opt) => opt.label}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              value={DEFAULT_ALLOWED_QUESTIONS.filter((opt) =>
                (values.allowed_presentation_questions || []).includes(
                  opt.value
                )
              )}
              onChange={(_, selected) =>
                setFieldValue(
                  "allowed_presentation_questions",
                  selected.map((opt) => opt.value)
                )
              }
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  return (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      key={key}
                      {...tagProps}
                    />
                  );
                })
              }
              renderInput={renderAllowedQuestionsInput}
            />
          </Grid2>
          <Grid2 size={12}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              {T.translate(
                "edit_selection_plan.allowed_presentation_editable_questions"
              )}{" "}
              *
            </label>
            <Autocomplete
              multiple
              size="small"
              options={DEFAULT_ALLOWED_EDITABLE_QUESTIONS}
              getOptionLabel={(opt) => opt.label}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              value={DEFAULT_ALLOWED_EDITABLE_QUESTIONS.filter((opt) =>
                (values.allowed_presentation_editable_questions || []).includes(
                  opt.value
                )
              )}
              onChange={(_, selected) =>
                setFieldValue(
                  "allowed_presentation_editable_questions",
                  selected.map((opt) => opt.value)
                )
              }
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  return (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      key={key}
                      {...tagProps}
                    />
                  );
                })
              }
              renderInput={renderAllowedEditableQuestionsInput}
            />
          </Grid2>
          <Grid2 size={12}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              {T.translate(
                "edit_selection_plan.cfp_presentation_edition_default_tab"
              )}
            </label>
            <Autocomplete
              size="small"
              options={DEFAULT_CFP_PRESENTATION_EDITION_TABS}
              getOptionLabel={(opt) => opt.label}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              value={
                DEFAULT_CFP_PRESENTATION_EDITION_TABS.find(
                  (opt) =>
                    opt.value === ms.cfp_presentation_edition_default_tab?.value
                ) || null
              }
              onChange={(_, selected) =>
                handleSwitchChange(
                  "cfp_presentation_edition_default_tab",
                  selected ? selected.value : ""
                )
              }
              renderInput={renderDefaultTabInput}
            />
          </Grid2>

          {[
            ["cfp_landing_page_title", "cfp_landing_page_title_info"],
            ["cfp_track_question_label", "cfp_track_question_label_info"],
            ["cfp_speakers_singular_label", "cfp_speakers_singular_label_info"],
            ["cfp_speakers_plural_label", "cfp_speakers_plural_label_info"],
            [
              "cfp_presentations_singular_label",
              "cfp_presentations_singular_label_info"
            ],
            [
              "cfp_presentations_plural_label",
              "cfp_presentations_plural_label_info"
            ],
            [
              "cfp_presentation_summary_title_label",
              "cfp_presentation_summary_title_label_info"
            ],
            [
              "cfp_presentation_summary_abstract_label",
              "cfp_presentation_summary_abstract_label_info"
            ],
            [
              "cfp_presentation_summary_social_summary_label",
              "cfp_presentation_summary_social_summary_label_info"
            ],
            [
              "cfp_presentation_summary_links_label",
              "cfp_presentation_summary_links_label_info"
            ]
          ].map(([field, infoKey]) => (
            <Grid2 key={field} size={{ xs: 12, md: 6 }}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label>
                {T.translate(`edit_selection_plan.${field}`)}
                &nbsp;
                <i
                  className="fa fa-info-circle"
                  aria-hidden="true"
                  title={T.translate(`edit_selection_plan.${infoKey}`)}
                />
              </label>
              <TextField
                id={field}
                fullWidth
                size="small"
                error={!!hasErrors(field)}
                helperText={hasErrors(field) || undefined}
                onChange={handleChange}
                value={ms[field]?.value || ""}
              />
            </Grid2>
          ))}

          {[
            [
              "cfp_presentation_summary_hide_track_selection",
              "cfp_presentation_summary_hide_track_selection_info"
            ],
            [
              "cfp_presentation_summary_hide_activity_type_selection",
              "cfp_presentation_summary_hide_activity_type_selection_info"
            ]
          ].map(([field, infoKey]) => (
            <Grid2 key={field} size={{ xs: 12, md: 6 }}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label>
                {T.translate(`edit_selection_plan.${field}`)}
                &nbsp;
                <i
                  className="fa fa-info-circle"
                  aria-hidden="true"
                  title={T.translate(`edit_selection_plan.${infoKey}`)}
                />
              </label>
              <br />
              <MuiSwitch
                checked={ms[field]?.value || false}
                onChange={(ev) => handleSwitchChange(field, ev.target.checked)}
              />
            </Grid2>
          ))}

          {window.CFP_APP_BASE_URL && (
            <>
              <Grid2 size={{ xs: 12, md: 6 }}>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>
                  {T.translate(
                    "edit_selection_plan.cfp_presentation_selection_plan_link"
                  )}
                </label>
                <br />
                <a
                  className="text-table-link"
                  href={`${window.CFP_APP_BASE_URL}/app/${currentSummit.slug}/all-plans/${values.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {`${window.CFP_APP_BASE_URL}/app/${currentSummit.slug}/all-plans/${values.id}`}
                </a>
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>
                  {T.translate(
                    "edit_selection_plan.cfp_presentation_all_selection_plan_link"
                  )}
                </label>
                <br />
                <a
                  className="text-table-link"
                  href={`${window.CFP_APP_BASE_URL}/app/${currentSummit.slug}/all-plans`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {`${window.CFP_APP_BASE_URL}/app/${currentSummit.slug}/all-plans`}
                </a>
              </Grid2>
            </>
          )}
        </Grid2>
      </Box>
    </div>
  );
};

CfpSettingsTab.propTypes = {
  hidden: PropTypes.bool.isRequired,
  currentSummit: PropTypes.shape({
    slug: PropTypes.string
  }).isRequired
};

export default CfpSettingsTab;
