import React from "react";
import _ from "lodash";
import { useField } from "formik";
import T from "i18n-react";
import showConfirmDialog from "../../../../../components/mui/showConfirmDialog";
import SponsorSection from "./sponsor-section";

const AccessRightsList = ({ name, userGroups, summitId }) => {
  // eslint-disable-next-line no-unused-vars
  const [field, meta, helpers] = useField(name);

  const removeFromUI = (index) => {
    const newValues = field.value.filter((val, idx) => idx !== index);

    if (newValues.length === 0) newValues.push({ sponsor: null, groups: [] });

    helpers.setValue(newValues);
  };

  const handleChange = (itemIdx, fieldName, fieldValue) => {
    const newValues = _.cloneDeep(field.value);
    newValues[itemIdx][fieldName] = fieldValue;
    helpers.setValue(newValues);
  };

  const handleRemove = async (index, item) => {
    if (item.id) {
      const isConfirmed = await showConfirmDialog({
        title: T.translate("general.are_you_sure"),
        text: `${T.translate("sponsor_users.delete_user_sponsor_warning")} ${
          item.sponsor.name
        }`,
        type: "warning",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: T.translate("general.yes_delete")
      });

      if (isConfirmed) {
        removeFromUI(index);
      }
    } else {
      removeFromUI(index);
    }
  };

  const handleAdd = () => {
    helpers.setValue([...field.value, { sponsor: null, groups: [] }]);
  };

  return (
    <>
      {field.value.map((item, itemIdx) => (
        <SponsorSection
          // eslint-disable-next-line react/no-array-index-key
          key={`access_rights_${itemIdx}`}
          name={`access_rights[${itemIdx}]`}
          item={item}
          itemIdx={itemIdx}
          summitId={summitId}
          userGroups={userGroups}
          onAdd={itemIdx === field.value.length - 1 ? handleAdd : null}
          onDelete={handleRemove}
          onChange={handleChange}
        />
      ))}
    </>
  );
};

export default AccessRightsList;
