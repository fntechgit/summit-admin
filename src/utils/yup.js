import * as yup from "yup";
import T from "i18n-react";
import { METAFIELD_TYPES, fieldTypesWithOptions } from "./constants";

export const addEmailListValidator = () => {
  yup.addMethod(yup.string, "emailList", function (errorMessage) {
    return this.test("emailList", errorMessage, function (value) {
      const { path, createError } = this;
      if (!value) {
        return true; // Or handle empty values as needed
      }
      const emails = value.replace(/\s/g, "").split(";");
      const isValid = emails.every((email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      );
      return isValid || createError({ path, message: errorMessage });
    });
  });
};

export const addIssAfterDateFieldValidator = () => {
  yup.addMethod(yup.date, "isAfterDateField", function (fieldRef, message) {
    return this.test("is-after-date-field", message, (value, ctx) => {
      const { path, createError, resolve } = ctx;
      const referencedFieldValue = resolve(fieldRef);

      // If either value is missing, validation passes
      if (!referencedFieldValue || !value) return true;

      // Check if current date is after the referenced field date
      if (referencedFieldValue >= value) {
        return createError({
          path,
          message
        });
      }
      return true;
    });
  });
};

export const numberValidation = () =>
  yup.number().typeError(T.translate("validation.number"));

export const decimalValidation = () =>
  yup
    .number()
    .typeError(T.translate("validation.number"))
    .positive(T.translate("validation.number_positive"))
    .required(T.translate("validation.required"))
    .test("max-decimals", T.translate("validation.two_decimals"), (value) => {
      if (value === undefined || value === null) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    });

export const quantityValidation = () =>
  yup
    .number()
    .typeError(T.translate("validation.number"))
    .positive(T.translate("validation.number_positive"))
    .required(T.translate("validation.required"));

export const rateCellValidation = () =>
  yup
    .number()
    // allow $ at the start
    .transform((value, originalValue) => {
      if (typeof originalValue === "string") {
        const cleaned = originalValue.replace(/^\$/, "");
        return cleaned === "" ? undefined : parseFloat(cleaned);
      }
      return value;
    })
    // check if there's letters or characters
    .test({
      name: "valid-format",
      message: T.translate("validation.number"),
      test: (value, { originalValue }) => {
        if (
          originalValue === undefined ||
          originalValue === null ||
          originalValue === ""
        )
          return true;
        return /^\$?-?\d+(\.\d+)?$/.test(originalValue);
      }
    })
    .positive(T.translate("validation.number_positive"))
    .test("max-decimals", T.translate("validation.two_decimals"), (value) => {
      if (value === undefined || value === null) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    });

export const requiredStringValidation = () =>
  yup.string().required(T.translate("validation.required"));

export const positiveNumberValidation = () =>
  numberValidation()
    .integer(T.translate("validation.integer"))
    .min(0, T.translate("validation.number_positive"));

export const formMetafieldsValidation = () =>
  yup.array().of(
    yup.object().shape({
      name: yup
        .string()
        .when(["type", "values", "minimum_quantity", "maximum_quantity"], {
          is: (type, values, minQty, maxQty) => {
            // required only if has values or quantities
            const hasValues = values && values.length > 0;
            const hasQuantities =
              type === "Quantity" && (minQty != null || maxQty != null);
            return hasValues || hasQuantities;
          },
          then: (schema) =>
            schema.trim().required(T.translate("validation.required")),
          otherwise: (schema) => schema
        }),
      type: yup.string().oneOf(METAFIELD_TYPES),
      is_required: yup.boolean(),
      minimum_quantity: yup
        .number()
        .nullable()
        .when("type", {
          is: (type) => type === "Quantity",
          then: (schema) => schema.required(T.translate("validation.required")),
          otherwise: (schema) => schema
        }),
      maximum_quantity: yup
        .number()
        .nullable()
        .when("type", {
          is: (type) => type === "Quantity",
          then: (schema) => schema.required(T.translate("validation.required")),
          otherwise: (schema) => schema
        }),
      values: yup.array().when("type", {
        is: (type) => fieldTypesWithOptions.includes(type),
        then: (schema) =>
          schema.min(1, T.translate("validation.one_option_required")).of(
            yup.object().shape({
              value: yup
                .string()
                .trim()
                .required(T.translate("validation.required")),
              name: yup
                .string()
                .trim()
                .required(T.translate("validation.required")),
              is_default: yup.boolean()
            })
          ),
        otherwise: (schema) => schema
      })
    })
  );

export const opensAtValidation = () =>
  yup
    .date(T.translate("validation.date"))
    .required(T.translate("validation.required"));
