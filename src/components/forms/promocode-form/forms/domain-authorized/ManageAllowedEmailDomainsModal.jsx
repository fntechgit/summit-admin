import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} from "react";
import { FixedSizeList } from "react-window";
import T from "i18n-react";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import CustomDialog from "openstack-uicore-foundation/lib/components/mui/custom-dialog";
import { parseTextBlob, classifyEntries } from "./bulk-input-parser";

const ROW_HEIGHT = 32;
const LIST_HEIGHT = 320;

const Row = React.memo(({ index, style, data }) => {
  const entry = data[index];
  return (
    <div style={style} data-testid={`manage-modal-row-${index}`}>
      {entry}
    </div>
  );
});

const ManageAllowedEmailDomainsModal = ({
  show,
  onHide,
  onApply,
  existing
}) => {
  const [working, setWorking] = useState([]);
  const [draftText, setDraftText] = useState("");
  const [toast, setToast] = useState(null);
  const listRef = useRef(null);

  // Intentionally depend only on `show`: snapshot `existing` when the modal opens
  // and ignore subsequent prop changes — modal owns the working copy until Done/Cancel.
  useEffect(() => {
    if (show) {
      setWorking(Array.isArray(existing) ? [...existing] : []);
      setDraftText("");
      setToast(null);
    }
  }, [show]);

  const handleAddDomains = useCallback(() => {
    const rows = parseTextBlob(draftText);
    if (rows.length === 0) return;

    const classified = classifyEntries({ raw: rows, existing: working });
    const additions = classified.valid.map((v) => v.normalized);
    const next = [...working, ...additions];

    setWorking(next);
    setToast({
      added: classified.valid.length,
      invalid: classified.invalid.length,
      dup: classified.dupExisting.length + classified.dupInput.length
    });
    setDraftText("");

    if (listRef.current && next.length > 0) {
      listRef.current.scrollToItem(next.length - 1, "end");
    }
  }, [draftText, working]);

  const handleKeyDown = (ev) => {
    if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault();
      handleAddDomains();
    }
  };

  const handleDone = () => {
    onApply(working);
    onHide();
  };

  const toastText = useMemo(() => {
    if (!toast) return null;
    return T.translate("edit_promocode.manage_modal.added_toast", {
      added: toast.added,
      invalid: toast.invalid,
      dup: toast.dup
    });
  }, [toast]);

  return (
    <CustomDialog
      title={T.translate("edit_promocode.manage_modal.title")}
      open={show}
      onClose={onHide}
      maxWidth="md"
      primaryAction={{
        label: T.translate("edit_promocode.manage_modal.done"),
        onClick: handleDone
      }}
      secondaryAction={{
        label: T.translate("edit_promocode.manage_modal.cancel"),
        onClick: onHide
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={draftText}
          placeholder={T.translate("edit_promocode.manage_modal.add_helper")}
          onChange={(ev) => setDraftText(ev.target.value)}
          onKeyDown={handleKeyDown}
          slotProps={{ htmlInput: { "data-testid": "manage-modal-textarea" } }}
        />
        <Button variant="contained" sx={{ mt: 1 }} onClick={handleAddDomains}>
          {T.translate("edit_promocode.manage_modal.add_button")}
        </Button>
      </Box>
      {toastText && (
        <Alert
          severity="info"
          data-testid="manage-modal-toast"
          sx={{ mb: 1.5 }}
        >
          {toastText}
        </Alert>
      )}
      <Typography data-testid="manage-modal-count" sx={{ mb: 0.5 }}>
        {T.translate("edit_promocode.manage_modal.configured_count", {
          n: working.length
        })}
      </Typography>
      <FixedSizeList
        ref={listRef}
        height={LIST_HEIGHT}
        width="100%"
        itemCount={working.length}
        itemSize={ROW_HEIGHT}
        itemData={working}
      >
        {Row}
      </FixedSizeList>
    </CustomDialog>
  );
};

export default ManageAllowedEmailDomainsModal;
