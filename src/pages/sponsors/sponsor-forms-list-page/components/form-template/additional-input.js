import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Grid2,
  MenuItem,
  Select,
  TextField
} from "@mui/material";
import T from "i18n-react";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MetaFieldValues from "../../../../sponsors_inventory/popup/meta-field-values";
import {
  METAFIELD_TYPES,
  METAFIELD_TYPES_WITH_OPTIONS
} from "../../../../../utils/constants";

const AdditionalInput = ({
  item,
  itemIdx,
  onChange,
  onChangeValue,
  onAdd,
  onAddValue,
  onDelete,
  onDeleteValue,
  onReorderValue
}) => (
    <Grid2 container spacing={2} sx={{ alignItems: "center" }}>
      <Grid2 size={11}>
        <Box
          sx={{
            border: "1px solid #0000001F",
            borderRadius: "4px",
            p: 2,
            my: 2
          }}
        >
          <Grid2 container spacing={2} sx={{ alignItems: "end" }}>
            <Grid2 size={4}>
              <TextField
                name="fieldTitle"
                label={T.translate(
                  "sponsor_forms.form_template_popup.meta_field_title"
                )}
                variant="outlined"
                value={item.name}
                onChange={(ev) => onChange(itemIdx, "name", ev.target.value)}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4}>
              <Select
                value={item.type}
                name="fieldType"
                label={T.translate(
                  "sponsor_forms.form_template_popup.meta_field_type"
                )}
                fullWidth
                onChange={(ev) => onChange(itemIdx, "type", ev.target.value)}
              >
                {METAFIELD_TYPES.map((fieldType) => (
                  <MenuItem key={fieldType} value={fieldType}>
                    {fieldType}
                  </MenuItem>
                ))}
              </Select>
            </Grid2>
            <Grid2 size={4}>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.is_required}
                      onChange={(ev) =>
                        onChange(itemIdx, "is_required", ev.target.checked)
                      }
                    />
                  }
                  label={T.translate(
                    "sponsor_forms.form_template_popup.meta_field_required"
                  )}
                />
              </FormControl>
            </Grid2>
          </Grid2>
          {METAFIELD_TYPES_WITH_OPTIONS.includes(item.type) && (
            <>
              <Divider sx={{ mt: 2 }} />
              <MetaFieldValues
                values={item.values}
                fieldIndex={itemIdx}
                onReorder={onReorderValue}
                handleFieldValueChange={onChangeValue}
                handleRemoveValue={onDeleteValue}
                handleAddValue={onAddValue}
              />
            </>
          )}
        </Box>
      </Grid2>
      <Grid2 size={1}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1
          }}
        >
          <Button
            variant="outlined"
            aria-label="delete"
            sx={{
              width: 40,
              height: 40,
              minWidth: "auto",
              borderRadius: "50%",
              padding: 0
            }}
            onClick={() => onDelete(item, itemIdx)}
          >
            <DeleteIcon />
          </Button>
          <Button
            variant="contained"
            aria-label="add"
            sx={{
              width: 40,
              height: 40,
              minWidth: "auto",
              borderRadius: "50%",
              padding: 0
            }}
            onClick={onAdd}
          >
            <AddIcon />
          </Button>
        </Box>
      </Grid2>
    </Grid2>
  );

export default AdditionalInput;
