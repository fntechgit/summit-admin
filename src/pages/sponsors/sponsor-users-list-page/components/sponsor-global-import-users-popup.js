import React, { useEffect, useRef, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import CheckBoxList from "openstack-uicore-foundation/lib/components/mui/checkbox-list";
import SummitsDropdown from "openstack-uicore-foundation/lib/components/mui/summits-dropdown";
import MuiFormikAsyncAutocomplete from "openstack-uicore-foundation/lib/components/mui/formik-inputs/async-select";
import { snackbarErrorMsg } from "openstack-uicore-foundation/lib/utils/actions";
import {
  fetchSponsorByCompany,
  fetchSponsorUsersBySummit,
  importSponsorUsers
} from "../../../../actions/sponsor-users-actions";
import { querySponsors } from "../../../../actions/sponsor-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../../utils/constants";

const SponsorGlobalImportUsersPopup = ({
  summitId,
  onClose,
  importSponsorUsers
}) => {
  const [selectedSummit, setSelectedSummit] = useState(null);
  const [userOptions, setUserOptions] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRequestIdRef = useRef(0);

  const formik = useFormik({
    initialValues: { sponsor: null },
    validationSchema: yup.object({
      sponsor: yup
        .object()
        .nullable()
        .required(T.translate("validation.required"))
        .shape({
          value: yup.mixed().required(T.translate("validation.required"))
        })
    }),
    onSubmit: () => {},
    validateOnBlur: false,
    enableReinitialize: true
  });

  const sponsorId = formik.values.sponsor?.value;
  const companyId = formik.values.sponsor?.companyId;

  useEffect(() => {
    if (selectedSummit && sponsorId && companyId) {
      loadMoreRequestIdRef.current += 1; // invalidate in-flight load-more requests
      let cancelled = false;
      setUserOptions(null);
      setSelectedUsers([]);
      fetchSponsorUsersBySummit(
        summitId,
        selectedSummit,
        companyId,
        DEFAULT_CURRENT_PAGE
      ).then((userData) => {
        if (!cancelled) {
          setUserOptions(userData);
          setSelectedUsers([]);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    setUserOptions(null);
    setSelectedUsers([]);
  }, [selectedSummit, sponsorId, companyId]);

  const handleLoadMoreUsers = () => {
    if (isLoadingMore || !userOptions) return;
    if (userOptions.current_page < userOptions.last_page) {
      const requestId = ++loadMoreRequestIdRef.current;
      setIsLoadingMore(true);
      fetchSponsorUsersBySummit(
        summitId,
        selectedSummit,
        companyId,
        userOptions.current_page + 1
      )
        .then((userData) => {
          if (requestId !== loadMoreRequestIdRef.current || !userData?.data)
            return;
          setUserOptions((prev) => {
            if (!prev) return userData;
            return {
              ...userData,
              data: [...(prev.data || []), ...userData.data]
            };
          });
        })
        .catch(() =>
          snackbarErrorMsg({
            title: T.translate("general.error"),
            html: T.translate("sponsor_users.import_users.fetch_users_fail")
          })
        )
        .finally(() => setIsLoadingMore(false));
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleImport = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const runImport = (targetSponsorId) =>
      importSponsorUsers(
        targetSponsorId,
        companyId,
        selectedSummit,
        selectedUsers
      ).then(() => onClose());

    // "apply to all" is resolved by the backend via companyId + target summit,
    // so only the specific-users path needs the target summit's own sponsor id.
    (selectedUsers === "all"
      ? runImport(sponsorId)
      : fetchSponsorByCompany(companyId, summitId).then((targetSponsor) =>
          runImport(targetSponsor.id)
        )
    )
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const handleSelectOnChange = (items, all = false) => {
    if (all) {
      setSelectedUsers("all");
    } else {
      setSelectedUsers(items);
    }
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isSaving}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", p: 2 }}
        component="div"
      >
        <Typography variant="h5">
          {T.translate("sponsor_users.import_users.title")}
        </Typography>
        <IconButton
          size="large"
          sx={{ p: 0 }}
          onClick={handleClose}
          disabled={isSaving}
        >
          <CloseIcon fontSize="large" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormikProvider value={formik}>
        <DialogContent sx={{ p: 2 }}>
          <SummitsDropdown
            onChange={(val) => {
              setSelectedSummit(val);
              formik.setFieldValue("sponsor", null);
              setUserOptions(null);
              setSelectedUsers([]);
            }}
            excludeSummitIds={[summitId]}
          />
          {selectedSummit && (
            <Box sx={{ mb: 2, mt: 2 }}>
              <MuiFormikAsyncAutocomplete
                name="sponsor"
                queryFunction={querySponsors}
                queryParams={[selectedSummit]}
                placeholder={T.translate(
                  "sponsor_users.process_request.select_sponsor"
                )}
                formatOption={(item) => ({
                  value: item.id,
                  label: item.name,
                  companyId: item.companyId
                })}
                formatSelectedValue={(s) => ({
                  id: parseInt(s.value),
                  name: s.label,
                  companyId: s.companyId
                })}
              />
            </Box>
          )}
          {selectedSummit && sponsorId && userOptions && (
            <>
              <Typography
                variant="body1"
                gutterBottom
                sx={{ color: "text.secondary", mt: 2 }}
              >
                {T.translate("sponsor_users.import_users.select_users")}
              </Typography>
              <Card variant="outlined">
                <CheckBoxList
                  items={userOptions.data.map((it) => ({
                    id: it.id,
                    name:
                      it.first_name && it.last_name
                        ? `${it.first_name} ${it.last_name}`
                        : it.email
                  }))}
                  onChange={handleSelectOnChange}
                  label={T.translate(
                    "sponsor_users.import_users.select_all_users"
                  )}
                  loadMoreData={handleLoadMoreUsers}
                  boxHeight="200px"
                />
              </Card>
            </>
          )}
        </DialogContent>
      </FormikProvider>
      <Divider sx={{ margin: "10px 0px 20px 0px" }} />
      <DialogActions>
        <Button
          fullWidth
          variant="contained"
          onClick={handleImport}
          disabled={selectedUsers.length === 0 || isSaving}
        >
          {T.translate("sponsor_users.import_users.import_users")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default connect(null, {
  importSponsorUsers
})(SponsorGlobalImportUsersPopup);
