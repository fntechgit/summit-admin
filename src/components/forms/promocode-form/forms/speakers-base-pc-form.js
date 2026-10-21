import React, { useEffect, useState } from "react";
import T from "i18n-react";
import { useFormikContext } from "formik";
import {
  Autocomplete,
  Button,
  Divider,
  Grid2,
  InputLabel,
  TextField
} from "@mui/material";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import { querySpeakers } from "openstack-uicore-foundation/lib/utils/query-actions";
import { formatSpeakerOption } from "./speaker-base-pc-form";

// assignments are saved by their own endpoints (or kept in redux until a new code is created), so they live outside formik
const SpeakersBasePCForm = ({
  entity,
  summit,
  assignSpeaker,
  getAssignedSpeakers,
  unAssignSpeaker
}) => {
  const { values } = useFormikContext();
  const [speakerToAssign, setSpeakerToAssign] = useState(null);
  const [speakerOptions, setSpeakerOptions] = useState([]);
  const [speakerInput, setSpeakerInput] = useState("");
  const { speakers } = entity;
  const promocode = { ...entity, class_name: values.class_name };

  useEffect(() => {
    if (entity.id) getAssignedSpeakers(promocode);
  }, [entity.id]);

  useEffect(() => {
    if (speakerInput) {
      querySpeakers(summit.id, speakerInput, (results) =>
        setSpeakerOptions(results.map(formatSpeakerOption))
      );
    }
  }, [speakerInput]);

  const handleAssign = () => {
    if (!speakerToAssign) return;
    assignSpeaker({ ...promocode, speaker: speakerToAssign.raw });
    setSpeakerToAssign(null);
  };

  const handleDelete = (speakerId) => {
    unAssignSpeaker(values.class_name, entity.id, speakerId);
  };

  const handleSearch = (term) => {
    getAssignedSpeakers(
      promocode,
      term,
      speakers.currentPage,
      speakers.perPage,
      speakers.order,
      speakers.orderDir
    );
  };

  const handlePageChange = (page) => {
    getAssignedSpeakers(
      promocode,
      speakers.term,
      page,
      speakers.perPage,
      speakers.order,
      speakers.orderDir
    );
  };

  const handlePerPageChange = (perPage) => {
    getAssignedSpeakers(
      promocode,
      speakers.term,
      1,
      perPage,
      speakers.order,
      speakers.orderDir
    );
  };

  const handleSort = (key, dir) => {
    getAssignedSpeakers(
      promocode,
      speakers.term,
      speakers.currentPage,
      speakers.perPage,
      key,
      dir
    );
  };

  const yesNo = (flag) =>
    flag ? T.translate("general.yes") : T.translate("general.no");

  const columns = [
    { columnKey: "id", header: "Id", sortable: true },
    {
      columnKey: "full_name",
      header: T.translate("general.name"),
      sortable: true
    },
    {
      columnKey: "email",
      header: T.translate("general.email"),
      sortable: true
    },
    {
      columnKey: "email_sent",
      header: T.translate("edit_promo_code.assigned_speakers_list.email_sent"),
      sortable: true,
      render: (row) => yesNo(row.email_sent)
    },
    {
      columnKey: "redeemed",
      header: T.translate("edit_promo_code.assigned_speakers_list.redeemed"),
      sortable: true,
      render: (row) => yesNo(row.redeemed)
    }
  ];

  return (
    <>
      <Grid2 size={12}>
        <Divider />
      </Grid2>
      <Grid2 size={12}>
        <InputLabel>{T.translate("edit_promo_code.speakers")}</InputLabel>
      </Grid2>
      <Grid2 size={6}>
        {entity.id > 0 && (
          <SearchInput
            term={speakers.term ?? ""}
            placeholder={T.translate(
              "edit_promo_code.placeholders.search_speakers"
            )}
            onSearch={handleSearch}
          />
        )}
      </Grid2>
      <Grid2 size={4}>
        <Autocomplete
          id="speaker_to_assign"
          options={speakerOptions}
          value={speakerToAssign}
          onChange={(_ev, selected) => setSpeakerToAssign(selected)}
          onInputChange={(_ev, input) => setSpeakerInput(input)}
          filterOptions={(opts) => opts}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={T.translate(
                "edit_promo_code.placeholders.speaker_to_assign"
              )}
            />
          )}
        />
      </Grid2>
      <Grid2 size={2}>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={!speakerToAssign}
        >
          {T.translate("edit_promo_code.assign_speaker")}
        </Button>
      </Grid2>
      <Grid2 size={12}>
        <MuiTable
          options={{ sortCol: speakers.order, sortDir: speakers.orderDir }}
          data={speakers.filtered_speakers_list}
          columns={columns}
          perPage={speakers.perPage}
          currentPage={speakers.currentPage}
          totalRows={
            entity.id ? speakers.totalSpeakers : speakers.speakers_list.length
          }
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onDelete={handleDelete}
          canDelete={(row) => !row.redeemed}
          getName={(row) => row.full_name}
          deleteDialogBody={(name) =>
            `${T.translate("edit_promo_code.unassign_speaker_warning")} ${name}`
          }
        />
      </Grid2>
      <Grid2 size={12}>
        <Divider />
      </Grid2>
    </>
  );
};

export default SpeakersBasePCForm;
