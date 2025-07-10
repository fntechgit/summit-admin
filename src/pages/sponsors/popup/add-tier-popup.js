import React, { useState, useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  Grid2,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Box
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import SponsorshipTypeInputMUI from "../../../components/inputs/sponsorship-input-mui";

const AddTierDialog = ({ open, onClose, onSave, entity: initialEntity }) => {
  const [entity, setEntity] = useState({
    id: null,
    type: "",
    widget_title: "",
    lobby_template: "",
    expo_hall_template: "",
    event_page_template: "",
    sponsor_page_template: "",
    sponsor_page_use_disqus_widget: false,
    should_display_on_expo_hall_page: false,
    sponsor_page_use_schedule_widget: false,
    sponsor_page_use_banner_widget: false,
    sponsor_page_use_live_event_widget: false,
    should_display_on_lobby_page: false
  });

  useEffect(() => {
    console.log("check initial", initialEntity);
  }, []);

  const handleClose = () => {
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntity({ ...entity, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setEntity({ ...entity, [name]: checked });
  };

  const handleOnSave = () => {
    onSave(entity);
  };

  // handleUploadBadgeImage = (file) => {
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   onBadgeImageAttach(entity, formData);
  // }

  // handleRemoveBadgeImage = () => {
  //   const newEntity = { ...entity };
  //   newEntity["badge_image"] = "";
  //   setEntity(newEntity)
  //   onBadgeImageRemove(entity.id);
  // }

  const lobby_template_ddl = [
    { label: "Big Images", value: "big-images" },
    { label: "Small Images", value: "small-images" },
    { label: "Horizontal Images", value: "horizontal-images" },
    { label: "Carousel", value: "carousel" }
  ];

  const expo_hall_template_ddl = [
    { label: "Big Images", value: "big-images" },
    { label: "Medium Images", value: "medium-images" },
    { label: "Small Images", value: "small-images" }
  ];

  const sponsor_page_template_ddl = [
    { label: "Big Header", value: "big-header" },
    { label: "Small Header", value: "small-header" }
  ];

  const event_page_template_ddl = [
    { label: "Big Images", value: "big-images" },
    { label: "Small Images", value: "small-images" },
    { label: "Horizontal Images", value: "horizontal-images" }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">
          {`${entity.id ? "Edit" : "Add"} ${T.translate(
            "edit_summit_sponsorship.sponsorship"
          )}`}
        </Typography>
        <IconButton size="small" onClick={() => handleClose()} sx={{ mr: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <Grid2 container spacing={2} size={12} sx={{ p: 2 }}>
          <Grid2
            container
            spacing={2}
            size={12}
            sx={{ alignItems: "baseline" }}
          >
            <Grid2
              container
              spacing={0}
              size={6}
              sx={{ alignItems: "baseline" }}
            >
              <InputLabel htmlFor="type">
                {T.translate("edit_summit_sponsorship.sponsorship_type")}
              </InputLabel>
              <Box width="100%">
                <SponsorshipTypeInputMUI
                  id="type"
                  name="type"
                  value={entity.type}
                  placeholder={T.translate(
                    "edit_sponsor.placeholders.sponsorship_type"
                  )}
                  onChange={handleChange}
                />
              </Box>
            </Grid2>
            <Grid2
              container
              spacing={0}
              size={6}
              sx={{ alignItems: "baseline" }}
            >
              <InputLabel htmlFor="widget_title">
                {T.translate("edit_summit_sponsorship.widget_title")}
              </InputLabel>
              <TextField
                name="widget_title"
                variant="outlined"
                value={entity.widget_title}
                onChange={handleChange}
                placeholder={T.translate(
                  "edit_summit_sponsorship.placeholders.widget_title"
                )}
                fullWidth
              />
            </Grid2>
          </Grid2>
          <Grid2
            container
            spacing={2}
            size={12}
            sx={{ alignItems: "baseline" }}
          >
            <Grid2
              container
              spacing={0}
              size={6}
              sx={{ alignItems: "baseline" }}
            >
              <InputLabel htmlFor="lobby_template">
                {T.translate("edit_summit_sponsorship.lobby_template")}
              </InputLabel>
              <Select
                value={entity.lobby_template}
                name="lobby_template"
                fullWidth
                onChange={handleChange}
                IconComponent={ExpandMoreIcon}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: "#00000061" }}>
                        {T.translate(
                          "edit_summit_sponsorship.placeholders.select_lobby_template"
                        )}
                      </span>
                    );
                  }
                  const selectedOption = lobby_template_ddl.find(
                    (t) => t.value === selected
                  );
                  return selectedOption?.label || selected;
                }}
              >
                {lobby_template_ddl.map((lobby_template) => (
                  <MenuItem value={lobby_template.value}>
                    {lobby_template.label}
                  </MenuItem>
                ))}
              </Select>
            </Grid2>
            <Grid2
              container
              spacing={0}
              size={6}
              sx={{ alignItems: "baseline" }}
            >
              <InputLabel htmlFor="expo_hall_template">
                {T.translate("edit_summit_sponsorship.expo_hall_template")}
              </InputLabel>
              <Select
                value={entity.expo_hall_template}
                name="expo_hall_template"
                fullWidth
                onChange={handleChange}
                IconComponent={ExpandMoreIcon}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: "#00000061" }}>
                        {T.translate(
                          "edit_summit_sponsorship.placeholders.select_expo_hall_template"
                        )}
                      </span>
                    );
                  }
                  const selectedOption = expo_hall_template_ddl.find(
                    (t) => t.value === selected
                  );
                  return selectedOption?.label || selected;
                }}
              >
                {expo_hall_template_ddl.map((expo_hall_template) => (
                  <MenuItem value={expo_hall_template.value}>
                    {expo_hall_template.label}
                  </MenuItem>
                ))}
              </Select>
            </Grid2>
          </Grid2>
          <Grid2
            container
            spacing={2}
            size={12}
            sx={{ alignItems: "baseline" }}
          >
            <Grid2
              container
              spacing={0}
              size={6}
              sx={{ alignItems: "baseline" }}
            >
              <InputLabel htmlFor="event_page_template">
                {T.translate("edit_summit_sponsorship.event_page_template")}
              </InputLabel>
              <Select
                value={entity.event_page_template}
                placeholder={T.translate(
                  "edit_summit_sponsorship.placeholders.select_event_page_template"
                )}
                name="event_page_template"
                fullWidth
                onChange={handleChange}
                IconComponent={ExpandMoreIcon}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: "#00000061" }}>
                        {T.translate(
                          "edit_summit_sponsorship.placeholders.select_event_page_template"
                        )}
                      </span>
                    );
                  }
                  const selectedOption = event_page_template_ddl.find(
                    (t) => t.value === selected
                  );
                  return selectedOption?.label || selected;
                }}
              >
                {event_page_template_ddl.map((event_page_template) => (
                  <MenuItem value={event_page_template.value}>
                    {event_page_template.label}
                  </MenuItem>
                ))}
              </Select>
            </Grid2>
            <Grid2
              container
              spacing={0}
              size={6}
              sx={{ alignItems: "baseline" }}
            >
              <InputLabel htmlFor="sponsor_page_template">
                {T.translate("edit_summit_sponsorship.sponsor_page_template")}
              </InputLabel>
              <Select
                value={entity.sponsor_page_template}
                placeholder={T.translate(
                  "edit_summit_sponsorship.placeholders.select_sponsor_page_template"
                )}
                name="sponsor_page_template"
                fullWidth
                onChange={handleChange}
                IconComponent={ExpandMoreIcon}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: "#00000061" }}>
                        {T.translate(
                          "edit_summit_sponsorship.placeholders.select_sponsor_page_template"
                        )}
                      </span>
                    );
                  }
                  const selectedOption = sponsor_page_template_ddl.find(
                    (t) => t.value === selected
                  );
                  return selectedOption?.label || selected;
                }}
              >
                {sponsor_page_template_ddl.map((sponsor_page_template) => (
                  <MenuItem value={sponsor_page_template.value}>
                    {sponsor_page_template.label}
                  </MenuItem>
                ))}
              </Select>
            </Grid2>
          </Grid2>
          <Grid2
            container
            spacing={2}
            mt={3}
            size={12}
            sx={{ alignItems: "baseline" }}
          >
            <Grid2
              container
              spacing={0}
              size={4}
              sx={{ alignItems: "baseline" }}
            >
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entity.sponsor_page_use_disqus_widget}
                      name="sponsor_page_use_disqus_widget"
                      onChange={handleCheckboxChange}
                    />
                  }
                  label={T.translate(
                    "edit_summit_sponsorship.sponsor_page_use_disqus_widget"
                  )}
                />
              </FormControl>
            </Grid2>
            <Grid2
              container
              spacing={0}
              size={4}
              sx={{ alignItems: "baseline" }}
            >
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entity.should_display_on_expo_hall_page}
                      name="should_display_on_expo_hall_page"
                      onChange={handleCheckboxChange}
                    />
                  }
                  label={T.translate(
                    "edit_summit_sponsorship.should_display_on_expo_hall_page"
                  )}
                />
              </FormControl>
            </Grid2>
            <Grid2
              container
              spacing={0}
              size={4}
              sx={{ alignItems: "baseline" }}
            >
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entity.sponsor_page_use_schedule_widget}
                      name="sponsor_page_use_schedule_widget"
                      onChange={handleCheckboxChange}
                    />
                  }
                  label={T.translate(
                    "edit_summit_sponsorship.sponsor_page_use_schedule_widget"
                  )}
                />
              </FormControl>
            </Grid2>
          </Grid2>
          <Grid2
            container
            spacing={2}
            mb={1}
            size={12}
            sx={{ alignItems: "baseline" }}
          >
            <Grid2
              container
              spacing={0}
              size={4}
              sx={{ alignItems: "baseline" }}
            >
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entity.sponsor_page_use_banner_widget}
                      name="sponsor_page_use_banner_widget"
                      onChange={handleCheckboxChange}
                    />
                  }
                  label={T.translate(
                    "edit_summit_sponsorship.sponsor_page_use_banner_widget"
                  )}
                />
              </FormControl>
            </Grid2>
            <Grid2
              container
              spacing={0}
              size={4}
              sx={{ alignItems: "baseline" }}
            >
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entity.sponsor_page_use_live_event_widget}
                      name="sponsor_page_use_live_event_widget"
                      onChange={handleCheckboxChange}
                    />
                  }
                  label={T.translate(
                    "edit_summit_sponsorship.sponsor_page_use_live_event_widget"
                  )}
                />
              </FormControl>
            </Grid2>
            <Grid2
              container
              spacing={0}
              size={4}
              sx={{ alignItems: "baseline" }}
            >
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entity.should_display_on_lobby_page}
                      name="should_display_on_lobby_page"
                      onChange={handleCheckboxChange}
                    />
                  }
                  label={T.translate(
                    "edit_summit_sponsorship.should_display_on_lobby_page"
                  )}
                />
              </FormControl>
            </Grid2>
          </Grid2>
        </Grid2>
        {/* {entity.id &&
          <>
            <Divider />
            <Grid2 container spacing={2} sx={{ alignItems: "start", px: 3, py: 1 }}>
              <Grid2 size={12}>
                <InputLabel htmlFor="badge_image" id="images">
                  {T.translate("edit_summit_sponsorship.images")}
                </InputLabel>
                <UploadInput
                  value={entity.badge_image}
                  handleUpload={handleUploadBadgeImage}
                  handleRemove={handleRemoveBadgeImage}
                  className="dropzone col-md-6"
                  multiple={false}
                  accept="image/*"
                />
              </Grid2>
              <Grid2 size={12}>
                <InputLabel htmlFor="badge_alt_text">
                  {T.translate("edit_summit_sponsorship.badge_alt_text")}
                </InputLabel>
                <TextField
                  name="badge_alt_text"
                  variant="outlined"
                  value={entity.badge_alt_text}
                  onChange={handleChange}
                  placeholder={T.translate("edit_summit_sponsorship.placeholders.badge_alt_text")}
                  fullWidth
                />
              </Grid2>
            </Grid2>
          </>
        } */}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ py: 2 }}>
        <Button onClick={handleOnSave} fullWidth variant="contained">
          {T.translate("edit_summit_sponsorship.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddTierDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

const mapStateToProps = ({ currentInventoryItemListState }) => ({
  ...currentInventoryItemListState
});

export default connect(mapStateToProps, {})(AddTierDialog);
