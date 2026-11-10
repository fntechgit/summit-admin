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
  ListItemText,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import NewTaskForm from "./components/NewTaskForm";

export const PANEL_WIDTH = 360;

const TaskPanel = ({ open, onClose, paperSx }) => {
  // kept here, outside the drawer's content, so tasks survive closing the panel
  const [tasks, setTasks] = useState([]);
  const [creating, setCreating] = useState(false);

  const handleCreate = ({ guide, name }) => {
    setTasks((prev) => [...prev, { id: Date.now(), guide, name }]);
    setCreating(false);
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
        {creating ? (
          <NewTaskForm
            onCreate={handleCreate}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreating(true)}
            >
              {T.translate("task_panel.new_task")}
            </Button>
            {tasks.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {T.translate("task_panel.no_tasks")}
              </Typography>
            ) : (
              <List>
                {tasks.map((task) => (
                  <ListItem key={task.id} disableGutters>
                    <ListItemText
                      primary={task.name}
                      secondary={T.translate(`task_panel.guides.${task.guide}`)}
                    />
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
  // eslint-disable-next-line react/forbid-prop-types
  paperSx: PropTypes.object
};

TaskPanel.defaultProps = {
  paperSx: {}
};

export default TaskPanel;
