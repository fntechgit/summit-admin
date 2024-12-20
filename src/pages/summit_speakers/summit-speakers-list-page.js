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

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { Modal, Pagination } from "react-bootstrap";
import {
  FreeTextSearch,
  SelectableTable,
  Dropdown,
  Input
} from "openstack-uicore-foundation/lib/components";
import SpeakerPromoCodeSpecForm from "../../components/forms/speakers-promo-code-spec-form";
import {
  initSpeakersList,
  getSpeakersBySummit,
  exportSummitSpeakers,
  selectSummitSpeaker,
  unselectSummitSpeaker,
  selectAllSummitSpeakers,
  unselectAllSummitSpeakers,
  setCurrentFlowEvent,
  sendSpeakerEmails
} from "../../actions/speaker-actions";
import {
  initSubmittersList,
  getSubmittersBySummit,
  exportSummitSubmitters,
  selectSummitSubmitter,
  unselectSummitSubmitter,
  selectAllSummitSubmitters,
  unselectAllSummitSubmitters,
  setCurrentSubmitterFlowEvent,
  sendSubmitterEmails
} from "../../actions/submitter-actions";
import {
  validateSpecs,
  resetPromoCodeSpecForm
} from "../../actions/promocode-specification-actions";
import {
  EXISTING_SPEAKERS_PROMO_CODE,
  EXISTING_SPEAKERS_DISCOUNT_CODE,
  AUTO_GENERATED_SPEAKERS_PROMO_CODE,
  AUTO_GENERATED_SPEAKERS_DISCOUNT_CODE
} from "../../actions/promocode-actions";

import { ALL_FILTER, SpeakersSources as sources } from "../../utils/constants";
import { validateEmail } from "../../utils/methods";
import MediaTypeFilter from "../../components/filters/media-type-filter";

import "../../styles/speakers-list-page.less";

class SummitSpeakersListPage extends React.Component {
  constructor(props) {
    super(props);

    this.getSubjectProps = this.getSubjectProps.bind(this);
    this.export = this.export.bind(this);
    this.getBySummit = this.getBySummit.bind(this);
    this.handleSpeakerSubmitterSourceChange =
      this.handleSpeakerSubmitterSourceChange.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.handleSelected = this.handleSelected.bind(this);
    this.handleSelectedAll = this.handleSelectedAll.bind(this);
    this.handleChangeSelectionPlanFilter =
      this.handleChangeSelectionPlanFilter.bind(this);
    this.handleChangeTrackFilter = this.handleChangeTrackFilter.bind(this);
    this.handleChangeTrackGroupFilter =
      this.handleChangeTrackGroupFilter.bind(this);
    this.handleChangeActivityTypeFilter =
      this.handleChangeActivityTypeFilter.bind(this);
    this.handleChangeSelectionStatusFilter =
      this.handleChangeSelectionStatusFilter.bind(this);
    this.handleChangeFlowEvent = this.handleChangeFlowEvent.bind(this);
    this.showEmailSendModal = this.showEmailSendModal.bind(this);
    this.handleSendEmails = this.handleSendEmails.bind(this);
    this.handleChangePromoCodeStrategy =
      this.handleChangePromoCodeStrategy.bind(this);
    this.handleOrAndFilter = this.handleOrAndFilter.bind(this);
    this.handleChangeMediaUploadTypeFilter =
      this.handleChangeMediaUploadTypeFilter.bind(this);

    this.state = {
      testRecipient: "",
      showSendEmailModal: false,
      excerptRecipient: "",
      source: sources.speakers,
      promoCodeStrategy: 0,
      speakerFilters: {
        orAndFilter: ALL_FILTER
      }
    };
  }

  componentDidMount() {
    const { currentSummit, initSubmittersList, initSpeakersList } = this.props;
    initSubmittersList();
    initSpeakersList();
    if (currentSummit) {
      const {
        term,
        page,
        order,
        orderDir,
        perPage,
        selectionPlanFilter,
        trackFilter,
        trackGroupFilter,
        activityTypeFilter,
        selectionStatusFilter,
        mediaUploadTypeFilter
      } = this.getSubjectProps();
      const {
        speakerFilters: { orAndFilter }
      } = this.state;
      this.getBySummit(term, page, perPage, order, orderDir, {
        selectionPlanFilter,
        trackFilter,
        trackGroupFilter,
        activityTypeFilter,
        selectionStatusFilter,
        orAndFilter,
        mediaUploadTypeFilter
      });
    }
  }

  getSubjectProps() {
    const { source } = this.state;
    return source === sources.speakers
      ? this.props.speakersProps
      : this.props.submittersProps;
  }

  getBySummit(term, page, perPage, order, orderDir, filters) {
    const { source } = this.state;
    const callable =
      source === sources.speakers
        ? this.props.getSpeakersBySummit
        : this.props.getSubmittersBySummit;
    callable(term, page, perPage, order, orderDir, filters, source);
  }

  export(term, order, orderDir, filters) {
    const { source } = this.state;
    const callable =
      source === sources.speakers
        ? this.props.exportSummitSpeakers
        : this.props.exportSummitSubmitters;
    callable(term, order, orderDir, filters, source);
  }

  handleSpeakerSubmitterSourceChange(ev) {
    const { value } = ev.target;
    const {
      term,
      order,
      orderDir,
      perPage,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    const { initSubmittersList, initSpeakersList } = this.props;
    this.setState({ ...this.state, source: value }, function () {
      initSubmittersList();
      initSpeakersList();
      this.getBySummit(term, 1, perPage, order, orderDir, {
        selectionPlanFilter,
        trackFilter,
        trackGroupFilter,
        activityTypeFilter,
        selectionStatusFilter,
        orAndFilter,
        mediaUploadTypeFilter
      });
    });
  }

  handleEdit(itemId) {
    if (this.state.source === sources.speakers) {
      const { history } = this.props;
      history.push(`/app/speakers/${itemId}`);
    }
  }

  handlePageChange(page) {
    const {
      term,
      order,
      orderDir,
      perPage,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    this.getBySummit(term, page, perPage, order, orderDir, {
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      orAndFilter,
      mediaUploadTypeFilter
    });
  }

  handleSort(index, key, dir) {
    const {
      term,
      page,
      perPage,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    this.getBySummit(term, page, perPage, key, dir, {
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      orAndFilter,
      mediaUploadTypeFilter
    });
  }

  handleSearch(term) {
    const {
      order,
      orderDir,
      page,
      perPage,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    this.getBySummit(term, page, perPage, order, orderDir, {
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      orAndFilter,
      mediaUploadTypeFilter
    });
  }

  handleChangeSelectionPlanFilter(ev) {
    const { value: newSelectionPlanFilter } = ev.target;
    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    this.getBySummit(term, page, perPage, order, orderDir, {
      selectionPlanFilter: newSelectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      orAndFilter,
      mediaUploadTypeFilter
    });
  }

  handleChangeTrackFilter(ev) {
    const { value: newTrackFilter } = ev.target;
    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      selectionPlanFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    this.getBySummit(term, page, perPage, order, orderDir, {
      selectionPlanFilter,
      trackFilter: newTrackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      orAndFilter,
      mediaUploadTypeFilter
    });
  }

  handleChangeTrackGroupFilter(ev) {
    const { value: newTrackGroupFilter } = ev.target;
    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      selectionPlanFilter,
      trackFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    this.getBySummit(term, page, perPage, order, orderDir, {
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter: newTrackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      orAndFilter,
      mediaUploadTypeFilter
    });
  }

  handleChangeActivityTypeFilter(ev) {
    const { value: newActivityTypeFilter } = ev.target;
    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    this.getBySummit(term, page, perPage, order, orderDir, {
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter: newActivityTypeFilter,
      selectionStatusFilter,
      orAndFilter,
      mediaUploadTypeFilter
    });
  }

  handleChangeMediaUploadTypeFilter(ev) {
    const { value, operator } = ev.target;
    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      activityTypeFilter,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    if (operator && value.length > 0) {
      this.getBySummit(term, page, perPage, order, orderDir, {
        selectionPlanFilter,
        trackFilter,
        trackGroupFilter,
        activityTypeFilter,
        selectionStatusFilter,
        orAndFilter,
        mediaUploadTypeFilter: { operator, value }
      });
      // get speakers if the media upload types filter is clear
    } else if (mediaUploadTypeFilter.value.length > 0 && value.length === 0) {
      this.getBySummit(term, page, perPage, order, orderDir, {
        selectionPlanFilter,
        trackFilter,
        trackGroupFilter,
        activityTypeFilter,
        selectionStatusFilter,
        orAndFilter,
        mediaUploadTypeFilter: { operator: null, value: [] }
      });
    }
  }

  handleChangeSelectionStatusFilter(ev) {
    let { value: newSelectionStatusFilter } = ev.target;
    // exclusive filters tests ....
    if (newSelectionStatusFilter.includes("only_rejected")) {
      newSelectionStatusFilter = ["only_rejected"];
    } else if (newSelectionStatusFilter.includes("only_alternate")) {
      newSelectionStatusFilter = ["only_alternate"];
    } else if (newSelectionStatusFilter.includes("only_accepted")) {
      newSelectionStatusFilter = ["only_accepted"];
    } else if (newSelectionStatusFilter.includes("accepted_alternate")) {
      newSelectionStatusFilter = ["accepted_alternate"];
    } else if (newSelectionStatusFilter.includes("accepted_rejected")) {
      newSelectionStatusFilter = ["accepted_rejected"];
    } else if (newSelectionStatusFilter.includes("alternate_rejected")) {
      newSelectionStatusFilter = ["alternate_rejected"];
    }

    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    this.getBySummit(term, page, perPage, order, orderDir, {
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      orAndFilter,
      selectionStatusFilter: newSelectionStatusFilter,
      mediaUploadTypeFilter
    });
  }

  handleChangeFlowEvent(ev) {
    const { value } = ev.target;
    const { source } = this.state;
    if (source === sources.speakers) {
      this.props.setCurrentFlowEvent(value);
    } else {
      this.props.setCurrentSubmitterFlowEvent(value);
    }
  }

  handleSendEmails(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    const { currentPromocodeSpecification } = this.props;
    const { promoCodeStrategy, testRecipient, source } = this.state;
    const isSpeakerMode = source === sources.speakers;
    const excerptRecipient = this.ingestEmailRef.value;
    const shouldSendCopy2Submitter =
      isSpeakerMode && this.shouldSendCopy2SubmitterRef.checked;
    const {
      term,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;

    this.props.validateSpecs(
      promoCodeStrategy,
      currentPromocodeSpecification.entity,
      () => {
        this.setState({
          showSendEmailModal: false,
          excerptRecipient: "",
          testRecipient: "",
          promoCodeStrategy: 0
        });
        // send emails

        const callable = isSpeakerMode
          ? this.props.sendSpeakerEmails
          : this.props.sendSubmitterEmails;

        callable(
          term,
          {
            selectionPlanFilter,
            trackFilter,
            trackGroupFilter,
            activityTypeFilter,
            selectionStatusFilter,
            orAndFilter,
            mediaUploadTypeFilter
          },
          testRecipient,
          excerptRecipient,
          shouldSendCopy2Submitter,
          source,
          promoCodeStrategy,
          currentPromocodeSpecification.entity
        );
      }
    );
  }

  handleChangePromoCodeStrategy(ev) {
    const { value } = ev.target;
    this.setState({ ...this.state, promoCodeStrategy: value });
    this.props.resetPromoCodeSpecForm();
  }

  showEmailSendModal(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    const { source, testRecipient } = this.state;
    const { currentFlowEvent, selectedCount } = this.getSubjectProps();

    if (!currentFlowEvent) {
      Swal.fire(
        "Validation error",
        T.translate("summit_speakers_list.select_template"),
        "warning"
      );
      return false;
    }

    if (selectedCount === 0) {
      const content =
        source === sources.speakers
          ? T.translate("summit_speakers_list.select_items")
          : T.translate("summit_submitters_list.select_items");
      Swal.fire("Validation error", content, "warning");
      return false;
    }

    if (testRecipient !== "" && !validateEmail(testRecipient)) {
      Swal.fire(
        "Validation error",
        T.translate("summit_speakers_list.invalid_recipient_email"),
        "warning"
      );
      return false;
    }

    this.setState({
      ...this.state,
      showSendEmailModal: true,
      excerptRecipient: ""
    });
  }

  handleExport(ev) {
    const {
      term,
      order,
      orderDir,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    const {
      speakerFilters: { orAndFilter }
    } = this.state;
    ev.preventDefault();
    this.export(term, order, orderDir, {
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      orAndFilter,
      mediaUploadTypeFilter
    });
  }

  handleSelected(item_id, isSelected) {
    const { source } = this.state;
    if (isSelected) {
      if (source === sources.speakers) {
        this.props.selectSummitSpeaker(item_id);
      } else {
        this.props.selectSummitSubmitter(item_id);
      }
      return;
    }
    if (source === sources.speakers) {
      this.props.unselectSummitSpeaker(item_id);
    } else {
      this.props.unselectSummitSubmitter(item_id);
    }
  }

  handleSelectedAll(ev) {
    const selectedAll = ev.target.checked;
    const { source } = this.state;
    if (source === sources.speakers) {
      this.props.selectAllSummitSpeakers();
    } else {
      this.props.selectAllSummitSubmitters();
    }
    if (!selectedAll) {
      // clear all selected
      if (source === sources.speakers) {
        this.props.unselectAllSummitSpeakers();
      } else {
        this.props.unselectAllSummitSubmitters();
      }
    }
  }

  handleOrAndFilter(ev) {
    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      trackFilter,
      trackGroupFilter,
      selectionPlanFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter
    } = this.getSubjectProps();
    this.setState({
      ...this.state,
      speakerFilters: { ...this.state.speakerFilters, orAndFilter: ev }
    });
    this.getBySummit(term, page, perPage, order, orderDir, {
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      mediaUploadTypeFilter,
      selectionStatusFilter,
      orAndFilter: ev
    });
  }

  render() {
    const { currentSummit, currentPromocodeSpecification } = this.props;

    const { testRecipient, source, promoCodeStrategy } = this.state;

    const {
      items,
      lastPage,
      currentPage,
      term,
      order,
      orderDir,
      totalItems,
      selectedCount,
      selectedAll,
      selectionPlanFilter,
      trackFilter,
      trackGroupFilter,
      activityTypeFilter,
      selectionStatusFilter,
      mediaUploadTypeFilter,
      currentFlowEvent
    } = this.getSubjectProps();

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

    const selectionPlansDDL = currentSummit.selection_plans.map(
      (selectionPlan) => ({
        label: selectionPlan.name,
        value: selectionPlan.id
      })
    );
    const tracksDDL = currentSummit.tracks.map((track) => ({
      label: track.name,
      value: track.id
    }));
    const trackGroupsDDL = currentSummit.track_groups.map((trackGroup) => ({
      label: trackGroup.name,
      value: trackGroup.id
    }));
    const activityTypesDDL = currentSummit.event_types.map((type) => ({
      label: type.name,
      value: type.id
    }));

    const selectionStatusDDL = [
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

    const speakerSubmitterSourceSelectorDDL = [
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

    const emailFlowDDL =
      this.state.source === sources.speakers
        ? [
            { label: "-- SELECT EMAIL EVENT --", value: "" },
            {
              label:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_ALTERNATE",
              value:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_ALTERNATE"
            },
            {
              label:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_REJECTED",
              value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_REJECTED"
            },
            {
              label:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ALTERNATE_REJECTED",
              value:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ALTERNATE_REJECTED"
            },
            {
              label: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_ONLY",
              value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_ONLY"
            },
            {
              label: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ALTERNATE_ONLY",
              value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ALTERNATE_ONLY"
            },
            {
              label: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_REJECTED_ONLY",
              value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_REJECTED_ONLY"
            }
          ]
        : [
            { label: "-- SELECT EMAIL EVENT --", value: "" },
            {
              label:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_ALTERNATE",
              value:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_ALTERNATE"
            },
            {
              label:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_REJECTED",
              value:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_REJECTED"
            },
            {
              label:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ALTERNATE_REJECTED",
              value:
                "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ALTERNATE_REJECTED"
            },
            {
              label: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_ONLY",
              value: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_ONLY"
            },
            {
              label: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ALTERNATE_ONLY",
              value: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ALTERNATE_ONLY"
            },
            {
              label: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_REJECTED_ONLY",
              value: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_REJECTED_ONLY"
            }
          ];

    const promoCodeStrategiesDDL = [
      {
        label: T.translate("summit_speakers_list.select_promo_code_strategy"),
        value: 0
      },
      {
        label: T.translate("summit_speakers_list.select_speaker_promo_code"),
        value: EXISTING_SPEAKERS_PROMO_CODE
      },
      {
        label: T.translate("summit_speakers_list.select_speaker_discount_code"),
        value: EXISTING_SPEAKERS_DISCOUNT_CODE
      },
      {
        label: T.translate(
          "summit_speakers_list.select_auto_generate_speaker_promo_code"
        ),
        value: AUTO_GENERATED_SPEAKERS_PROMO_CODE
      },
      {
        label: T.translate(
          "summit_speakers_list.select_auto_generate_speaker_discount_code"
        ),
        value: AUTO_GENERATED_SPEAKERS_DISCOUNT_CODE
      }
    ];

    const table_options = {
      sortCol: order,
      sortDir: orderDir,
      actions: {
        edit: {
          onClick: this.handleEdit,
          onSelected: this.handleSelected,
          onSelectedAll: this.handleSelectedAll
        }
      },
      selectedAll
    };

    if (!currentSummit.id) return <div />;

    return (
      <div className="container">
        <h3>
          {" "}
          {this.state.source === sources.speakers
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
              onSearch={this.handleSearch}
            />
          </div>
          <div className="col-md-3">
            <Dropdown
              id="speakerSubmitterSourceSelector"
              value={source}
              onChange={this.handleSpeakerSubmitterSourceChange}
              options={speakerSubmitterSourceSelectorDDL}
              isClearable={false}
              placeholder="Select a source"
            />
          </div>
          <div className="col-md-3 text-right">
            <button
              className="btn btn-default right-space"
              onClick={this.handleExport}
            >
              {T.translate("general.export")}
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col-md-3 speaker-list-filter-col">
            <Dropdown
              id="selectionPlanFilter"
              value={selectionPlanFilter}
              onChange={this.handleChangeSelectionPlanFilter}
              options={selectionPlansDDL}
              isClearable
              placeholder="Filter By Selection Plan"
              isMulti
            />
          </div>
          <div className="col-md-3 speaker-list-filter-col">
            <Dropdown
              id="trackFilter"
              value={trackFilter}
              onChange={this.handleChangeTrackFilter}
              options={tracksDDL}
              isClearable
              placeholder="Filter By Track"
              isMulti
            />
          </div>
          <div className="col-md-3 speaker-list-filter-col">
            <Dropdown
              id="activityTypeFilter"
              value={activityTypeFilter}
              onChange={this.handleChangeActivityTypeFilter}
              options={activityTypesDDL}
              isClearable
              placeholder="Filter By Activity Type"
              isMulti
            />
          </div>
          <div className="col-md-3 speaker-list-filter-col">
            <Dropdown
              id="selectionStatusFilter"
              value={selectionStatusFilter}
              onChange={this.handleChangeSelectionStatusFilter}
              options={selectionStatusDDL}
              isClearable
              placeholder="Filter By Selection Status"
              isMulti
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-3 speaker-list-filter-col">
            <Dropdown
              id="trackGroupFilter"
              value={trackGroupFilter}
              onChange={this.handleChangeTrackGroupFilter}
              options={trackGroupsDDL}
              isClearable
              placeholder="Filter By Track Group"
              isMulti
            />
          </div>
          <div className="col-md-9 speaker-list-filter-col">
            <MediaTypeFilter
              id="media_upload_with_type"
              operatorInitialValue={mediaUploadTypeFilter.operator}
              filterInitialValue={mediaUploadTypeFilter.value}
              summitId={currentSummit.id}
              onChange={this.handleChangeMediaUploadTypeFilter}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 speaker-list-email-col">
            <Dropdown
              id="activityTypeFilter"
              value={currentFlowEvent}
              onChange={this.handleChangeFlowEvent}
              options={emailFlowDDL}
              isClearable
            />
          </div>
          <div className="col-md-4 speaker-list-email-col">
            <Input
              value={testRecipient}
              onChange={(ev) =>
                this.setState({ testRecipient: ev.target.value })
              }
              placeholder={T.translate(
                "summit_speakers_list.placeholders.test_recipient"
              )}
            />
          </div>
          <div className="col-md-2 speaker-list-email-col">
            <button
              className="btn btn-default right-space"
              onClick={this.showEmailSendModal}
            >
              {T.translate("summit_speakers_list.send_emails")}
            </button>
          </div>
        </div>

        {items.length === 0 && (
          <div>
            {this.state.source === sources.speakers
              ? T.translate("summit_speakers_list.no_speakers")
              : T.translate("summit_submitters_list.no_submitters")}
          </div>
        )}

        {items.length > 0 && (
          <div>
            <span>
              <b>
                {T.translate("summit_speakers_list.items_qty", {
                  qty: selectedCount
                })}
              </b>
            </span>
            <SelectableTable
              options={table_options}
              data={items}
              columns={columns}
              onSort={this.handleSort}
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
              onSelect={this.handlePageChange}
            />

            <Modal
              show={this.state.showSendEmailModal}
              onHide={() =>
                this.setState({ ...this.state, showSendEmailModal: false })
              }
              backdrop={false}
            >
              <Modal.Header closeButton>
                <Modal.Title>
                  {this.state.source === sources.speakers
                    ? T.translate("summit_speakers_list.send_emails_title")
                    : T.translate("summit_submitters_list.send_emails_title")}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="row">
                  <div className="col-md-12">
                    {T.translate("summit_speakers_list.send_email_warning", {
                      template: currentFlowEvent,
                      qty: selectedCount
                    })}
                  </div>
                  {this.state.testRecipient !== "" && (
                    <div className="col-md-12">
                      {T.translate(
                        "summit_speakers_list.email_test_recipient",
                        {
                          email: this.state.testRecipient
                        }
                      )}
                    </div>
                  )}
                  <div className="col-md-12" style={{ paddingTop: "15px" }}>
                    <label>
                      {T.translate("summit_speakers_list.promo_code_strategy")}
                    </label>
                    <br />
                    <Dropdown
                      id="promoCodeStrategySelector"
                      value={promoCodeStrategy}
                      onChange={this.handleChangePromoCodeStrategy}
                      options={promoCodeStrategiesDDL}
                      isClearable
                    />
                  </div>
                  <div className="col-md-12">
                    <SpeakerPromoCodeSpecForm
                      promoCodeStrategy={promoCodeStrategy}
                      summit={currentSummit}
                      entity={currentPromocodeSpecification.entity}
                      errors={currentPromocodeSpecification.errors}
                    />
                  </div>
                  <div
                    className="col-md-12 ticket-ingest-email-wrapper"
                    style={{ paddingTop: "5px" }}
                  >
                    <label>
                      {T.translate("summit_speakers_list.excerpt_email")}
                    </label>
                    <br />
                    <input
                      id="ingest_email"
                      className="form-control"
                      ref={(node) => {
                        this.ingestEmailRef = node;
                      }}
                    />
                  </div>
                  {this.state.source === sources.speakers && (
                    <div
                      className="col-md-12 ticket-ingest-email-wrapper"
                      style={{ paddingTop: "3px" }}
                    >
                      <div className="form-check abc-checkbox">
                        <input
                          id="should_send_copy_2_submitter"
                          className="form-check-input"
                          type="checkbox"
                          ref={(node) => {
                            this.shouldSendCopy2SubmitterRef = node;
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="should_send_copy_2_submitter"
                        >
                          {T.translate(
                            "summit_speakers_list.should_send_copy_2_submitter"
                          )}
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <button
                  className="btn btn-primary right-space"
                  onClick={this.handleSendEmails}
                >
                  {T.translate("summit_speakers_list.send_emails")}
                </button>
                <button
                  className="btn btn-default"
                  onClick={() =>
                    this.setState({ ...this.state, showSendEmailModal: false })
                  }
                >
                  {T.translate("general.cancel")}
                </button>
              </Modal.Footer>
            </Modal>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentSummitSpeakersListState,
  currentSummitSubmittersListState,
  currentPromocodeSpecificationState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  speakersProps: currentSummitSpeakersListState,
  submittersProps: currentSummitSubmittersListState,
  currentPromocodeSpecification: currentPromocodeSpecificationState
});

export default connect(mapStateToProps, {
  initSpeakersList,
  getSpeakersBySummit,
  exportSummitSpeakers,
  selectSummitSpeaker,
  unselectSummitSpeaker,
  selectAllSummitSpeakers,
  unselectAllSummitSpeakers,
  setCurrentFlowEvent,
  sendSpeakerEmails,
  initSubmittersList,
  getSubmittersBySummit,
  exportSummitSubmitters,
  selectSummitSubmitter,
  unselectSummitSubmitter,
  selectAllSummitSubmitters,
  unselectAllSummitSubmitters,
  setCurrentSubmitterFlowEvent,
  sendSubmitterEmails,
  validateSpecs,
  resetPromoCodeSpecForm
})(SummitSpeakersListPage);
