import React from "react";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import { useField } from "formik";
import normalizeHtmlString from "../../utils/normalize-html-string";

const FormikTextEditor = ({ name, options = {}, ...props }) => {
  const [field, meta, helpers] = useField(name);
  const mergedOptions = { tabIndex: 0, allowTabNavigation: true, ...options };

  return (
    <TextEditorV3
      name={name}
      id={name}
      value={field.value}
      options={mergedOptions}
      onChange={(e) => {
        const stringValue = normalizeHtmlString(e.target.value);
        helpers.setValue(stringValue);
      }}
      error={meta.touched && meta.error}
      license={process.env.JODIT_LICENSE_KEY}
      {...props}
    />
  );
};

export default FormikTextEditor;
