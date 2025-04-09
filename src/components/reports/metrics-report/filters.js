import React, { useState } from "react";
import {
  CompanyInput,
  DateTimePicker,
  Dropdown,
  EventInput,
} from "openstack-uicore-foundation/lib/components";

const FilterComponent = ({ values, summit, onFilterChange, onSubmit }) => {
  const {eventType, sponsor, roomFilter, eventFilter, subTypeFilter, showAnswers, onlyFinished, fromDate, toDate} = values;

  const event_types_ddl = [
    { label: "Lobby (Virtual only)", value: "LOBBY" },
    { label: "Activity (Virtual & In-Person)", value: "EVENT" },
    { label: "Room (Virtual & In-Person)", value: "ROOM" },
    { label: "Poster Type (Virtual only)", value: "POSTER" },
    { label: "Sponsor Page (Virtual only)", value: "SPONSOR" },
    { label: "Other", value: "GENERAL" }
  ];

  const sub_types_ddl = [
    { label: "In-Person", value: "ON_SITE" },
    { label: "Virtual", value: "VIRTUAL" }
  ];

  const room_ddl = summit.locations.map((l) => ({
    label: l.name,
    value: l.id
  }));

  const handleFilterChange = (ev) => {
    const { id, value, type, checked } = ev.target;
    const filter = {
      [id]: type === "checkbox" ? checked : value
    }

    if (id === "eventType") {
      filter.roomFilter = null;
      filter.eventFilter = null;
      filter.subTypeFilter = null;
    }

    onFilterChange({...values, ...filter});
  }

  return (
    <div className="report-filters">
      <div className="row">
        <div className="col-md-3">
          <label>Type</label>
          <Dropdown
            id="eventType"
            options={event_types_ddl}
            onChange={handleFilterChange}
            value={eventType}
            clearable
          />
        </div>
        <div className="col-md-3">
          <label>Sponsor</label>
          <CompanyInput
            id="sponsor"
            value={sponsor}
            onChange={handleFilterChange}
            summitId={summit.id}
            clearable
          />
        </div>
        {eventType === "ROOM" && (
          <div className="col-md-3">
            <label>Room</label>
            <Dropdown
              id="roomFilter"
              options={room_ddl}
              onChange={handleFilterChange}
              value={roomFilter}
              clearable
            />
          </div>
        )}
        {eventType === "EVENT" && (
          <div className="col-md-3">
            <label>Activity</label>
            <EventInput
              id="eventFilter"
              summit={summit}
              value={eventFilter}
              onChange={handleFilterChange}
              onlyPublished
              isClearable
            />
          </div>
        )}
        {["ROOM", "EVENT"].includes(eventType) && (
          <div className="col-md-3">
            <label>Sub Type</label>
            <Dropdown
              id="subTypeFilter"
              options={sub_types_ddl}
              onChange={handleFilterChange}
              value={subTypeFilter}
              clearable
            />
          </div>
        )}
      </div>
      <div className="row" style={{ marginTop: 20 }}>
        <div className="col-md-6">
          <label>Ingress date</label>
          <div className="inline">
            From: &nbsp;&nbsp;
            <DateTimePicker
              id="fromDate"
              onChange={handleFilterChange}
              format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
              value={fromDate}
              timezone={summit.time_zone_id}
            />
            &nbsp;&nbsp;To:&nbsp;&nbsp;
            <DateTimePicker
              id="toDate"
              onChange={handleFilterChange}
              format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
              value={toDate}
              timezone={summit.time_zone_id}
            />
          </div>
        </div>
        <div className="col-md-3 checkboxes-div">
          <div className="form-check abc-checkbox">
            <input
              type="checkbox"
              id="showAnswers"
              checked={showAnswers}
              onChange={handleFilterChange}
              className="form-check-input"
            />
            <label className="form-check-label" htmlFor="showAnswers">
              Show Answers
            </label>
          </div>
          <div className="form-check abc-checkbox">
            <input
              type="checkbox"
              id="onlyFinished"
              checked={onlyFinished}
              onChange={handleFilterChange}
              className="form-check-input"
            />
            <label className="form-check-label" htmlFor="onlyFinished">
              Only Finished
            </label>
          </div>
        </div>
        <div className="col-md-3" style={{ marginTop: 20 }}>
          <button className="btn btn-primary" onClick={onSubmit}>
            {" "}GO{" "}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterComponent;
