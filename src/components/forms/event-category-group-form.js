/* *
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
import T from "i18n-react/dist/i18n-react";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  queryTracks,
  queryGroups
} from "openstack-uicore-foundation/lib/utils/query-actions";
import Input from "openstack-uicore-foundation/lib/components/inputs/text-input";
import SimpleLinkList from "openstack-uicore-foundation/lib/components/simple-link-list";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import DateTimePicker from "openstack-uicore-foundation/lib/components/inputs/datetimepicker";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import Panel from "openstack-uicore-foundation/lib/components/sections/panel";
import Swal from "sweetalert2";
import { scrollToError, hasErrors } from "../../utils/methods";
import AuditLogs from "../audit-logs";

const EventCategoryGroupForm = ({
  currentSummit,
  allClasses,
  entity: initialEntity,
  errors: initialErrors,
  onSubmit,
  onTrackLink,
  onTrackUnLink,
  onAllowedGroupLink,
  onAllowedGroupUnLink
}) => {
  const [entity, setEntity] = useState({ ...initialEntity });
  const [errors, setErrors] = useState(initialErrors);
  const [showAuditLog, setShowAuditLog] = useState(false);

  useEffect(() => {
    setEntity({ ...initialEntity });
    setErrors({});
  }, [initialEntity]);

  useEffect(() => {
    setErrors({ ...initialErrors });
    scrollToError(initialErrors);
  }, [initialErrors]);

  const handleChange = (ev) => {
    let { value } = ev.target;
    const { id } = ev.target;

    if (ev.target.type === "datetime") {
      value = value.unix();
    }

    setErrors((prev) => ({ ...prev, [id]: "" }));
    setEntity((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    onSubmit(entity);
  };

  const handleTrackLink = (value) => {
    onTrackLink(entity.id, value);
  };

  const handleTrackUnLink = (valueId) => {
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_event_category_group.unlink_track_warning"),
      type: "warning",
      showCancelButton: true,
      confirmButtonText: T.translate("general.yes")
    }).then((result) => {
      if (result.value) {
        onTrackUnLink(entity.id, valueId);
      }
    });
  };

  const handleAllowedGroupLink = (value) => {
    onAllowedGroupLink(entity.id, value);
  };

  const handleAllowedGroupUnLink = (valueId) => {
    onAllowedGroupUnLink(entity.id, valueId);
  };

  const toggleAuditLog = (ev) => {
    ev.preventDefault();
    setShowAuditLog((prev) => !prev);
  };

  const shouldShowField = (flag) => {
    if (!entity.class_name) return false;
    const class_name = allClasses.find(
      (c) => c.class_name === entity.class_name
    );

    return class_name[flag];
  };

  const selectedTrackIds = entity?.tracks?.map((t) => t.id) || [];

  const tracksColumns = [
    { columnKey: "name", value: T.translate("edit_event_category.name") },
    { columnKey: "code", value: T.translate("edit_event_category.code") }
  ];

  const tracksOptions = {
    title: T.translate("edit_event_category_group.tracks"),
    valueKey: "name",
    labelKey: "name",
    actions: {
      search: (input, callback) => {
        queryTracks(currentSummit.id, input, callback, selectedTrackIds);
      },
      delete: { onClick: handleTrackUnLink },
      add: { onClick: handleTrackLink }
    }
  };

  const allowedGroupsColumns = [
    { columnKey: "title", value: T.translate("edit_event_category.name") },
    {
      columnKey: "description",
      value: T.translate("edit_event_category.description")
    }
  ];

  const allowedGroupsOptions = {
    title: T.translate("edit_event_category_group.allowed_groups"),
    valueKey: "id",
    labelKey: "title",
    actions: {
      search: queryGroups,
      delete: { onClick: handleAllowedGroupUnLink },
      add: { onClick: handleAllowedGroupLink }
    }
  };

  const class_name_ddl = allClasses.map((i) => ({
    label: i.class_name,
    value: i.class_name
  }));

  return (
    <form className="event-type-form">
      <input type="hidden" id="id" value={entity.id} />
      <div className="row form-group">
        <div className="col-md-4">
          <label> {T.translate("edit_event_category_group.class")} *</label>
          <Dropdown
            id="class_name"
            disabled={entity.id !== 0}
            value={entity.class_name}
            onChange={handleChange}
            placeholder={T.translate(
              "edit_event_category_group.placeholders.select_class"
            )}
            options={class_name_ddl}
            error={hasErrors("class_name", errors)}
          />
        </div>
        <div className="col-md-4">
          <label> {T.translate("edit_event_category_group.name")} *</label>
          <Input
            id="name"
            value={entity.name}
            onChange={handleChange}
            className="form-control"
            error={hasErrors("name", errors)}
          />
        </div>
        <div className="col-md-4">
          <label> {T.translate("edit_event_category_group.color")} *</label>
          <Input
            id="color"
            type="color"
            value={entity.color}
            onChange={handleChange}
            className="form-control"
          />
        </div>
      </div>
      <div className="row form-group">
        <div className="col-md-4">
          <label>
            {" "}
            {T.translate(
              "edit_event_category_group.begin_attendee_voting_period_date"
            )}
          </label>
          <DateTimePicker
            id="begin_attendee_voting_period_date"
            onChange={handleChange}
            format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
            timezone={currentSummit.time_zone_id}
            value={epochToMomentTimeZone(
              entity.begin_attendee_voting_period_date,
              currentSummit.time_zone_id
            )}
          />
        </div>
        <div className="col-md-4">
          <label>
            {" "}
            {T.translate(
              "edit_event_category_group.end_attendee_voting_period_date"
            )}
          </label>
          <DateTimePicker
            id="end_attendee_voting_period_date"
            onChange={handleChange}
            format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
            timezone={currentSummit.time_zone_id}
            value={epochToMomentTimeZone(
              entity.end_attendee_voting_period_date,
              currentSummit.time_zone_id
            )}
          />
        </div>
        <div className="col-md-4">
          <label>
            {" "}
            {T.translate("edit_event_category_group.max_attendee_votes")}
          </label>
          <Input
            id="max_attendee_votes"
            type="number"
            value={entity.max_attendee_votes}
            onChange={handleChange}
            className="form-control"
          />
        </div>
      </div>
      {shouldShowField("submission_begin_date") && (
        <div className="row form-group">
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_event_category_group.submission_begin_date")}
            </label>
            <DateTimePicker
              id="submission_begin_date"
              onChange={handleChange}
              format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
              timezone={currentSummit.time_zone_id}
              value={epochToMomentTimeZone(
                entity.submission_begin_date,
                currentSummit.time_zone_id
              )}
            />
          </div>
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_event_category_group.submission_end_date")}
            </label>
            <DateTimePicker
              id="submission_end_date"
              onChange={handleChange}
              format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
              timezone={currentSummit.time_zone_id}
              value={epochToMomentTimeZone(
                entity.submission_end_date,
                currentSummit.time_zone_id
              )}
            />
          </div>
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate(
                "edit_event_category_group.max_submission_allowed_per_user"
              )}
            </label>
            <Input
              id="max_submission_allowed_per_user"
              type="number"
              value={entity.max_submission_allowed_per_user}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
      )}
      <div className="row form-group">
        <div className="col-md-12">
          <label>
            {" "}
            {T.translate("edit_event_category_group.description")}{" "}
          </label>
          <TextEditorV3
            id="description"
            value={entity.description}
            onChange={handleChange}
            error={hasErrors("description", errors)}
            license={process.env.JODIT_LICENSE_KEY}
          />
        </div>
      </div>

      <hr />
      {entity.id !== 0 && (
        <SimpleLinkList
          values={entity.tracks}
          columns={tracksColumns}
          options={tracksOptions}
        />
      )}
      <br />
      <br />
      {entity.id !== 0 && shouldShowField("allowed_groups") && (
        <SimpleLinkList
          values={entity.allowed_groups}
          columns={allowedGroupsColumns}
          options={allowedGroupsOptions}
        />
      )}

      {entity.id !== 0 && (
        <Panel
          show={showAuditLog}
          title={T.translate("audit_log.title")}
          handleClick={toggleAuditLog}
        >
          <AuditLogs
            filterId="category_group"
            entityFilter={[
              `entity_id==${entity.id}`,
              `class_name==${entity.class_name}`
            ]}
            columns={["created", "action_description", "user"]}
          />
        </Panel>
      )}

      <div className="row">
        <div className="col-md-12 submit-buttons">
          <input
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary pull-right"
            value={T.translate("general.save")}
          />
        </div>
      </div>
    </form>
  );
};

export default EventCategoryGroupForm;
