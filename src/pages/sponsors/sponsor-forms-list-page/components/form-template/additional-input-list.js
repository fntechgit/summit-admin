import React from "react";
import _ from "lodash";
import { useField } from "formik";
import T from "i18n-react";
import AdditionalInput from "./additional-input";
import showConfirmDialog from "../../../../../components/mui/components/showConfirmDialog";

const AdditionalInputList = ({ name, onDelete, onDeleteValue }) => {
  // eslint-disable-next-line no-unused-vars
  const [field, meta, helpers] = useField(name);

  const handleChange = (itemIdx, fieldName, fieldValue) => {
    const newValues = _.cloneDeep(field.value);
    newValues[itemIdx][fieldName] = fieldValue;
    helpers.setValue(newValues);
  };

  const handleRemove = async (item, index) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "sponsor_forms.form_template_popup.delete_meta_field_warning"
      )} ${item.name}`,
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      const removeFromUI = () => {
        const newValues = field.value.filter((val, idx) => idx !== index);

        if (newValues.length === 0)
          newValues.push({
            name: "",
            type: "Text",
            is_required: false,
            values: []
          });

        helpers.setValue(newValues);
      };

      if (item.id && onDelete) {
        onDelete(item.id).then(() => {
          removeFromUI();
        });
      } else {
        removeFromUI();
      }
    }
  };

  const handleRemoveValue = async (item, itemValue, valueIndex, itemIndex) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "sponsor_forms.form_template_popup.delete_value_warning"
      )} ${itemValue.name}`,
      type: "warning",
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (isConfirmed) {
      const removeFromUI = () => {
        const newValues = _.cloneDeep(field.value);
        newValues[itemIndex].values = newValues[itemIndex].values.filter(
          (val, idx) => idx !== valueIndex
        );
        helpers.setValue(newValues);
      };

      if (item.id && itemValue.id && onDeleteValue) {
        onDeleteValue(item.id, itemValue.id).then(() => {
          removeFromUI();
        });
      } else {
        removeFromUI();
      }
    }
  };

  const handleAddValue = (index) => {
    const newValues = _.cloneDeep(field.value);
    newValues[index].values.push({ value: "", isDefault: false });
    helpers.setValue(newValues);
  };

  const handleValueChange = (itemIdx, valueIdx, key, value) => {
    const newValues = _.cloneDeep(field.value);
    newValues[itemIdx].values[valueIdx][key] = value;
    helpers.setValue(newValues);
  };

  const handleAddItem = () => {
    helpers.setValue([
      ...field.value,
      { name: "", type: "Text", is_required: false, values: [] }
    ]);
  };

  const handleReorderValues = (itemIdx, newItemValues) => {
    const newValues = _.cloneDeep(field.value);
    newValues[itemIdx].values = newItemValues;
    helpers.setValue(newValues);
  };

  return (
    <>
      {field.value.map((item, itemIdx) => (
        <AdditionalInput
          // eslint-disable-next-line react/no-array-index-key
          key={`additional_input_${itemIdx}`}
          item={item}
          itemIdx={itemIdx}
          onChange={handleChange}
          onChangeValue={handleValueChange}
          onAdd={handleAddItem}
          onAddValue={handleAddValue}
          onDelete={handleRemove}
          onDeleteValue={handleRemoveValue}
          onReorderValue={handleReorderValues}
        />
      ))}
    </>
  );
};

export default AdditionalInputList;
