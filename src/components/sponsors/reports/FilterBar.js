import React, { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import T from "i18n-react/dist/i18n-react";

// Sponsor is the ONLY multi-select (base-api-utils limitation). All other
// dimensions are passed as single-select controls via `extraControls`.
// `showSearch` is OFF by default: only the Sponsor Asset report supports `search`
// server-side; Purchase Details does NOT.
const FilterBar = ({
  sponsors = [],
  value = {},
  onApply,
  onClear,
  extraControls,
  showSearch = false
}) => {
  const [draft, setDraft] = useState(value);
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
          <TextField
            size="small"
            label={T.translate("sponsor_reports_page.search")}
            value={draft.search || ""}
            onChange={(e) => update({ search: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
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
