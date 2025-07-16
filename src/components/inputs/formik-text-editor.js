import React from "react";
import { TextEditor } from "openstack-uicore-foundation/lib/components";
import { useFormikContext } from "formik";

const FormikTextEditor = ({ name, ...props }) => {
  const { values, errors, touched, setFieldValue, setFieldTouched } =
    useFormikContext();

  return (
    <TextEditor
      name={name}
      id={name}
      value={values[name]}
      onChange={(e) => setFieldValue(name, e.target.value)}
      onBlur={() => setFieldTouched(name, true)}
      error={touched?.[name] && errors?.[name] ? errors?.[name] : ""}
      {...props}
    />
  );
};

export default FormikTextEditor;
