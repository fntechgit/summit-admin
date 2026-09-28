import React, { useEffect, useState } from "react";
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
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikSwitch from "openstack-uicore-foundation/lib/components/mui/formik-inputs/switch";
import MuiFormikDropdownCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/dropdown-checkbox";
import SortableTable from "openstack-uicore-foundation/lib/components/table-sortable";
import DragAndDropList from "../../../components/mui/dnd-list";
import FormikTextEditor from "../../../components/inputs/formik-text-editor";
import useScrollToError from "../../../hooks/useScrollToError";
import history from "../../../history";
import {
  ExtraQuestionsTypeAllowSubQuestion,
  INT_BASE
} from "../../../utils/constants";

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

// Google Forms shows the answer control beside each option; these are decorative.
const OptionGlyph = ({ type }) =>
  type === "CheckBoxList" ? (
    <CheckBoxOutlineBlankIcon sx={{ color: "text.disabled" }} />
  ) : (
    <RadioButtonUncheckedIcon sx={{ color: "text.disabled" }} />
  );

// Options persist one at a time through the values endpoints, exactly as the
// legacy modal did — the only change is that blur replaces a Save button.
const OptionRow = ({ option, type, onSave, onDelete }) => {
  const [label, setLabel] = useState(option.label || "");
  const [value, setValue] = useState(option.value || "");

  useEffect(() => {
    setLabel(option.label || "");
    setValue(option.value || "");
  }, [option.label, option.value]);

  const saveIfChanged = () => {
    if (label === option.label && value === option.value) return;
    onSave({ ...option, label, value });
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
      <DragIndicatorIcon sx={{ color: "text.disabled" }} />
      <OptionGlyph type={type} />
      <TextField
        variant="standard"
        fullWidth
        label={T.translate("question_form.visible_option")}
        value={label}
        onChange={(ev) => setLabel(ev.target.value)}
        onBlur={saveIfChanged}
      />
      <TextField
        variant="standard"
        label={T.translate("question_form.value")}
        value={value}
        onChange={(ev) => setValue(ev.target.value)}
        onBlur={saveIfChanged}
        sx={{ width: "30%" }}
      />
      <Tooltip title={T.translate("question_form.is_default")}>
        <IconButton
          aria-label={T.translate("question_form.is_default")}
          onClick={() => onSave({ ...option, is_default: !option.is_default })}
        >
          {option.is_default ? (
            <StarIcon color="primary" />
          ) : (
            <StarBorderIcon />
          )}
        </IconButton>
      </Tooltip>
      <Tooltip title={T.translate("general.delete")}>
        <IconButton
          aria-label={T.translate("general.delete")}
          onClick={() => onDelete(option.id)}
        >
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

const AddOptionRow = ({ type, onAdd }) => {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  // The API requires a value; the visible label is optional.
  const canAdd = value.trim().length > 0;

  const commit = () => {
    if (!canAdd) return;
    onAdd({ value, label });
    setValue("");
    setLabel("");
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
      <DragIndicatorIcon sx={{ visibility: "hidden" }} />
      <OptionGlyph type={type} />
      <TextField
        variant="standard"
        fullWidth
        placeholder={T.translate("question_form.add_option")}
        label={T.translate("question_form.visible_option")}
        value={label}
        onChange={(ev) => setLabel(ev.target.value)}
        onKeyDown={(ev) => ev.key === "Enter" && commit()}
      />
      <TextField
        variant="standard"
        label={T.translate("question_form.value")}
        value={value}
        onChange={(ev) => setValue(ev.target.value)}
        onKeyDown={(ev) => ev.key === "Enter" && commit()}
        sx={{ width: "30%" }}
      />
      <Tooltip title={T.translate("question_form.add_option")}>
        <span>
          <IconButton
            aria-label={T.translate("question_form.add_option")}
            disabled={!canAdd}
            onClick={commit}
          >
            <AddIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
};

const OrderExtraQuestionForm = ({
  currentSummit,
  entity,
  allClasses = [],
  onSubmit,
  onValueSave,
  onValueDelete,
  updateQuestionValueOrder,
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

  // Mirrors the legacy shouldShowField("values"): /metadata flags multi-value
  // types with values: "array", so a new API type needs no frontend change.
  const questionClass = allClasses.find((c) => c.type === formik.values.type);
  const typeHasOptions = Boolean(questionClass?.values);

  const options = [...(entity.values || [])].sort((a, b) => a.order - b.order);

  const handleOptionReorder = (reordered, result) => {
    const valueId = parseInt(result.draggableId, INT_BASE);
    const moved = reordered.find((v) => v.id === valueId);
    updateQuestionValueOrder(reordered, valueId, moved.order);
  };

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
                  {allClasses.map((questionType) => (
                    <MenuItem key={questionType.type} value={questionType.type}>
                      {humanizeType(questionType.type)}
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

            {typeHasOptions && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                {isNew ? (
                  <Typography color="text.secondary">
                    {T.translate("question_form.save_to_add_values")}
                  </Typography>
                ) : (
                  <>
                    <DragAndDropList
                      items={options}
                      onReorder={handleOptionReorder}
                      droppableId="question-options"
                      renderItem={(option) => (
                        <OptionRow
                          option={option}
                          type={formik.values.type}
                          onSave={onValueSave}
                          onDelete={onValueDelete}
                        />
                      )}
                    />
                    <AddOptionRow
                      type={formik.values.type}
                      onAdd={onValueSave}
                    />
                  </>
                )}
              </Box>
            )}

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
