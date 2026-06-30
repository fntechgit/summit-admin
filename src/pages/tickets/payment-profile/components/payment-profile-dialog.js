import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Divider,
  Grid2,
  IconButton,
  InputAdornment,
  MenuItem,
  Box,
  InputLabel,
  TextField,
  Tooltip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import InfoIcon from "@mui/icons-material/Info";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikPriceField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/price-field";
import MuiFormikCheckbox from "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import useScrollToError from "../../../../hooks/useScrollToError";
import { nullableDecimalValidation } from "../../../../utils/yup";
import { ONE_HUNDRED, TEN_THOUSAND } from "../../../../utils/constants";

const InfoTooltip = ({ title }) => (
  <Tooltip
    title={title}
    placement="top"
    componentsProps={{ tooltip: { sx: { fontSize: "1rem" } } }}
  >
    <InfoIcon sx={{ ml: 0.5, verticalAlign: "middle" }} />
  </Tooltip>
);

InfoTooltip.propTypes = {
  title: PropTypes.string.isRequired
};

const APPLICATION_TYPE_OPTIONS = [
  { label: "Registration", value: "Registration" },
  { label: "Bookable Rooms", value: "BookableRooms" },
  { label: "Sponsor Services", value: "SponsorServices" }
];

const PROVIDER_OPTIONS = [
  { label: "Stripe", value: "Stripe" },
  { label: "LawPay", value: "LawPay" }
];

const PAYMENT_TYPE_FEE_KIND = [
  { label: "Rate", value: "Rate" },
  { label: "Amount", value: "Amount" }
];

const PAYMENT_TYPE_FEE_METHOD = [
  // # Cards & wallets
  { label: "Card", value: "card" },
  { label: "Link", value: "link" },
  { label: "CashApp", value: "cashapp" },
  { label: "Paypal", value: "paypal" },
  // # Bank debits
  { label: "UsBankAccount", value: "us_bank_account" },
  { label: "SepaDebit", value: "sepa_debit" },
  { label: "BacsDebit", value: "bacs_debit" },
  { label: "AuBecsDebit", value: "au_becs_debit" },
  { label: "AcssDebit", value: "acss_debit" },
  // # Bank redirects
  { label: "Ideal", value: "ideal" },
  { label: "Sofort", value: "sofort" },
  { label: "Bancontact", value: "bancontact" },
  { label: "Giropay", value: "giropay" },
  { label: "Eps", value: "eps" },
  { label: "P24", value: "p24" },
  { label: "Blik", value: "blik" },
  // # Buy Now, Pay Later
  { label: "Klarna", value: "klarna" },
  { label: "AfterpayClearpay", value: "afterpay_clearpay" },
  { label: "Affirm", value: "affirm" },
  // # Regional / other
  { label: "Alipay", value: "alipay" },
  { label: "WechatPay", value: "wechat_pay" },
  { label: "Grabpay", value: "grabpay" },
  { label: "Oxxo", value: "oxxo" },
  { label: "Boleto", value: "boleto" },
  { label: "Konbini", value: "konbini" }
];

const PaymentProfileDialog = ({
  onSave,
  onClose,
  entity: initialEntity,
  paymentFeeTypes,
  onDeleteFeeType,
  onSaveFeeType
}) => {
  const [showFeeTypeForm, setShowFeeTypeForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formik = useFormik({
    initialValues: {
      id: initialEntity?.id || 0,
      application_type: initialEntity?.application_type || "",
      provider: initialEntity?.provider || "",
      is_active: initialEntity?.is_active || false,
      test_mode_enabled: initialEntity?.test_mode_enabled || false,
      send_email_receipt: initialEntity?.send_email_receipt || false,
      merchant_account_id: initialEntity?.merchant_account_id || "",
      live_secret_key: initialEntity?.live_secret_key || "",
      live_publishable_key: initialEntity?.live_publishable_key || "",
      test_secret_key: initialEntity?.test_secret_key || "",
      test_publishable_key: initialEntity?.test_publishable_key || ""
    },
    validationSchema: yup.object().shape({
      application_type: yup
        .string()
        .required(T.translate("validation.required")),
      provider: yup.string().required(T.translate("validation.required"))
    }),
    onSubmit: (values) => {
      if (isSaving) return;
      setIsSaving(true);
      onSave(values)
        .then(() => onClose())
        .catch(() => {})
        .finally(() => setIsSaving(false));
    }
  });

  const feeTypeFormik = useFormik({
    initialValues: {
      id: 0,
      name: "",
      kind: "",
      payment_method: "",
      value: 0,
      max_cents: null,
      min_cents: null
    },
    validationSchema: yup.object().shape({
      name: yup.string().required(T.translate("validation.required")),
      kind: yup.string().required(T.translate("validation.required")),
      payment_method: yup.string().required(T.translate("validation.required")),
      value: yup
        .number()
        .typeError(T.translate("validation.number"))
        .required(T.translate("validation.required"))
        .when("kind", {
          is: "Rate",
          then: (schema) =>
            schema
              .integer(T.translate("validation.integer"))
              .min(1, T.translate("validation.minimum", { minimum: 0.01 }))
              .max(
                TEN_THOUSAND,
                T.translate("validation.maximum", { maximum: 100 })
              ),
          otherwise: (schema) =>
            schema.min(0, T.translate("validation.non_negative"))
        }),
      max_cents: nullableDecimalValidation(),
      min_cents: nullableDecimalValidation()
    }),
    onSubmit: (values) => {
      if (isSaving) return;
      setIsSaving(true);
      onSaveFeeType(values)
        .then(() => {
          feeTypeFormik.resetForm();
          setShowFeeTypeForm(false);
        })
        .catch(() => {})
        .finally(() => setIsSaving(false));
    }
  });

  useScrollToError(formik, true);

  const title = initialEntity.id
    ? `${T.translate("general.edit")} ${T.translate(
        "payment_profiles.payment_profile"
      )}`
    : `${T.translate("general.add")} ${T.translate(
        "payment_profiles.payment_profile"
      )}`;

  const feeTypesOptions = {
    sortCol: paymentFeeTypes.order,
    sortDir: paymentFeeTypes.orderDir
  };

  const feeTypesColumns = [
    {
      columnKey: "name",
      header: T.translate("edit_payment_profile.payment_type_fee_name")
    },
    {
      columnKey: "kind",
      header: T.translate("edit_payment_profile.payment_type_fee_kind")
    },
    {
      columnKey: "payment_method",
      header: T.translate("edit_payment_profile.payment_type_fee_method")
    },
    {
      columnKey: "value",
      header: T.translate("edit_payment_profile.payment_type_fee_value"),
      render: (row) =>
        row.kind === "Rate"
          ? `${row.value / ONE_HUNDRED}%`
          : `${currencyAmountFromCents(row.value)}`
    },
    {
      columnKey: "max_cents",
      header: T.translate("edit_payment_profile.payment_type_fee_max_cents")
    },
    {
      columnKey: "min_cents",
      header: T.translate("edit_payment_profile.payment_type_fee_min_cents")
    }
  ];

  const handleClose = () => {
    if (isSaving) return;
    formik.resetForm();
    onClose();
  };

  const handleFeeTypeDelete = (feeTypeId) => {
    if (isSaving) return;
    onDeleteFeeType(feeTypeId);
  };

  const handleFeeTypeEdit = (feeType) => {
    feeTypeFormik.setValues({ ...feeType });
    setShowFeeTypeForm(true);
  };

  const handleNewFeeType = () => {
    feeTypeFormik.resetForm();
    setShowFeeTypeForm(true);
  };

  const handleCancelFeeType = () => {
    if (isSaving) return;
    feeTypeFormik.resetForm();
    setShowFeeTypeForm(false);
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      disableEscapeKeyDown={isSaving}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        {title}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ mr: 1 }}
          aria-label="close"
          disabled={isSaving}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormikProvider value={formik}>
        <DialogContent>
          <Grid2 container spacing={2} mb={2}>
            <Grid2 size={6}>
              <InputLabel htmlFor="application_type">
                {T.translate("edit_payment_profile.application_type")}
              </InputLabel>
              <MuiFormikSelect
                name="application_type"
                placeholder={T.translate(
                  "edit_payment_profile.application_type"
                )}
                disabled={Boolean(formik.values.id)}
              >
                {APPLICATION_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </MuiFormikSelect>
            </Grid2>
            <Grid2 size={6}>
              <InputLabel htmlFor="provider">
                {T.translate("edit_payment_profile.provider")}
              </InputLabel>
              <MuiFormikSelect name="provider">
                {PROVIDER_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </MuiFormikSelect>
            </Grid2>

            <Grid2 size={4}>
              <MuiFormikCheckbox
                name="is_active"
                label={T.translate("edit_payment_profile.active")}
              />
            </Grid2>
            <Grid2 size={4} sx={{ display: "flex" }}>
              <MuiFormikCheckbox
                name="test_mode_enabled"
                label={
                  <>
                    {T.translate("edit_payment_profile.test_mode_enabled")}
                    <InfoTooltip
                      title={T.translate(
                        "edit_payment_profile.info_stripe_test_mode"
                      )}
                    />
                  </>
                }
              />
            </Grid2>
            {formik.values.provider === "Stripe" && (
              <Grid2 size={4}>
                <MuiFormikCheckbox
                  name="send_email_receipt"
                  label={
                    <>
                      {T.translate("edit_payment_profile.send_email_receipt")}
                      <InfoTooltip
                        title={T.translate(
                          "edit_payment_profile.info_send_email_receipt"
                        )}
                      />
                    </>
                  }
                />
              </Grid2>
            )}

            {formik.values.provider === "LawPay" && (
              <Grid2 size={12}>
                <InputLabel htmlFor="merchant_account_id">
                  {T.translate("edit_payment_profile.merchant_account_id")}
                </InputLabel>
                <MuiFormikTextField
                  name="merchant_account_id"
                  fullWidth
                  variant="outlined"
                />
              </Grid2>
            )}

            <Grid2 size={6}>
              <InputLabel htmlFor="live_secret_key">
                {T.translate("edit_payment_profile.live_secret_key")}
                <InfoTooltip
                  title={T.translate("edit_payment_profile.info_stripe_keys")}
                />
              </InputLabel>
              <MuiFormikTextField
                name="live_secret_key"
                required
                fullWidth
                variant="outlined"
              />
            </Grid2>
            <Grid2 size={6}>
              <InputLabel htmlFor="live_publishable_key">
                {T.translate("edit_payment_profile.live_publishable_key")}
                <InfoTooltip
                  title={T.translate("edit_payment_profile.info_stripe_keys")}
                />
              </InputLabel>
              <MuiFormikTextField
                name="live_publishable_key"
                required
                fullWidth
                variant="outlined"
              />
            </Grid2>
            <Grid2 size={6}>
              <InputLabel htmlFor="test_secret_key">
                {T.translate("edit_payment_profile.test_secret_key")}
                <InfoTooltip
                  title={T.translate("edit_payment_profile.info_stripe_keys")}
                />
              </InputLabel>
              <MuiFormikTextField
                name="test_secret_key"
                fullWidth
                variant="outlined"
              />
            </Grid2>
            <Grid2 size={6}>
              <InputLabel htmlFor="test_publishable_key">
                {T.translate("edit_payment_profile.test_publishable_key")}
                <InfoTooltip
                  title={T.translate("edit_payment_profile.info_stripe_keys")}
                />
              </InputLabel>
              <MuiFormikTextField
                name="test_publishable_key"
                fullWidth
                variant="outlined"
              />
            </Grid2>
          </Grid2>
          {formik.values.id !== 0 &&
            formik.values.provider === "Stripe" &&
            formik.values.application_type === "SponsorServices" && (
              <>
                <Divider />
                <Box mt={2}>
                  <h5>
                    {T.translate("edit_payment_profile.payment_type_fee")}
                  </h5>
                  <Grid2
                    size={12}
                    container
                    mb={2}
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Grid2>
                      {paymentFeeTypes.totalPaymentFeeTypes}{" "}
                      {T.translate("edit_payment_profile.payment_type_fees")}
                    </Grid2>
                    <Grid2>
                      {!showFeeTypeForm && (
                        <Button
                          variant="contained"
                          onClick={handleNewFeeType}
                          startIcon={<AddIcon />}
                          sx={{
                            height: "36px",
                            fontSize: "1.4rem",
                            lineHeight: "2.4rem",
                            letterSpacing: "0.4px"
                          }}
                        >
                          {T.translate("edit_payment_profile.new_fee_type")}
                        </Button>
                      )}
                    </Grid2>
                  </Grid2>
                  <FormikProvider value={feeTypeFormik}>
                    {showFeeTypeForm && (
                      <Grid2 size={12} container spacing={2} mb={2}>
                        <Grid2 size={4}>
                          <InputLabel htmlFor="name">
                            {T.translate(
                              "edit_payment_profile.payment_type_fee_name"
                            )}
                          </InputLabel>
                          <MuiFormikTextField
                            name="name"
                            fullWidth
                            variant="outlined"
                            margin="none"
                          />
                        </Grid2>
                        <Grid2 size={4}>
                          <InputLabel htmlFor="kind">
                            {T.translate(
                              "edit_payment_profile.payment_type_fee_kind"
                            )}
                          </InputLabel>
                          <MuiFormikSelect
                            name="kind"
                            placeholder={T.translate(
                              "edit_payment_profile.payment_type_fee_kind"
                            )}
                            onChange={(e) => {
                              feeTypeFormik.setValues(
                                {
                                  ...feeTypeFormik.values,
                                  kind: e.target.value,
                                  value: 0
                                },
                                false
                              );
                              feeTypeFormik.setFieldTouched(
                                "value",
                                false,
                                false
                              );
                            }}
                          >
                            {PAYMENT_TYPE_FEE_KIND.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </MuiFormikSelect>
                        </Grid2>
                        <Grid2 size={4}>
                          <InputLabel htmlFor="payment_method">
                            {T.translate(
                              "edit_payment_profile.payment_type_fee_method"
                            )}
                          </InputLabel>
                          <MuiFormikSelect
                            name="payment_method"
                            placeholder={T.translate(
                              "edit_payment_profile.payment_type_fee_method"
                            )}
                            renderValue={(selected) => {
                              if (!selected)
                                return (
                                  <span style={{ color: "#aaa" }}>
                                    {T.translate(
                                      "edit_payment_profile.payment_type_fee_method"
                                    )}
                                  </span>
                                );
                              const opt = PAYMENT_TYPE_FEE_METHOD.find(
                                (o) => o.value === selected
                              );
                              return opt ? opt.label : selected;
                            }}
                          >
                            {PAYMENT_TYPE_FEE_METHOD.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </MuiFormikSelect>
                        </Grid2>
                        <Grid2 size={4}>
                          <InputLabel htmlFor="value">
                            {T.translate(
                              "edit_payment_profile.payment_type_fee_value"
                            )}
                          </InputLabel>
                          {feeTypeFormik.values.kind === "Amount" ? (
                            <MuiFormikPriceField
                              name="value"
                              fullWidth
                              variant="outlined"
                              margin="none"
                              inCents
                            />
                          ) : (
                            <TextField
                              type="number"
                              value={
                                feeTypeFormik.values.value > 0
                                  ? feeTypeFormik.values.value / ONE_HUNDRED
                                  : ""
                              }
                              onChange={(e) => {
                                const pct = parseFloat(e.target.value);
                                feeTypeFormik.setFieldValue(
                                  "value",
                                  Number.isNaN(pct)
                                    ? 0
                                    : Math.round(pct * ONE_HUNDRED)
                                );
                              }}
                              onBlur={() =>
                                feeTypeFormik.setFieldTouched("value", true)
                              }
                              error={
                                feeTypeFormik.touched.value &&
                                Boolean(feeTypeFormik.errors.value)
                              }
                              helperText={
                                feeTypeFormik.touched.value &&
                                feeTypeFormik.errors.value
                              }
                              fullWidth
                              variant="outlined"
                              margin="none"
                              slotProps={{
                                input: {
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      %
                                    </InputAdornment>
                                  )
                                },
                                htmlInput: { min: 0.01, max: 100, step: 0.01 }
                              }}
                            />
                          )}
                        </Grid2>
                        <Grid2 size={4}>
                          <InputLabel htmlFor="max_cents">
                            {T.translate(
                              "edit_payment_profile.payment_type_fee_max_cents"
                            )}
                          </InputLabel>
                          <MuiFormikPriceField
                            name="max_cents"
                            fullWidth
                            variant="outlined"
                            margin="none"
                            inCents
                          />
                        </Grid2>
                        <Grid2 size={4}>
                          <InputLabel htmlFor="min_cents">
                            {T.translate(
                              "edit_payment_profile.payment_type_fee_min_cents"
                            )}
                          </InputLabel>
                          <MuiFormikPriceField
                            name="min_cents"
                            fullWidth
                            variant="outlined"
                            margin="none"
                            inCents
                          />
                        </Grid2>
                        <Grid2
                          size={12}
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1
                          }}
                        >
                          <Button
                            variant="outlined"
                            onClick={handleCancelFeeType}
                            sx={{
                              height: "36px",
                              fontSize: "1.4rem",
                              lineHeight: "2.4rem",
                              letterSpacing: "0.4px"
                            }}
                          >
                            {T.translate("general.cancel")}
                          </Button>
                          <Button
                            variant="contained"
                            onClick={feeTypeFormik.handleSubmit}
                            disabled={isSaving}
                            sx={{
                              height: "36px",
                              fontSize: "1.4rem",
                              lineHeight: "2.4rem",
                              letterSpacing: "0.4px"
                            }}
                          >
                            {T.translate("edit_payment_profile.save_fee_type")}
                          </Button>
                        </Grid2>
                      </Grid2>
                    )}
                  </FormikProvider>
                  <MuiTable
                    columns={feeTypesColumns}
                    data={paymentFeeTypes.paymentFeeTypes}
                    options={feeTypesOptions}
                    totalRows={paymentFeeTypes.totalPaymentFeeTypes}
                    onDelete={handleFeeTypeDelete}
                    onEdit={handleFeeTypeEdit}
                    deleteDialogBody={(id) =>
                      T.translate(
                        "edit_payment_profile.fee_type_remove_warning",
                        { id }
                      )
                    }
                  />
                </Box>
              </>
            )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={isSaving}
          >
            {T.translate("general.save")}
          </Button>
        </DialogActions>
      </FormikProvider>
    </Dialog>
  );
};

PaymentProfileDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  entity: PropTypes.shape({
    id: PropTypes.number,
    application_type: PropTypes.string,
    provider: PropTypes.string,
    is_active: PropTypes.bool,
    test_mode_enabled: PropTypes.bool,
    send_email_receipt: PropTypes.bool,
    merchant_account_id: PropTypes.string,
    live_secret_key: PropTypes.string,
    live_publishable_key: PropTypes.string,
    test_secret_key: PropTypes.string,
    test_publishable_key: PropTypes.string
  }),
  paymentFeeTypes: PropTypes.shape({
    paymentFeeTypes: PropTypes.arrayOf(PropTypes.shape({})),
    totalPaymentFeeTypes: PropTypes.number,
    order: PropTypes.string,
    orderDir: PropTypes.number
  }),
  onSaveFeeType: PropTypes.func.isRequired,
  onDeleteFeeType: PropTypes.func.isRequired
};

PaymentProfileDialog.defaultProps = {
  entity: {},
  paymentFeeTypes: {
    paymentFeeTypes: [],
    totalPaymentFeeTypes: 0,
    order: "id",
    orderDir: 1
  }
};

export default PaymentProfileDialog;
