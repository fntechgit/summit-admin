import React, { useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getSponsorships } from "../../../../actions/sponsor-forms-actions";
import { DEFAULT_PER_PAGE } from "../../../../utils/constants";
import CheckBoxList from "../../../../components/mui/components/infinite-checkbox-list";

const SelectSponsorshipsDialog = ({
  sponsorships,
  onSave,
  onClose,
  getSponsorships
}) => {
  const { items, currentPage, total } = sponsorships;
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    getSponsorships(1, DEFAULT_PER_PAGE);
  }, []);

  const handleLoadMore = () => {
    if (total > items.length) {
      getSponsorships(currentPage + 1, DEFAULT_PER_PAGE);
    }
  };

  const handleClose = () => {
    setSelectedRows([]);
    onClose();
  };

  const handleOnCheck = (rowId, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, rowId]);
    } else {
      setSelectedRows(selectedRows.filter((r) => r !== rowId));
    }
  };

  const handleOnSave = () => {
    onSave(selectedRows);
  }

  return (
    <>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between" }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_forms.sponsorships_popup.title")}
        </Typography>
        <IconButton size="large" sx={{ p: 0 }} onClick={() => handleClose()}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        <CheckBoxList items={items} loadMoreData={handleLoadMore} />
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button
          onClick={handleOnSave}
          disabled={selectedRows.length === 0}
          fullWidth
          variant="contained"
        >
          {T.translate("sponsor_forms.sponsorships_popup.apply")}
        </Button>
      </DialogActions>
    </>
  );
};

SelectSponsorshipsDialog.propTypes = {
  sponsorships: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

const mapStateToProps = ({ sponsorFormsListState }) => ({
  sponsorships: sponsorFormsListState.sponsorships
});

export default connect(mapStateToProps, {
  getSponsorships
})(SelectSponsorshipsDialog);
