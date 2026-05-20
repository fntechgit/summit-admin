import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} from "react";
import { Modal } from "react-bootstrap";
import { FixedSizeList } from "react-window";
import T from "i18n-react";
import { parseTextBlob, classifyEntries } from "./bulk-input-parser";

const ROW_HEIGHT = 32;
const LIST_HEIGHT = 320;
const SEARCH_DEBOUNCE_MS = 150;

// eslint-disable-next-line no-unused-vars
const _typeOf = (entry) => {
  if (entry.startsWith("@")) return "at_domain";
  if (entry.startsWith(".")) return "tld";
  return "email";
};

const Row = React.memo(({ index, style, data }) => {
  const { entry } = data.items[index];
  return (
    <div
      style={style}
      data-testid={`manage-modal-row-${index}`}
      className="manage-modal-row"
    >
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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const listRef = useRef(null);

  // Intentionally depend only on `show`: snapshot `existing` when the modal opens
  // and ignore subsequent prop changes — modal owns the working copy until Done/Cancel.
  useEffect(() => {
    if (show) {
      setWorking(Array.isArray(existing) ? [...existing] : []);
      setDraftText("");
      setToast(null);
      setSearchInput("");
      setSearch("");
    }
  }, [show]);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

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

    // Adds append to the end of the working copy. If a search filter is
    // active the new entries may be filtered out of view — clear it so the
    // additions are visible, and only autoscroll when the unfiltered list
    // index space matches `working`.
    if (search !== "") {
      setSearchInput("");
      setSearch("");
    } else if (listRef.current && next.length > 0) {
      listRef.current.scrollToItem(next.length - 1, "end");
    }
  }, [draftText, working, search]);

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

  const handleCancel = () => {
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

  const countText = T.translate(
    "edit_promocode.manage_modal.configured_count",
    {
      n: working.length
    }
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const indexed = working.map((entry, originalIndex) => ({
      entry,
      originalIndex
    }));
    if (!q) return indexed;
    return indexed.filter((x) => x.entry.toLowerCase().includes(q));
  }, [working, search]);

  const itemData = useMemo(() => ({ items: visible }), [visible]);

  return (
    <Modal show={show} onHide={handleCancel} bsSize="large">
      <Modal.Header closeButton>
        <Modal.Title>
          {T.translate("edit_promocode.manage_modal.title")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          className="manage-modal-controls"
          style={{ display: "flex", gap: 8, marginBottom: 12 }}
        >
          <input
            type="text"
            data-testid="manage-modal-search"
            className="form-control"
            value={searchInput}
            placeholder={T.translate(
              "edit_promocode.manage_modal.search_placeholder"
            )}
            onChange={(ev) => setSearchInput(ev.target.value)}
          />
        </div>
        <div className="manage-modal-add-section" style={{ marginBottom: 12 }}>
          <textarea
            data-testid="manage-modal-textarea"
            className="form-control"
            rows={4}
            value={draftText}
            placeholder={T.translate("edit_promocode.manage_modal.add_helper")}
            onChange={(ev) => setDraftText(ev.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 8 }}
            onClick={handleAddDomains}
          >
            {T.translate("edit_promocode.manage_modal.add_button")}
          </button>
        </div>
        {toastText && (
          <div
            data-testid="manage-modal-toast"
            className="alert alert-info"
            style={{ padding: "6px 10px", marginBottom: 12 }}
          >
            {toastText}
          </div>
        )}
        <div
          className="manage-modal-count"
          data-testid="manage-modal-count"
          style={{ marginBottom: 4 }}
        >
          {countText}
        </div>
        <FixedSizeList
          ref={listRef}
          height={LIST_HEIGHT}
          width="100%"
          itemCount={visible.length}
          itemSize={ROW_HEIGHT}
          itemData={itemData}
        >
          {Row}
        </FixedSizeList>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-default"
          onClick={handleCancel}
        >
          {T.translate("edit_promocode.manage_modal.cancel")}
        </button>
        <button type="button" className="btn btn-primary" onClick={handleDone}>
          {T.translate("edit_promocode.manage_modal.done")}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ManageAllowedEmailDomainsModal;
