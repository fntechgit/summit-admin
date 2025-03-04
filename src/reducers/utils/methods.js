/**
 * Copyright 2023 OpenStack Foundation
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
import { Tooltip } from "react-tooltip";

export const buildSpeakersSubmittersList = (state, data) =>
  data.map((s) => {
    const acceptedPresentationsToolTip = s.accepted_presentations.reduce(
      (ac, ap) =>
        `${ac}${ac ? "<br>" : ""}<a target="_blank" href="/app/summits/${
          state.currentSummitId
        }/events/${ap.id}">${ap.title}</a>`,
      ""
    );

    const rejectedPresentationsToolTip = s.rejected_presentations.reduce(
      (ac, ap) =>
        `${ac}${ac ? "<br>" : ""}<a target="_blank" href="/app/summits/${
          state.currentSummitId
        }/events/${ap.id}">${ap.title}</a>`,
      ""
    );

    const alternatePresentationsToolTip = s.alternate_presentations.reduce(
      (ac, ap) =>
        `${ac}${ac ? "<br>" : ""}<a target="_blank" href="/app/summits/${
          state.currentSummitId
        }/events/${ap.id}">${ap.title}</a>`,
      ""
    );

    return {
      ...s,
      full_name: `${s.first_name} ${s.last_name}`,
      accepted_presentations_count:
        s.accepted_presentations.length > 0 ? (
          <a
            data-tooltip-html={acceptedPresentationsToolTip}
            data-tooltip-id={`accepted_${s.id}`}
            onClick={(ev) => {
              ev.stopPropagation();
            }}
            href="#"
          >
            {s.accepted_presentations.length}
            <Tooltip
              id={`accepted_${s.id}`}
              multiline
              clickable
              delayHide={1000}
              place="bottom"
              variant="light"
              border="1px solid black"
            />
          </a>
        ) : (
          "N/A"
        ),
      alternate_presentations_count:
        s.alternate_presentations.length > 0 ? (
          <a
            data-tooltip-html={alternatePresentationsToolTip}
            data-tooltip-id={`alternate_${s.id}`}
            onClick={(ev) => {
              ev.stopPropagation();
            }}
            href="#"
          >
            {s.alternate_presentations.length}
            <Tooltip
              id={`alternate_${s.id}`}
              multiline
              clickable
              delayHide={1000}
              place="bottom"
              variant="light"
              border="1px solid black"
            />
          </a>
        ) : (
          "N/A"
        ),
      rejected_presentations_count:
        s.rejected_presentations.length > 0 ? (
          <a
            data-tooltip-html={rejectedPresentationsToolTip}
            data-tooltip-id={`rejected_${s.id}`}
            onClick={(ev) => {
              ev.stopPropagation();
            }}
            href="#"
          >
            {s.rejected_presentations.length}
            <Tooltip
              id={`rejected_${s.id}`}
              multiline
              clickable
              delayHide={1000}
              place="bottom"
              variant="light"
              border="1px solid black"
            />
          </a>
        ) : (
          "N/A"
        )
    };
  });
