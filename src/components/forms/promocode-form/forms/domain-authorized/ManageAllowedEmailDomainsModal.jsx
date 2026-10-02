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

const typeOf = (entry) => {
  if (entry.startsWith("@")) return "at_domain";
  if (entry.startsWith(".")) return "tld";
  return "email";
};

const Row = React.memo(({ index, style, data }) => {
  const { items, selection, onToggle } = data;
  const { entry, originalIndex } = items[index];
  return (
    <div
      style={{ ...style, display: "flex", alignItems: "center", gap: 8 }}
      data-testid={`manage-modal-row-${index}`}
      className="manage-modal-row"
    >
      <input
        type="checkbox"
        data-testid={`manage-modal-checkbox-${originalIndex}`}
        aria-label={T.translate("edit_promocode.manage_modal.row_select_aria", {
          entry
        })}
        checked={selection.has(originalIndex)}
        onChange={() => onToggle(originalIndex)}
      />
      <span>{entry}</span>
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
  const [typeFilter, setTypeFilter] = useState("all");
  const [selection, setSelection] = useState(() => new Set());
  const listRef = useRef(null);
  const scrollToEndRef = useRef(false);

  // Intentionally depend only on `show`: snapshot `existing` when the modal opens
  // and ignore subsequent prop changes — modal owns the working copy until Done/Cancel.
  useEffect(() => {
    if (show) {
      setWorking(Array.isArray(existing) ? [...existing] : []);
      setDraftText("");
      setToast(null);
      setSearchInput("");
      setSearch("");
      setTypeFilter("all");
      setSelection(new Set());
    }
  }, [show]);

  useEffect(() => {
    if (!show) return undefined;
    const id = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput, show]);

  useEffect(() => {
    setSelection(new Set());
  }, [search, typeFilter]);

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

    // Adds append to the end of the working copy. Clear any active or pending
    // filter so the additions are not filtered out of the visible list.
    if (search !== "" || searchInput !== "" || typeFilter !== "all") {
      setSearchInput("");
      setSearch("");
      setTypeFilter("all");
    }
    // Defer the autoscroll: `setWorking` above is batched and not yet committed,
    // so react-window still has the old itemCount and would clamp the target
    // index to the old last row. A flag + post-render effect scrolls once the
    // list has re-rendered with the new (larger) itemCount.
    if (additions.length > 0) {
      scrollToEndRef.current = true;
    }
  }, [draftText, working, search, searchInput, typeFilter]);

  const handleToggleSelect = useCallback((originalIndex) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(originalIndex)) next.delete(originalIndex);
      else next.add(originalIndex);
      return next;
    });
  }, []);

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
    return indexed.filter((x) => {
      if (typeFilter !== "all" && typeOf(x.entry) !== typeFilter) return false;
      if (q && !x.entry.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [working, search, typeFilter]);

  useEffect(() => {
    if (scrollToEndRef.current && listRef.current && visible.length > 0) {
      listRef.current.scrollToItem(visible.length - 1, "end");
    }
    scrollToEndRef.current = false;
  }, [visible]);

  const handleSelectAll = useCallback(() => {
    setSelection(new Set(visible.map((x) => x.originalIndex)));
  }, [visible]);

  const handleDeleteSelected = useCallback(() => {
    setWorking((prev) => prev.filter((_, idx) => !selection.has(idx)));
    setSelection(new Set());
  }, [selection]);

  const itemData = useMemo(
    () => ({ items: visible, selection, onToggle: handleToggleSelect }),
    [visible, selection, handleToggleSelect]
  );

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
            aria-label={T.translate("edit_promocode.manage_modal.search_aria")}
            placeholder={T.translate(
              "edit_promocode.manage_modal.search_placeholder"
            )}
            onChange={(ev) => setSearchInput(ev.target.value)}
          />
          <select
            data-testid="manage-modal-type-filter"
            className="form-control"
            style={{ maxWidth: 180 }}
            aria-label={T.translate(
              "edit_promocode.manage_modal.type_filter_aria"
            )}
            value={typeFilter}
            onChange={(ev) => setTypeFilter(ev.target.value)}
          >
            <option value="all">
              {T.translate("edit_promocode.manage_modal.filter.all")}
            </option>
            <option value="at_domain">
              {T.translate("edit_promocode.manage_modal.filter.at_domain")}
            </option>
            <option value="tld">
              {T.translate("edit_promocode.manage_modal.filter.tld")}
            </option>
            <option value="email">
              {T.translate("edit_promocode.manage_modal.filter.email")}
            </option>
          </select>
        </div>
        <div className="manage-modal-add-section" style={{ marginBottom: 12 }}>
          <textarea
            data-testid="manage-modal-textarea"
            className="form-control"
            rows={4}
            value={draftText}
            aria-label={T.translate("edit_promocode.manage_modal.add_aria")}
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4
          }}
        >
          <span data-testid="manage-modal-count">{countText}</span>
          <button
            type="button"
            className="btn btn-default btn-xs"
            data-testid="manage-modal-select-all"
            onClick={handleSelectAll}
          >
            {T.translate("edit_promocode.manage_modal.select_all")}
          </button>
          <button
            type="button"
            className="btn btn-danger btn-xs"
            data-testid="manage-modal-delete-selected"
            onClick={handleDeleteSelected}
            disabled={selection.size === 0}
          >
            {T.translate("edit_promocode.manage_modal.delete_selected", {
              n: selection.size
            })}
          </button>
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
