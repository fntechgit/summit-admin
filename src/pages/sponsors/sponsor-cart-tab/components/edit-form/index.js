/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useMemo, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import { Button, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import moment from "moment-timezone";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import FormItemTable from "../../../../../components/mui/FormItemTable";
import {
  DISCOUNT_TYPES,
  MILLISECONDS_IN_SECOND
} from "../../../../../utils/constants";
import NotesModal from "../../../../../components/mui/NotesModal";
import ItemSettingsModal from "../../../../../components/mui/ItemSettingsModal";

const parseValue = (item, timeZone) => {
  switch (item.type) {
    case "Quantity":
      return item.current_value
        ? parseInt(item.current_value)
        : item.minimum_quantity || 0;
    case "ComboBox":
    case "Text":
    case "TextArea":
      return item.current_value || "";
    case "CheckBox":
      return item.current_value ? item.current_value === "True" : false;
    case "CheckBoxList":
      return item.current_value || [];
    case "RadioButtonList":
      return item.current_value || "";
    case "Time":
      return item.current_value
        ? moment.tz(item.current_value, "HH:mm", timeZone)
        : null;
    case "DateTime":
      return item.current_value
        ? epochToMomentTimeZone(item.current_value, timeZone)
        : null;
    default:
      return null;
  }
};

const getYupValidation = (field) => {
  let schema;

  switch (field.type) {
    case "Quantity": {
      schema = yup.number(T.translate("validation.number"));
      if (field.minimum_quantity > 0) {
        schema = schema.min(
          field.minimum_quantity,
          T.translate("validation.minimum", { minimum: field.minimum_quantity })
        );
      }
      if (field.maximum_quantity > 0) {
        schema = schema.max(
          field.maximum_quantity,
          T.translate("validation.maximum", { maximum: field.maximum_quantity })
        );
      }
      if (field.is_required) {
        schema = schema.required(T.translate("validation.required"));
      }
      break;
    }
    case "Text":
    case "TextArea": {
      schema = yup.string(T.translate("validation.string"));

      if (field.is_required) {
        schema = schema.required(T.translate("validation.required"));
      }
      break;
    }
    case "Time":
    case "DateTime": {
      schema = yup.date(T.translate("validation.date"));

      if (field.is_required) {
        schema = schema.required(T.translate("validation.required"));
      } else {
        schema = schema.nullable();
      }
      break;
    }
    case "CheckBoxList": {
      schema = yup
        .array()
        .of(yup.string())
        .typeError(T.translate("validation.wrong_format"));

      if (field.is_required) {
        schema = schema.required(T.translate("validation.required"));
      }
      break;
    }
    default: {
      schema = yup.string(T.translate("validation.wrong_format"));

      if (field.is_required) {
        schema = schema.required(T.translate("validation.required"));
      }
      break;
    }
  }

  return schema;
};

const buildInitialValues = (form, timeZone) => {
  const items = form?.items || [];

  const initialValues = items.reduce((acc, item) => {
    item.meta_fields.map((f) => {
      acc[`i-${item.form_item_id}-c-${f.class_field}-f-${f.type_id}`] =
        parseValue(f, timeZone);
    });
    // add notes
    acc[`i-${item.form_item_id}-c-global-f-notes`] = item.notes || "";
    // if no quantity inputs we add the global quantity input
    acc[`i-${item.form_item_id}-c-global-f-quantity`] =
      item.quantity || item.default_quantity || 0;
    // custom rate
    acc[`i-${item.form_item_id}-c-global-f-custom_rate`] =
      item.custom_rate || 0;

    return acc;
  }, {});

  initialValues.discount_amount = form.discount_amount || 0;
  initialValues.discount_type = form.discount_type || DISCOUNT_TYPES.AMOUNT;

  return initialValues;
};

const buildValidationSchema = (items) => {
  const schema = items.reduce((acc, item) => {
    item.meta_fields
      .filter((f) => f.class_field === "Form")
      .map((f) => {
        acc[`i-${item.form_item_id}-c-${f.class_field}-f-${f.type_id}`] =
          getYupValidation(f);
      });
    // notes
    acc[`i-${item.form_item_id}-c-global-f-notes`] = yup.string(
      T.translate("validation.string")
    );
    // validation for the global quantity input
    let globalQtySchema = yup
      .number(T.translate("validation.number"))
      .min(1, `${T.translate("validation.minimum")} 1`);
    if (item.quantity_limit_per_sponsor > 0) {
      globalQtySchema = globalQtySchema.max(
        item.quantity_limit_per_sponsor,
        T.translate("validation.maximum", {
          maximum: item.quantity_limit_per_sponsor
        })
      );
    }
    globalQtySchema = globalQtySchema.required(
      T.translate("validation.required")
    );
    acc[`i-${item.form_item_id}-c-global-f-quantity`] = globalQtySchema;
    // custom rate
    acc[`i-${item.form_item_id}-c-global-f-custom_rate`] = yup.number(
      T.translate("validation.number")
    );

    return acc;
  }, {});

  schema.discount = yup.number(T.translate("validation.number"));
  schema.discount_type = yup
    .string(T.translate("validation.string"))
    .nullable();

  return schema;
};

const EditForm = ({
  form,
  showMetadata,
  showTimeZone,
  onSaveForm,
  onCancel
}) => {
  const [notesItem, setNotesItem] = useState(null);
  const [settingsItem, setSettingsItem] = useState(null);
  const hasRateExpired = useMemo(() => {
    const now = epochToMomentTimeZone(
      Math.floor(new Date() / MILLISECONDS_IN_SECOND),
      showTimeZone
    );
    const onsiteEndOfDay = epochToMomentTimeZone(
      showMetadata.onsite_price_end_date,
      showTimeZone
    )?.endOf("day");
    if (!onsiteEndOfDay || now.isSameOrBefore(onsiteEndOfDay)) return false;
    return true;
  }, [showMetadata, showTimeZone]);

  const handleCancel = () => {
    onCancel();
  };

  const handleSave = (values) => {
    const { discount_amount, discount_type, ...itemValues } = values;
    // re-format form values to match the API format
    const items = Object.entries(itemValues).reduce((res, [key, val]) => {
      const match = key.split("-");
      if (match) {
        const formItemId = parseInt(match[1]);
        const itemClass = match[3]; // quantity or notes
        const itemTypeId = match[5];
        const isItemProp = !["quantity", "notes", "custom_rate"].includes(
          itemTypeId
        );
        let current_value = val;

        let resItem = res.find((i) => i.form_item_id === formItemId);
        if (!resItem) {
          resItem = { form_item_id: formItemId, meta_fields: [] };
          res.push(resItem);
        }
        if (isItemProp) {
          const metaField = form.items
            .find((i) => i.form_item_id === formItemId)
            ?.meta_fields.find((mf) => mf.type_id === parseInt(itemTypeId));

          if (metaField?.type === "DateTime") {
            current_value = val ? moment(val).unix() : null;
          } else if (metaField?.type === "Time") {
            current_value = val ? moment(val).format("HH:mm") : null;
          }

          resItem.meta_fields.push({
            type_id: parseInt(itemTypeId),
            type_name: metaField?.type,
            class_field: itemClass,
            current_value
          });
        } else {
          resItem[itemTypeId] = current_value;
        }
      }

      return res;
    }, []);

    onSaveForm({ discount_amount, discount_type, items });
  };

  const formik = useFormik(
    {
      initialValues: buildInitialValues(form, showTimeZone),
      validationSchema: yup.object({
        ...buildValidationSchema(form?.items || [])
      }),
      onSubmit: (values) => {
        handleSave(values);
      },
      enableReinitialize: true
    },
    [form?.items]
  );

  // wait for formik to re-initialize with form items
  if (!form || Object.keys(formik.values).length === 0) return null;

  return (
    <>
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        {form.code} - {form.name}
        {form.addon_name ? ` - ${form.addon_name}` : ""}
      </Typography>
      <Box component="div" sx={{ mb: 2 }}>
        {form?.items.length} {T.translate("general.items")}
      </Box>
      <FormikProvider value={formik}>
        <Box component="form" onSubmit={formik.handleSubmit} autoComplete="off">
          <FormItemTable
            data={form.items}
            rateDates={showMetadata}
            values={formik.values}
            timeZone={showTimeZone}
            onNotesClick={setNotesItem}
            onSettingsClick={setSettingsItem}
          />
          <Box
            component="div"
            sx={{ display: "flex", justifyContent: "end", marginTop: 4 }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={handleCancel}
              size="large"
              sx={{ minWidth: 150, marginRight: 1 }}
            >
              {T.translate("general.cancel")}
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={hasRateExpired}
              size="large"
              sx={{ minWidth: 150 }}
            >
              {T.translate("general.save")}
            </Button>
          </Box>
        </Box>
        <NotesModal
          item={notesItem}
          open={!!notesItem}
          onClose={() => setNotesItem(null)}
          onSave={formik.handleSubmit}
        />
        <ItemSettingsModal
          item={settingsItem}
          open={!!settingsItem}
          onClose={() => setSettingsItem(null)}
        />
      </FormikProvider>
    </>
  );
};

const mapStateToProps = ({ currentSummitState, sponsorSettingsState }) => ({
  showMetadata: sponsorSettingsState.settings,
  showTimeZone: currentSummitState.currentSummit.time_zone_id
});

export default connect(mapStateToProps, {})(EditForm);
