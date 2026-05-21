/**
 * Copyright 2017 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Pagination } from "react-bootstrap";
import SelectableTable from "openstack-uicore-foundation/lib/components/table-selectable";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import FreeTextSearch from "openstack-uicore-foundation/lib/components/free-text-search";
import {
  GridFilter,
  useGridFilter,
  OPERATORS
} from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import {
  exportSummitSpeakers,
  getSpeakersBySummit,
  initSpeakersList,
  selectAllSummitSpeakers,
  selectSummitSpeaker,
  unselectAllSummitSpeakers,
  unselectSummitSpeaker
} from "../../../actions/speaker-actions";
import {
  exportSummitSubmitters,
  getSubmittersBySummit,
  initSubmittersList,
  selectAllSummitSubmitters,
  selectSummitSubmitter,
  unselectAllSummitSubmitters,
  unselectSummitSubmitter
} from "../../../actions/submitter-actions";
import { getMediaUploads } from "../../../actions/media-upload-actions";
import {
  MAX_PER_PAGE,
  SpeakersSources as sources
} from "../../../utils/constants";
import "../../../styles/speakers-list-page.less";
import SendEmailModal from "./components/send-email-modal";

const FILTER_ID = "summit_speakers_list";

const selectionStatusOptions = [
  { label: "Accepted", value: "accepted" },
  { label: "Alternate", value: "alternate" },
  { label: "Rejected", value: "rejected" },
  { label: "Only Rejected", value: "only_rejected" },
  { label: "Only Accepted", value: "only_accepted" },
  { label: "Only Alternate", value: "only_alternate" },
  { label: "Accepted/Alternate", value: "accepted_alternate" },
  { label: "Accepted/Rejected", value: "accepted_rejected" },
  { label: "Alternate/Rejected", value: "alternate_rejected" }
];

const getCriterias = (summit, mediaUploadTypes) => [
  {
    key: "presentations_selection_plan_id",
    label: "Selection Plan",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: summit.selection_plans.map((sp) => ({
          label: sp.name,
          value: sp.id
        })),
        placeholder: "Filter by Selection Plan",
        multiple: true
      }
    }
  },
  {
    key: "presentations_track_id",
    label: "Track",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: summit.tracks.map((t) => ({ label: t.name, value: t.id })),
        placeholder: "Filter by Track",
        multiple: true
      }
    }
  },
  {
    key: "presentations_type_id",
    label: "Activity Type",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: summit.event_types.map((type) => ({
          label: type.name,
          value: type.id
        })),
        placeholder: "Filter by Activity Type",
        multiple: true
      }
    }
  },
  {
    key: "selection_status",
    label: "Selection Status",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: [...selectionStatusOptions],
        placeholder: "Filter by Selection Status",
        multiple: true
      }
    },
    customParser: (f) => {
      const filter = [];

      if (Array.isArray(f.value) && f.value.length > 0) {
        // if user chose a combined option then we ignore single options, only single options can be combined
        const combinedOptions = [
          "only_rejected",
          "only_accepted",
          "only_alternate",
          "accepted_alternate",
          "accepted_rejected",
          "alternate_rejected"
        ];
        const hasCombinedOption = f.value.some((v) =>
          combinedOptions.includes(v)
        );

        f.value.forEach((val) => {
          switch (val) {
            case "only_rejected":
              filter.push("has_rejected_presentations==true");
              filter.push("has_accepted_presentations==false");
              filter.push("has_alternate_presentations==false");
              break;
            case "only_accepted":
              filter.push("has_rejected_presentations==false");
              filter.push("has_accepted_presentations==true");
              filter.push("has_alternate_presentations==false");
              break;
            case "only_alternate":
              filter.push("has_rejected_presentations==false");
              filter.push("has_accepted_presentations==false");
              filter.push("has_alternate_presentations==true");
              break;
            case "accepted_alternate":
              filter.push("has_rejected_presentations==false");
              filter.push("has_accepted_presentations==true");
              filter.push("has_alternate_presentations==true");
              break;
            case "accepted_rejected":
              filter.push("has_rejected_presentations==true");
              filter.push("has_accepted_presentations==true");
              filter.push("has_alternate_presentations==false");
              break;
            case "alternate_rejected":
              filter.push("has_rejected_presentations==true");
              filter.push("has_accepted_presentations==false");
              filter.push("has_alternate_presentations==true");
              break;
            case "accepted":
              if (!hasCombinedOption) {
                filter.push("has_accepted_presentations==true");
              }
              break;
            case "rejected":
              if (!hasCombinedOption) {
                filter.push("has_rejected_presentations==true");
              }
              break;
            case "alternate":
              if (!hasCombinedOption) {
                filter.push("has_alternate_presentations==true");
              }
              break;
            default:
              break;
          }
        });
      }
      return filter;
    }
  },
  {
    key: "presentations_track_group_id",
    label: "Track Group",
    operators: [OPERATORS.IS],
    values: {
      type: "select",
      props: {
        options: summit.track_groups.map((trackGroup) => ({
          label: trackGroup.name,
          value: trackGroup.id
        })),
        placeholder: "Filter by Track Groups",
        multiple: true
      }
    }
  },
  {
    key: "media_upload_with_type",
    label: "Media Upload Type",
    operators: [OPERATORS.HAS, OPERATORS.HAS_NOT],
    values: {
      type: "select",
      props: {
        options: mediaUploadTypes.map((type) => ({
          value: type.id,
          label: type.name
        })),
        placeholder: "Filter by Media Upload Type",
        multiple: true
      }
    },
    customParser: (f) => {
      const filter = [];

      if (f.operator === OPERATORS.HAS.value) {
        const value = Array.isArray(f.value) ? f.value.join("||") : f.value;
        filter.push(`has_media_upload_with_type==${value}`);
      } else {
        const value = Array.isArray(f.value) ? f.value.join("&&") : f.value;
        filter.push(`has_not_media_upload_with_type==${value}`);
      }

      return filter;
    }
  }
];

const sourceOptions = [
  {
    label: T.translate("summit_speakers_list.speakers"),
    value: sources.speakers
  },
  {
    label: T.translate("summit_submitters_list.submitters"),
    value: sources.submitters
  },
  {
    label: T.translate("summit_submitters_list.submitters_no_speakers"),
    value: sources.submitters_no_speakers
  }
];

const SummitSpeakersListPage = ({
  currentSummit,
  history,
  speakersProps,
  submittersProps,
  mediaUploadTypes,
  getMediaUploads,
  initSpeakersList,
  initSubmittersList,
  getSpeakersBySummit,
  getSubmittersBySummit,
  exportSummitSpeakers,
  exportSummitSubmitters,
  selectSummitSpeaker,
  unselectSummitSpeaker,
  selectSummitSubmitter,
  unselectSummitSubmitter,
  selectAllSummitSpeakers,
  selectAllSummitSubmitters,
  unselectAllSummitSpeakers,
  unselectAllSummitSubmitters
}) => {
  const [source, setSource] = useState(sources.speakers);
  const isSpeakerMode = source === sources.speakers;
  const subjectProps = isSpeakerMode ? speakersProps : submittersProps;
  const { parsedFilter, resetFilters } = useGridFilter(FILTER_ID);

  useEffect(() => {
    if (currentSummit) {
      getMediaUploads("", 1, MAX_PER_PAGE, "name", 1);
    }
  }, [currentSummit]);

  // reset filters if source changes
  useEffect(() => {
    initSubmittersList();
    initSpeakersList();
    resetFilters();
  }, [currentSummit, source]);

  // fetch speakers/submitters list if filters change
  useEffect(() => {
    if (currentSummit) {
      getBySummit();
    }
  }, [currentSummit, source, parsedFilter.join(",")]);

  const getBySummit = (params = {}) => {
    const { term, currentPage: page, perPage, order, orderDir } = subjectProps;

    const mergedParams = { term, page, perPage, order, orderDir, ...params };

    const getSubjects = isSpeakerMode
      ? getSpeakersBySummit
      : getSubmittersBySummit;

    const {
      term: t,
      page: p,
      perPage: pp,
      order: o,
      orderDir: od
    } = mergedParams;

    getSubjects(t, p, pp, o, od, parsedFilter, source);
  };

  const handleSourceChange = (ev) => {
    const { value } = ev.target;
    setSource(value);
  };

  const handleEdit = (itemId) => {
    if (isSpeakerMode) {
      history.push(`/app/speakers/${itemId}`);
    }
  };

  const handlePageChange = (page) => {
    getBySummit({ page });
  };

  const handleSort = (index, key, dir) => {
    getBySummit({ order: key, orderDir: dir });
  };

  const handleSearch = (term) => {
    getBySummit({ term });
  };

  const handleExport = (ev) => {
    ev.preventDefault();
    const { term, order, orderDir } = subjectProps;
    const exportSubjects = isSpeakerMode
      ? exportSummitSpeakers
      : exportSummitSubmitters;

    exportSubjects(term, order, orderDir, parsedFilter, source);
  };

  const handleSelected = (itemId, isSelected) => {
    const select = isSpeakerMode ? selectSummitSpeaker : selectSummitSubmitter;
    const unselect = isSpeakerMode
      ? unselectSummitSpeaker
      : unselectSummitSubmitter;

    if (isSelected) select(itemId);
    else unselect(itemId);
  };

  const handleSelectedAll = (ev) => {
    const selectedAll = ev.target.checked;
    const selectAll = isSpeakerMode
      ? selectAllSummitSpeakers
      : selectAllSummitSubmitters;
    const unselectAll = isSpeakerMode
      ? unselectAllSummitSpeakers
      : unselectAllSummitSubmitters;

    if (selectedAll) selectAll();
    else unselectAll();
  };

  const {
    items,
    lastPage,
    currentPage,
    term,
    order,
    orderDir,
    totalItems,
    selectedCount,
    selectedAll
  } = subjectProps;

  const columns = [
    {
      columnKey: "full_name",
      value: T.translate("general.name"),
      sortable: true
    },
    {
      columnKey: "email",
      value: T.translate("general.email"),
      sortable: true
    },
    {
      columnKey: "accepted_presentations_count",
      value: T.translate("summit_speakers_list.accepted")
    },
    {
      columnKey: "alternate_presentations_count",
      value: T.translate("summit_speakers_list.alternate")
    },
    {
      columnKey: "rejected_presentations_count",
      value: T.translate("summit_speakers_list.rejected")
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      edit: {
        onClick: handleEdit,
        onSelected: handleSelected,
        onSelectedAll: handleSelectedAll
      }
    },
    selectedAll
  };

  if (!currentSummit?.id) return <div />;

  return (
    <div className="container">
      <h3>
        {" "}
        {isSpeakerMode
          ? T.translate("summit_speakers_list.summit_speakers_list")
          : T.translate("summit_submitters_list.summit_submitters_list")}{" "}
        ({totalItems})
      </h3>
      <div className="row">
        <div className="col-md-6">
          <FreeTextSearch
            value={term ?? ""}
            placeholder={T.translate(
              "summit_speakers_list.placeholders.search_speakers"
            )}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-2">
          <Dropdown
            id="speakerSubmitterSourceSelector"
            value={source}
            onChange={handleSourceChange}
            options={sourceOptions}
            isClearable={false}
            placeholder="Select a source"
          />
        </div>
        <div className="col-md-2">
          <GridFilter
            id={FILTER_ID}
            criterias={getCriterias(currentSummit, mediaUploadTypes)}
          />
        </div>
        <div className="col-md-2 text-right">
          <button
            className="btn btn-default right-space"
            onClick={handleExport}
          >
            {T.translate("general.export")}
          </button>
        </div>
      </div>

      <SendEmailModal source={source} filters={parsedFilter} />

      {items.length === 0 && (
        <div>
          {isSpeakerMode
            ? T.translate("summit_speakers_list.no_speakers")
            : T.translate("summit_submitters_list.no_submitters")}
        </div>
      )}

      {items.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <span>
            <b>
              {T.translate("summit_speakers_list.items_qty", {
                qty: selectedCount
              })}
            </b>
          </span>
          <SelectableTable
            options={tableOptions}
            data={items}
            columns={columns}
            onSort={handleSort}
          />
          <Pagination
            bsSize="medium"
            prev
            next
            first
            last
            ellipsis
            boundaryLinks
            maxButtons={10}
            items={lastPage}
            activePage={currentPage}
            onSelect={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSummitSpeakersListState,
  currentSummitSubmittersListState,
  mediaUploadListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  speakersProps: currentSummitSpeakersListState,
  submittersProps: currentSummitSubmittersListState,
  mediaUploadTypes: mediaUploadListState.media_uploads
});

export default connect(mapStateToProps, {
  getMediaUploads,
  initSpeakersList,
  getSpeakersBySummit,
  exportSummitSpeakers,
  selectSummitSpeaker,
  unselectSummitSpeaker,
  selectAllSummitSpeakers,
  unselectAllSummitSpeakers,
  initSubmittersList,
  getSubmittersBySummit,
  exportSummitSubmitters,
  selectSummitSubmitter,
  unselectSummitSubmitter,
  selectAllSummitSubmitters,
  unselectAllSummitSubmitters
})(SummitSpeakersListPage);
