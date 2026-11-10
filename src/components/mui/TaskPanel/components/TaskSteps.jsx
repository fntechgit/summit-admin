import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Link as RouterLink } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Link as MuiLink,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GUIDES, { doneStepCount, isStepDone, stepKeys } from "../guides";

const TaskSteps = ({ task, onToggle, onBack }) => {
  const guide = GUIDES.find(({ id }) => id === task.guide);
  // null follows the next unticked step; false keeps every step closed
  const [expanded, setExpanded] = useState(null);
  const text = (key) => T.translate(`task_panel.guides.${guide.id}.${key}`);

  const nextStep = guide.steps.find((step) => !isStepDone(step, task.done));
  const openId = expanded ?? nextStep?.id;

  const handleStepTick = (step, checked) => {
    onToggle(stepKeys(step), checked);
    setExpanded(null);
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton
          onClick={onBack}
          aria-label={T.translate("task_panel.back")}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography sx={{ fontWeight: 600 }}>{task.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {T.translate("task_panel.progress", {
              done: doneStepCount(guide.steps, task.done),
              total: guide.steps.length
            })}
          </Typography>
        </Box>
      </Box>
      {guide.steps.map((step, index) => {
        const keys = stepKeys(step);
        const tickedCount = keys.filter((key) => task.done[key]).length;
        const title = text(`steps.${step.id}`);
        return (
          <Accordion
            key={step.id}
            disableGutters
            elevation={0}
            expanded={openId === step.id}
            onChange={() => setExpanded(openId === step.id ? false : step.id)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Checkbox
                size="small"
                checked={tickedCount === keys.length}
                indeterminate={tickedCount > 0 && tickedCount < keys.length}
                // keep the tick from also opening or closing the step
                onClick={(ev) => ev.stopPropagation()}
                onChange={(ev) => handleStepTick(step, ev.target.checked)}
                inputProps={{ "aria-label": title }}
                sx={{ p: 0, mr: 1 }}
              />
              <Typography>
                {index + 1}. {title}
                {step.optional && (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    {` (${T.translate("task_panel.optional")})`}
                  </Typography>
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {step.substeps?.map((substep) => {
                const key = `${step.id}.${substep}`;
                return (
                  <FormControlLabel
                    key={key}
                    sx={{ display: "flex" }}
                    control={
                      <Checkbox
                        size="small"
                        checked={!!task.done[key]}
                        onChange={(ev) => onToggle([key], ev.target.checked)}
                      />
                    }
                    label={text(`substeps.${step.id}.${substep}`)}
                  />
                );
              })}
              {step.link && (
                <MuiLink component={RouterLink} to={step.link(task.summitId)}>
                  {T.translate("task_panel.go_to_page")}
                </MuiLink>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};

TaskSteps.propTypes = {
  task: PropTypes.shape({
    name: PropTypes.string.isRequired,
    guide: PropTypes.string.isRequired,
    summitId: PropTypes.number.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    done: PropTypes.object.isRequired
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired
};

export default TaskSteps;
