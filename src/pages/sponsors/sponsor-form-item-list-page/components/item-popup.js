import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import {
  Dialog,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  resetSponsorFormItem,
  saveSponsorFormItem,
  updateSponsorFormItem
} from "../../../../actions/sponsor-forms-actions";
import ItemForm from "./item-form";

const ItemPopup = ({
  formId,
  item,
  open,
  onClose,
  resetSponsorFormItem,
  saveSponsorFormItem,
  updateSponsorFormItem
}) => {
  const handleClose = () => {
    // clear form from reducer
    resetSponsorFormItem();
    onClose();
  };

  const handleOnSave = (values) => {
    const save = values.id ? updateSponsorFormItem : saveSponsorFormItem;

    save(formId, values).finally(() => {
      handleClose();
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate(
            `sponsor_form_item_list.edit_item.${item?.id ? "edit" : "new"}`
          )}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={handleClose}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <ItemForm initialValues={item} onSubmit={handleOnSave} />
    </Dialog>
  );
};

ItemPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

const mapStateToProps = ({
  sponsorFormItemsListState,
  currentSummitState
}) => ({
  item: sponsorFormItemsListState.currentItem,
  summitTZ: currentSummitState.currentSummit.time_zone_id
});

export default connect(mapStateToProps, {
  resetSponsorFormItem,
  saveSponsorFormItem,
  updateSponsorFormItem
})(ItemPopup);
