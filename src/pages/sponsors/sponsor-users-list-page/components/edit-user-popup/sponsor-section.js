import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import T from "i18n-react";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MuiFormikCheckboxGroup from "../../../../../components/mui/formik-inputs/mui-formik-checkbox-group";
import { titleCase } from "../../../../../utils/methods";
import MuiSponsorInput from "../../../../../components/mui/formik-inputs/mui-sponsor-input";

const SponsorSection = ({
  name,
  item,
  itemIdx,
  summitId,
  userGroups,
  onAdd,
  onDelete
}) => {
  const userGroupOptions = userGroups.map((ug) => ({
    value: ug.id,
    label: titleCase(ug.name)
  }));

  return (
    <Box
      sx={{ display: "flex", gap: 2, alignItems: "flex-start", width: "100%" }}
    >
      <Box sx={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: 1, p: 2 }}>
        <Typography variant="h6">
          {T.translate("sponsor_users.edit_user.sponsor")}
        </Typography>
        <Box sx={{ mb: 1, mt: 1 }}>
          <MuiSponsorInput name={`${name}.sponsor`} summitId={summitId} />
        </Box>
        <Typography variant="h6">
          {T.translate("sponsor_users.edit_user.access")}
        </Typography>
        <MuiFormikCheckboxGroup
          name={`${name}.groups`}
          options={userGroupOptions}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignSelf: "center"
        }}
      >
        <IconButton
          size="large"
          onClick={() => onDelete(itemIdx, item)}
          color="default"
          sx={{
            bgcolor: "action.disabledBackground",
            "&:hover": { bgcolor: "action.disabled" }
          }}
        >
          <DeleteIcon fontSize="large" />
        </IconButton>
        {onAdd && (
          <IconButton
            size="large"
            onClick={() => onAdd()}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              "&:hover": { bgcolor: "primary.dark" }
            }}
          >
            <AddIcon fontSize="large" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default SponsorSection;
