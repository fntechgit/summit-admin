import React from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { Breadcrumb } from "react-breadcrumbs";
import { Pagination } from "react-bootstrap";
import {
  AjaxLoader,
  Dropdown,
  FreeTextSearch
} from "openstack-uicore-foundation/lib/components";
import T from "i18n-react/dist/i18n-react";
import {
  exportReport,
  getReport,
  getMetricRaw
} from "../../actions/report-actions";
import FragmentParser from "../../utils/fragmen-parser";
import { getMembersForEventCSV } from "../../actions/member-actions";
import {
  TrackFilter,
  TypeFilter,
  RoomFilter,
  PublishedFilter,
  PublishedInFilter,
  StatusFilter,
  SelectionStatusFilter,
  SubmissionStatusFilter,
  AttendanceFilter,
  MediaFilter
} from "../filters";
import ExportData from "../export";
import { getOrderExtraQuestions } from "../../actions/order-actions";
import { getBadgeFeatures } from "../../actions/badge-actions";

const wrapReport = (ReportComponent, specs) => {
  class ReportBase extends React.Component {
    constructor(props) {
      super(props);

      this.state = {};

      this.reportRef = React.createRef();
      this.fragmentParser = new FragmentParser();
      this.buildQuery = this.buildQuery.bind(this);
      this.handleSort = this.handleSort.bind(this);
      this.handlePageChange = this.handlePageChange.bind(this);
      this.handleSearch = this.handleSearch.bind(this);
      this.handleExportReport = this.handleExportReport.bind(this);
      this.handleReload = this.handleReload.bind(this);
      this.handleGetReport = this.handleGetReport.bind(this);
      this.renderFilters = this.renderFilters.bind(this);
    }

    componentDidMount() {
      if (!this.props.currentSummit) return;

      if (!specs?.preventInitialLoad) {
        this.handleGetReport(1);
      }
    }

    buildFiltersForQuery(filters, summitId) {
      const { exclude_attendance, only_media, published_in, ...otherFilters } =
        filters;

      if (exclude_attendance) {
        const filterQS = `${exclude_attendance}ForSummit`;
        otherFilters[filterQS] = `${summitId},true`;
      }

      if (only_media) {
        otherFilters.attendingMediaForSummit = `${summitId},true`;
      }

      if (published_in) {
        otherFilters.publishedIn = summitId;
      }

      if (this.reportRef.current.translateFilters) {
        return this.reportRef.current.translateFilters(otherFilters);
      }

      return otherFilters;
    }

    buildQuery(page, perPageOverride = null) {
      let { perPage, currentSummit } = this.props;
      const { sort, sortdir, search, ...filters } =
        this.fragmentParser.getParams();
      let queryFilters = {};
      let listFilters = {};
      perPage = perPageOverride || perPage;

      if (specs.pagination) {
        queryFilters = { limit: perPage };
        if (page !== 1) {
          queryFilters.offset = (page - 1) * perPage;
        }
      }

      if (search) {
        listFilters.search = decodeURIComponent(search);
      }

      if (filters) {
        const queryFilters = this.buildFiltersForQuery(
          filters,
          currentSummit.id
        );
        listFilters = { ...listFilters, ...queryFilters };
      }

      const query = this.reportRef.current.buildReportQuery(
        queryFilters,
        listFilters,
        sort,
        sortdir
      );

      return `{ reportData: ${query} }`;
    }

    handleReload() {
      this.handleGetReport(1);
    }

    handlePageChange(page) {
      this.handleGetReport(page);
    }

    handleSearch(term) {
      this.fragmentParser.setParam("search", term);
      window.location.hash = this.fragmentParser.serialize();
      this.handleGetReport(1);
    }

    handleSort(index, key, dir) {
      this.fragmentParser.setParam("sort", key);
      this.fragmentParser.setParam("sortdir", dir);
      window.location.hash = this.fragmentParser.serialize();

      this.handleGetReport(1);
    }

    handleExportReport(ev) {
      ev.preventDefault();
      const grouped = specs.hasOwnProperty("grouped");
      const name = this.reportRef.current.getName();
      this.props.exportReport(
        this.buildQuery,
        name,
        grouped,
        this.reportRef.current.preProcessData.bind(this.reportRef.current)
      );
    }

    handleGetReport(page) {
      const query = this.buildQuery(page);
      const name = this.reportRef.current.getName();
      this.props.getReport(query, name, page);
    }

    handleFilterChange = (filter, value, isMulti = false) => {
      const theValue = isMulti ? value.join(",") : value;
      this.fragmentParser.setParam(filter, theValue);
      window.location.hash = this.fragmentParser.serialize();
      this.handleReload();
    };

    renderFilters() {
      const { currentSummit } = this.props;
      const filterHtml = [];
      const { sort, sortdir, search, ...filters } =
        this.fragmentParser.getParams();

      if (specs.filters.includes("track")) {
        const filterValue = filters.hasOwnProperty("track")
          ? filters.track
          : null;
        filterHtml.push(
          <div className="col-md-3" key="track-filter">
            <TrackFilter
              value={filterValue}
              tracks={currentSummit.tracks}
              onChange={(value) => {
                this.handleFilterChange("track", value, true);
              }}
              isMulti
            />
          </div>
        );
      }

      if (specs.filters.includes("type")) {
        const filterValue = filters.hasOwnProperty("type")
          ? filters.type
          : null;
        filterHtml.push(
          <div className="col-md-3" key="type-filter">
            <TypeFilter
              value={filterValue}
              types={currentSummit.event_types}
              onChange={(value) => {
                this.handleFilterChange("type", value, true);
              }}
              isMulti
            />
          </div>
        );
      }

      if (specs.filters.includes("room")) {
        const filterValue = filters.hasOwnProperty("room")
          ? filters.room
          : null;
        filterHtml.push(
          <div className="col-md-3" key="room-filter">
            <RoomFilter
              value={filterValue}
              onChange={(value) => {
                this.handleFilterChange("room", value, true);
              }}
              isMulti
              summitId={currentSummit.id}
            />
          </div>
        );
      }

      if (specs.filters.includes("published")) {
        const filterValue = filters.hasOwnProperty("published")
          ? filters.published
          : null;
        filterHtml.push(
          <div className="col-md-3" key="published-filter">
            <PublishedFilter
              value={filterValue}
              onChange={(value) => {
                this.handleFilterChange("published", value);
              }}
            />
          </div>
        );
      }

      if (specs.filters.includes("published_in")) {
        const filterValue = filters.hasOwnProperty("published_in")
          ? filters.published_in
          : null;
        filterHtml.push(
          <div className="col-md-3" key="published-in-filter">
            <PublishedInFilter
              value={filterValue}
              onChange={(value) => {
                this.handleFilterChange("published_in", value);
              }}
            />
          </div>
        );
      }

      if (specs.filters.includes("status")) {
        const filterValue = filters.hasOwnProperty("status")
          ? filters.status
          : null;
        filterHtml.push(
          <div className="col-md-3" key="status-filter">
            <StatusFilter
              value={filterValue}
              onChange={(value) => {
                this.handleFilterChange("status", value);
              }}
            />
          </div>
        );
      }

      if (specs.filters.includes("attendance")) {
        const filterValue = filters.hasOwnProperty("exclude_attendance")
          ? filters.exclude_attendance
          : null;
        filterHtml.push(
          <div className="col-md-3" key="attendance-filter">
            <AttendanceFilter
              value={filterValue}
              onChange={(value) => {
                this.handleFilterChange("exclude_attendance", value);
              }}
            />
          </div>
        );
      }

      if (specs.filters.includes("media")) {
        const filterValue = filters.hasOwnProperty("only_media")
          ? filters.only_media
          : null;
        filterHtml.push(
          <div className="col-md-3" key="only-media-filter">
            <MediaFilter
              value={filterValue}
              onChange={(value) => {
                this.handleFilterChange("only_media", value);
              }}
            />
          </div>
        );
      }

      if (specs.filters.includes("selection_plan")) {
        const filterValue = filters.hasOwnProperty("selection_plan")
          ? filters.selection_plan
          : [];

        const selection_plans_ddl = currentSummit.selection_plans.map((et) => ({
          value: et.id,
          label: et.name
        }));

        filterHtml.push(
          <div className="col-md-4" key="selection-plan-filter">
            <label>{T.translate("reports.selection_plan_filter")}</label>
            <Dropdown
              id="selection_plan_id_filter"
              placeholder={T.translate("reports.placeholders.selection_plan")}
              value={filterValue}
              onChange={({ target: { value } }) =>
                this.handleFilterChange("selection_plan", value, true)
              }
              options={selection_plans_ddl}
              isClearable
              isMulti
            />
          </div>
        );
      }

      if (specs.filters.includes("selection_status")) {
        const filterValue = filters.hasOwnProperty("selection_status")
          ? filters.selection_status?.split(",") ?? []
          : [];
        filterHtml.push(
          <div className="col-md-4" key="selection-status-filter">
            <SelectionStatusFilter
              value={filterValue}
              isMulti
              onChange={(value) => {
                this.handleFilterChange("selection_status", value);
              }}
            />
          </div>
        );
      }

      if (specs.filters.includes("submission_status")) {
        const filterValue = filters.hasOwnProperty("submission_status")
          ? filters.submission_status?.split(",") ?? []
          : [];
        filterHtml.push(
          <div className="col-md-4" key="submission-status-filter">
            <SubmissionStatusFilter
              value={filterValue}
              isMulti
              onChange={(value) => {
                this.handleFilterChange("submission_status", value);
              }}
            />
          </div>
        );
      }

      if (specs.filters.includes("empty_bio")) {
        const filterValue = filters.hasOwnProperty("empty_bio")
          ? filters.empty_bio
          : false;
        filterHtml.push(
          <div className="col-md-3" key="empty-bio-filter">
            <input
              type="checkbox"
              id="empty_bio"
              checked={filterValue}
              onChange={(ev) => {
                this.handleFilterChange("empty_bio", ev.target.checked);
              }}
              className="form-check-input"
            />
            <label className="form-check-label" htmlFor="empty_bio">
              {T.translate("reports.speaker_empty_bio_filter")}
            </label>
          </div>
        );
      }

      if (specs.filters.includes("empty_photo")) {
        const filterValue = filters.hasOwnProperty("empty_photo")
          ? filters.empty_photo
          : false;
        filterHtml.push(
          <div className="col-md-3" key="empty-photo-filter">
            <input
              type="checkbox"
              id="empty_photo"
              checked={filterValue}
              onChange={(ev) => {
                this.handleFilterChange("empty_photo", ev.target.checked);
              }}
              className="form-check-input"
            />
            <label className="form-check-label" htmlFor="has_photo">
              {T.translate("reports.speaker_empty_photo_filter")}
            </label>
          </div>
        );
      }

      const wrappedFilters = [];
      const step = 4;
      for (let i = 0; i < filterHtml.length; i += step) {
        const rowElements = filterHtml.slice(i, i + step);
        wrappedFilters.push(
          <div className="row" key={`row-${i / step}`}>
            {rowElements}
          </div>
        );
      }

      return wrappedFilters;
    }

    render() {
      const {
        match,
        currentPage,
        totalCount,
        perPage,
        exportData,
        exportingReport,
        exportProgress
      } = this.props;
      const { sort, sortdir, search, ...filters } =
        this.fragmentParser.getParams();
      const pageCount = Math.ceil(totalCount / perPage);

      const reportName = this.reportRef.current
        ? this.reportRef.current.getName()
        : "report";
      const grouped = specs.hasOwnProperty("grouped");
      const searchPlaceholder =
        this.reportRef.current && this.reportRef.current.getSearchPlaceholder
          ? this.reportRef.current.getSearchPlaceholder()
          : T.translate("reports.placeholders.search");

      return (
        <div className="container large">
          <Breadcrumb data={{ title: reportName, pathname: match.url }} />
          <AjaxLoader show={exportingReport} size={120}>
            <span style={{ color: "black", fontSize: 20 }}>
              Fetching: {exportProgress} of {totalCount}
            </span>
          </AjaxLoader>
          <div className="row">
            <div className="col-md-8">
              <h3>{reportName}</h3>
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-md-6">
              <FreeTextSearch
                value={search || ""}
                placeholder={searchPlaceholder}
                onSearch={this.handleSearch}
              />
            </div>
            <div className="col-md-6 text-right">
              <button
                className="btn btn-primary right-space"
                type="button"
                onClick={this.handleExportReport}
              >
                {T.translate("reports.export")}
              </button>

              {exportData && (
                <ExportData
                  reportName={reportName}
                  data={exportData}
                  grouped={grouped}
                />
              )}
            </div>
          </div>
          <hr />

          {specs.filters && (
            <div>
              <div className="row report-filters">{this.renderFilters()}</div>
              <hr />
            </div>
          )}

          <div className="report-container">
            <ReportComponent
              ref={this.reportRef}
              sortKey={sort}
              sortDir={parseInt(sortdir)}
              onSort={this.handleSort}
              onReload={this.handleReload}
              data={this.props.data}
              filters={filters}
              onFilterChange={this.handleFilterChange}
              {...this.props}
            />
          </div>

          {specs.pagination && (
            <Pagination
              bsSize="medium"
              prev
              next
              ellipsis={false}
              boundaryLinks={false}
              maxButtons={10}
              items={pageCount}
              activePage={currentPage}
              onSelect={this.handlePageChange}
            />
          )}
        </div>
      );
    }
  }

  return ReportBase;
};

const mapStateToProps = ({ currentSummitState, currentReportState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentReportState
});

const composedReportWrapper = compose(
  connect(mapStateToProps, {
    getReport,
    exportReport,
    getMembersForEventCSV,
    getMetricRaw,
    getOrderExtraQuestions,
    getBadgeFeatures
  }),
  wrapReport
);

export default composedReportWrapper;
