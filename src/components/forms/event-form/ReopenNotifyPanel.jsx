/**
 * Copyright 2026 OpenStack Foundation
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
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { ROLE } from "./utils";

const ROLE_LABEL = {
  [ROLE.SUBMITTER]: "edit_event.notify_role_submitter",
  [ROLE.MODERATOR]: "edit_event.notify_role_moderator",
  [ROLE.SPEAKER]: "edit_event.notify_role_speaker"
};

const ReopenNotifyPanel = ({
  rows,
  checked,
  onToggle,
  canNotify,
  onNotify
}) => (
  <div style={{ flexBasis: "100%" }}>
    <label>{T.translate("edit_event.notify_recipients_label")}</label>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginTop: 10
      }}
    >
      {rows.map((row) => (
        <div className="form-check abc-checkbox" key={row.key}>
          <input
            type="checkbox"
            id={`notify_recipient_${row.key}`}
            className="form-check-input"
            disabled={row.disabled}
            checked={checked.includes(row.key)}
            onChange={() => onToggle(row.key)}
          />
          <label
            className="form-check-label"
            htmlFor={`notify_recipient_${row.key}`}
          >
            {row.name}
            &nbsp;-&nbsp;
            {row.roles.map((role) => T.translate(ROLE_LABEL[role])).join(", ")}
          </label>
          {row.disabled && (
            <span>
              &nbsp;
              {T.translate("edit_event.notify_no_email")}
            </span>
          )}
        </div>
      ))}
    </div>
    <button
      type="button"
      className="btn btn-primary"
      style={{ marginTop: 10 }}
      disabled={!canNotify}
      onClick={onNotify}
    >
      {T.translate("edit_event.notify_speakers")}
    </button>
  </div>
);

ReopenNotifyPanel.propTypes = {
  rows: PropTypes.array.isRequired,
  checked: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
  canNotify: PropTypes.bool.isRequired,
  onNotify: PropTypes.func.isRequired
};

export default ReopenNotifyPanel;
