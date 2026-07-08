import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import T from "i18n-react/dist/i18n-react";

// Stable empty-object reference so an omitted `value` prop doesn't create a new
// object every render (which would re-fire the resync effect and loop).
const EMPTY_VALUE = {};

// Sponsor is the ONLY multi-select (base-api-utils limitation). All other
// dimensions are passed as single-select controls via `extraControls`.
// `showSearch` is OFF by default: only the Sponsor Asset report supports `search`
// server-side; Purchase Details does NOT.
const FilterBar = ({
  sponsors = [],
  value = EMPTY_VALUE,
  onApply,
  onClear,
  extraControls,
  showSearch = false
}) => {
  const [draft, setDraft] = useState(value);
  // Re-sync the draft when the committed `value` prop changes externally
  // (e.g. a parent-driven reset). Typing only mutates `draft`, so this fires
  // on Apply/Clear/external changes, not on every keystroke.
  useEffect(() => {
    setDraft(value);
  }, [value]);
  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <FilterListIcon fontSize="small" color="action" />
        <Typography variant="subtitle2">
          {T.translate("sponsor_reports_page.report_filters")}
        </Typography>
      </Stack>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ flexWrap: "wrap", rowGap: 2 }}
      >
        {showSearch && (
          <Box sx={{ minWidth: 240 }}>
            {/* SearchInput only propagates via a debounced onSearch (no
                per-keystroke onChange), so it can't reliably feed the Apply-gated
                draft — a fast type+Apply would miss the last chars. Instead treat
                search as a live, debounced filter: commit + apply it on onSearch
                (this is how the peer list pages use SearchInput). */}
            <SearchInput
              term={draft.search || ""}
              onSearch={(term) => {
                const next = { ...draft, search: term || undefined };
                setDraft(next);
                onApply(next);
              }}
              placeholder={T.translate("sponsor_reports_page.search")}
              debounced
            />
          </Box>
        )}
        <Autocomplete
          multiple
          size="small"
          sx={{ minWidth: 240 }}
          options={sponsors}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          value={sponsors.filter((s) =>
            (draft.sponsorIds || []).includes(s.id)
          )}
          onChange={(_e, selected) =>
            update({ sponsorIds: selected.map((s) => s.id) })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={T.translate("sponsor_reports_page.filter_sponsor")}
            />
          )}
        />
        {extraControls && extraControls(draft, update)}
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" onClick={() => onApply(draft)}>
          {T.translate("sponsor_reports_page.apply")}
        </Button>
        <Button
          variant="text"
          onClick={() => {
            setDraft({});
            if (onClear) onClear();
          }}
        >
          {T.translate("sponsor_reports_page.clear")}
        </Button>
      </Stack>
    </Paper>
  );
};

export default FilterBar;
