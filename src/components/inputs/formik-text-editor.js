import React from "react";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import { useField } from "formik";

const FormikTextEditor = ({ name, ...props }) => {
  const [field, meta, helpers] = useField(name);

  return (
    <TextEditorV3
      name={name}
      id={name}
      value={field.value}
      onChange={(e) => helpers.setValue(e.target.value)}
      onBlur={() => helpers.setTouched(true)}
      error={meta.touched && Boolean(meta.error) ? meta.error : ""}
      license={process.env.JODIT_LICENSE_KEY}
      {...props}
    />
  );
};

export default FormikTextEditor;
