import React from "react";
import {
  Box,
  Button,
  Divider,
  FormHelperText,
  Grid2,
  InputLabel,
  MenuItem
} from "@mui/material";
import { useFormikContext, getIn } from "formik";
import T from "i18n-react/dist/i18n-react";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MetaFieldValues from "./meta-field-values";
import MuiFormikTextField from "../mui-formik-textfield";
import MuiFormikSelect from "../mui-formik-select";
import MuiFormikCheckbox from "../mui-formik-checkbox";
import {
  METAFIELD_TYPES,
  METAFIELD_TYPES_WITH_OPTIONS
} from "../../../../utils/constants";

const AdditionalInput = ({
  item,
  itemIdx,
  baseName,
  onAdd,
  onDelete,
  onDeleteValue,
  entityId,
  isAddDisabled
}) => {
  const { errors, touched, values } = useFormikContext();

  const buildFieldName = (fieldName) => `${baseName}[${itemIdx}].${fieldName}`;
  const currentType = getIn(values, buildFieldName("type"));

  const fieldErrors = getIn(errors, `${baseName}[${itemIdx}]`);
  const fieldTouched = getIn(touched, `${baseName}[${itemIdx}]`);

  const showValuesError =
    fieldTouched?.values &&
    fieldErrors?.values &&
    typeof fieldErrors.values === "string";

  return (
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
              <InputLabel htmlFor={buildFieldName("name")}>
                {T.translate("additional_inputs.meta_field_title")}
              </InputLabel>
              <MuiFormikTextField
                name={buildFieldName("name")}
                margin="none"
                placeholder={T.translate(
                  "additional_inputs.placeholders.meta_field_title"
                )}
                fullWidth
              />
            </Grid2>
            <Grid2 size={4}>
              <InputLabel htmlFor={buildFieldName("type")}>
                {T.translate("additional_inputs.meta_field_type")}
              </InputLabel>
              <MuiFormikSelect
                name={buildFieldName("type")}
                placeholder={T.translate(
                  "additional_inputs.placeholders.meta_field_type"
                )}
              >
                {METAFIELD_TYPES.map((fieldType) => (
                  <MenuItem key={fieldType} value={fieldType}>
                    {fieldType}
                  </MenuItem>
                ))}
              </MuiFormikSelect>
            </Grid2>
            <Grid2 size={4} sx={{ alignSelf: "end" }}>
              <MuiFormikCheckbox
                name={buildFieldName("is_required")}
                label={T.translate("additional_inputs.meta_field_required")}
              />
            </Grid2>
          </Grid2>
          {METAFIELD_TYPES_WITH_OPTIONS.includes(currentType) && (
            <>
              <Divider sx={{ mt: 2 }} />
              <MetaFieldValues
                field={item}
                fieldIndex={itemIdx}
                baseName={baseName}
                onMetaFieldTypeValueDeleted={onDeleteValue}
                entityId={entityId}
              />
              {showValuesError && (
                <FormHelperText error sx={{ mt: 1 }}>
                  {fieldErrors.values}
                </FormHelperText>
              )}
            </>
          )}
          {currentType === "Quantity" && (
            <Grid2 container spacing={2} sx={{ alignItems: "start", mt: 2 }}>
              <Grid2 size={4}>
                <MuiFormikTextField
                  name={buildFieldName("minimum_quantity")}
                  placeholder={T.translate(
                    "additional_inputs.placeholders.meta_field_minimum_quantity"
                  )}
                  type="number"
                  margin="none"
                  fullWidth
                />
              </Grid2>
              <Grid2 size={4}>
                <MuiFormikTextField
                  name={buildFieldName("maximum_quantity")}
                  placeholder={T.translate(
                    "additional_inputs.placeholders.meta_field_maximum_quantity"
                  )}
                  type="number"
                  margin="none"
                  fullWidth
                />
              </Grid2>
            </Grid2>
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
            disabled={isAddDisabled}
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
};

export default AdditionalInput;
