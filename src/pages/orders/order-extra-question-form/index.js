import React from "react";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid2,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikSwitch from "openstack-uicore-foundation/lib/components/mui/formik-inputs/switch";
import MuiFormikDropdownCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/dropdown-checkbox";
import SortableTable from "openstack-uicore-foundation/lib/components/table-sortable";
import FormikTextEditor from "../../../components/inputs/formik-text-editor";
import useScrollToError from "../../../hooks/useScrollToError";
import history from "../../../history";
import { ExtraQuestionsTypeAllowSubQuestion } from "../../../utils/constants";

// A Google Forms style question card keeps the title visually light, so the
// editor is cut back from the default toolbar to basic formatting.
const LABEL_EDITOR_OPTIONS = {
  buttons: ["bold", "italic", "underline", "link", "|", "source"],
  toolbarAdaptive: false,
  statusbar: false
};

const QUESTION_USAGES = ["Order", "Ticket", "Both"];

const PLACEHOLDER_TYPES = ["Text", "TextArea"];

// "CheckBoxList" -> "Check Box List"
const humanizeType = (type) => type.split(/(?=[A-Z])/).join(" ");

const toIds = (collection = []) =>
  collection.map((item) => (item?.id !== undefined ? item.id : item));

const OrderExtraQuestionForm = ({
  currentSummit,
  entity,
  allClasses = [],
  onSubmit,
  onRuleDelete,
  updateSubQuestionRuleOrder
}) => {
  const formik = useFormik({
    initialValues: {
      type: entity.type,
      name: entity.name,
      label: entity.label,
      usage: entity.usage,
      mandatory: entity.mandatory,
      printable: entity.printable,
      placeholder: entity.placeholder,
      max_selected_values: entity.max_selected_values,
      allowed_ticket_types: toIds(entity.allowed_ticket_types),
      allowed_badge_features_types: toIds(entity.allowed_badge_features_types)
    },
    enableReinitialize: true,
    // Merge over the entity so id, summit_id, values, sub_question_rules and
    // external_id survive the round trip — the card only edits scalar fields.
    onSubmit: (values) => onSubmit({ ...entity, ...values })
  });

  useScrollToError(formik);

  const isNew = entity.id === 0;
  const showsPlaceholder = PLACEHOLDER_TYPES.includes(formik.values.type);
  const showsMaxSelected = formik.values.type === "CheckBoxList";
  const showsSubRules =
    !isNew && ExtraQuestionsTypeAllowSubQuestion.includes(entity.type);

  const ticketTypeOptions = (currentSummit.ticket_types || []).map((tt) => ({
    label: tt.name,
    value: tt.id
  }));

  const badgeFeatureOptions = (currentSummit.badge_features || []).map((f) => ({
    label: f.name,
    value: f.id
  }));

  const subRuleColumns = [
    {
      columnKey: "value",
      value: T.translate("question_form.sub_question_condition"),
      render: (rule) => {
        const answers = (entity.values || [])
          .filter((v) => rule.answer_values.includes(`${v.id}`))
          .map((v) => v.value);
        const joined =
          answers.length > 1
            ? answers.join(` ${rule.answer_values_operator} `)
            : answers.join("");
        return `${
          rule.visibility_condition === "NotEqual" ? "Not Equal" : "Equal"
        } to ${joined}`;
      }
    },
    {
      columnKey: "label",
      value: T.translate("question_form.sub_question_rule"),
      render: (rule) =>
        `${rule.visibility === "Visible" ? "Show" : "Not Show"} ${
          rule.sub_question.name
        }`
    }
  ];

  const subRulesUrl = `/app/summits/${entity.summit_id}/order-extra-questions/${entity.id}/sub-rule`;

  return (
    <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit}>
        <Card elevation={2} sx={{ borderLeft: 4, borderColor: "primary.main" }}>
          <CardContent>
            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12, md: 8 }}>
                <FormikTextEditor name="label" options={LABEL_EDITOR_OPTIONS} />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <MuiFormikSelect
                  name="type"
                  label={T.translate("question_form.question_type")}
                  placeholder={T.translate(
                    "question_form.placeholders.select_type"
                  )}
                  disabled={!isNew}
                  renderValue={(value) => (value ? humanizeType(value) : "")}
                >
                  {allClasses.map((questionClass) => (
                    <MenuItem
                      key={questionClass.type}
                      value={questionClass.type}
                    >
                      {humanizeType(questionClass.type)}
                    </MenuItem>
                  ))}
                </MuiFormikSelect>
              </Grid2>

              {showsPlaceholder && (
                <Grid2 size={12}>
                  <MuiFormikTextField
                    name="placeholder"
                    label={T.translate("question_form.hint")}
                  />
                </Grid2>
              )}

              {showsMaxSelected && (
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <MuiFormikTextField
                    name="max_selected_values"
                    type="number"
                    label={T.translate("question_form.max_selected_values")}
                  />
                </Grid2>
              )}
            </Grid2>

            <Accordion elevation={0} disableGutters sx={{ mt: 3 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                <Typography color="text.secondary">
                  {T.translate("question_form.advanced")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                <Grid2 container spacing={3}>
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <MuiFormikTextField
                      name="name"
                      label={T.translate("question_form.question_id")}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <MuiFormikSelect
                      name="usage"
                      label={T.translate("question_form.usage")}
                      placeholder={T.translate(
                        "question_form.placeholders.select_usage"
                      )}
                    >
                      {QUESTION_USAGES.map((usage) => (
                        <MenuItem key={usage} value={usage}>
                          {usage}
                        </MenuItem>
                      ))}
                    </MuiFormikSelect>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <MuiFormikDropdownCheckbox
                      name="allowed_ticket_types"
                      label={T.translate("question_form.allowed_ticket_types")}
                      placeholder={T.translate(
                        "question_form.allowed_ticket_types_info"
                      )}
                      options={ticketTypeOptions}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <MuiFormikDropdownCheckbox
                      name="allowed_badge_features_types"
                      label={T.translate(
                        "question_form.allowed_badge_features_types"
                      )}
                      placeholder={T.translate(
                        "question_form.allowed_badge_features_types_info"
                      )}
                      options={badgeFeatureOptions}
                    />
                  </Grid2>
                </Grid2>
              </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={4} justifyContent="flex-end">
              <MuiFormikSwitch
                name="mandatory"
                label={T.translate("question_form.mandatory")}
              />
              <MuiFormikSwitch
                name="printable"
                label={T.translate("question_form.printable")}
              />
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button type="submit" variant="contained">
            {T.translate("general.save")}
          </Button>
        </Box>
      </form>

      {showsSubRules && (
        <Box sx={{ mt: 4 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">
              {T.translate("question_form.sub_questions_rules")}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => history.push(`${subRulesUrl}/new`)}
            >
              {T.translate("question_form.sub_questions_rules_add")}
            </Button>
          </Stack>

          {entity.sub_question_rules.length === 0 ? (
            <Typography color="text.secondary">
              {T.translate("question_form.no_sub_questions_rules")}
            </Typography>
          ) : (
            <SortableTable
              options={{
                actions: {
                  edit: {
                    onClick: (ruleId) =>
                      history.push(`${subRulesUrl}/${ruleId}`)
                  },
                  delete: { onClick: onRuleDelete }
                }
              }}
              data={entity.sub_question_rules}
              columns={subRuleColumns}
              dropCallback={updateSubQuestionRuleOrder}
              orderField="order"
            />
          )}
        </Box>
      )}
    </FormikProvider>
  );
};

export default OrderExtraQuestionForm;
