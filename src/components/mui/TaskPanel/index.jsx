import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import NewTaskForm from "./components/NewTaskForm";
import TaskSteps from "./components/TaskSteps";
import GUIDES, { doneStepCount } from "./guides";

export const PANEL_WIDTH = 360;

const TaskPanel = ({ open, onClose, summit, paperSx }) => {
  // kept here, outside the drawer's content, so tasks survive closing the panel
  const [tasks, setTasks] = useState([]);
  const [creating, setCreating] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);

  const openTask = tasks.find((task) => task.id === openTaskId);

  const handleCreate = ({ guide, name }) => {
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        guide,
        name,
        summitId: summit.id,
        summitName: summit.name,
        done: {}
      }
    ]);
    setCreating(false);
  };

  const handleCloseTask = () => {
    setTasks((prev) => prev.filter((task) => task.id !== openTaskId));
    setOpenTaskId(null);
  };

  const handleToggle = (keys, checked) => {
    const changes = Object.fromEntries(keys.map((key) => [key, checked]));
    setTasks((prev) =>
      prev.map((task) =>
        task.id === openTaskId
          ? { ...task, done: { ...task.done, ...changes } }
          : task
      )
    );
  };

  const progress = (task) => {
    const { steps } = GUIDES.find(({ id }) => id === task.guide);
    return `${doneStepCount(steps, task.done)}/${steps.length}`;
  };

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      sx={{
        "& .MuiDrawer-paper": {
          width: PANEL_WIDTH,
          boxSizing: "border-box",
          ...paperSx
        }
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5
        }}
      >
        <Typography variant="h6" component="h2">
          {T.translate("task_panel.my_tasks")}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label={T.translate("task_panel.close")}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ px: 2 }}>
        {openTask && (
          <TaskSteps
            task={openTask}
            onToggle={handleToggle}
            onBack={() => setOpenTaskId(null)}
            onCloseTask={handleCloseTask}
          />
        )}
        {!openTask && creating && (
          <NewTaskForm
            onCreate={handleCreate}
            onCancel={() => setCreating(false)}
          />
        )}
        {!openTask && !creating && (
          <>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              // a task's links point at the show it was created in
              disabled={!summit?.id}
              onClick={() => setCreating(true)}
            >
              {T.translate("task_panel.new_task")}
            </Button>
            {!summit?.id && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {T.translate("task_panel.select_show")}
              </Typography>
            )}
            {tasks.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {T.translate("task_panel.no_tasks")}
              </Typography>
            ) : (
              <List>
                {tasks.map((task) => (
                  <ListItem key={task.id} disablePadding>
                    <ListItemButton onClick={() => setOpenTaskId(task.id)}>
                      <ListItemText
                        primary={task.name}
                        secondary={`${task.summitName} · ${T.translate(
                          `task_panel.guides.${task.guide}.name`
                        )} · ${progress(task)}`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};

TaskPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  summit: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  }),
  // eslint-disable-next-line react/forbid-prop-types
  paperSx: PropTypes.object
};

TaskPanel.defaultProps = {
  summit: null,
  paperSx: {}
};

export default TaskPanel;
