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

import React, { useEffect, useMemo } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import { FreeTextSearch } from "openstack-uicore-foundation/lib/components";
import {
  getSelectionPlans,
  getSourceList,
  getTeamList,
  reorderList,
  setSelectionPlan,
  updateTeamList
} from "../../actions/track-chair-actions";
import TrackDropdown from "../../components/inputs/track-dropdown";
import SelectionPlanDropdown from "../../components/inputs/selection-plan-dropdown";
import List from "../../components/dnd-list/List";
import { moveItem } from "../../utils/methods";
import styles from "../../styles/team-list-page.module.less";

const getTracksFromSelectionPlan = (selectionPlan) =>
  // get all tracks from the selection plan and track visible
  selectionPlan?.track_groups
    .reduce((result, trackGroup) => {
      trackGroup?.tracks?.forEach((track) => {
        if (!result.find((tr) => tr.id === track.id)) {
          result.push(track);
        }
      });
      return result;
    }, [])
    .filter((t) => t?.chair_visible);
const TeamListsPage = ({
  summit,
  match,
  selectionPlans,
  sourceList,
  teamList,
  sourceSearchTerm,
  sourceTrackId,
  sourceSelPlanId,
  sourcePage,
  sourceLastPage,
  ...props
}) => {
  const sourceTrackOptions =
    useMemo(
      () =>
        getTracksFromSelectionPlan(
          selectionPlans.find((sp) => sp.id === sourceSelPlanId)
        ),
      [sourceSelPlanId]
    ) || [];

  const track = sourceTrackOptions.find((t) => t.id === sourceTrackId);
  const trackLimit = track ? track.session_count + track.alternate_count : 0;
  const teamListLength = teamList?.items?.length || 0;

  useEffect(() => {
    if (!selectionPlans.length) {
      props.getSelectionPlans();
    }
  }, [selectionPlans]);

  const handleTrackChange = (trackId) => {
    props.getSourceList(sourceSelPlanId, trackId, sourceSearchTerm);
    props.getTeamList(sourceSelPlanId, trackId);
  };

  const handleSearch = (term) => {
    props.getSourceList(sourceSelPlanId, sourceTrackId, term);
  };

  const handleScrollEvent = (ev) => {
    const bottom =
      ev.target.scrollHeight - ev.target.scrollTop === ev.target.clientHeight;

    if (bottom && sourcePage < sourceLastPage) {
      props.getSourceList(
        sourceSelPlanId,
        sourceTrackId,
        sourceSearchTerm,
        sourcePage + 1
      );
    }
  };

  const handleColumnChange = (fromItem, toItem, toListId) => {
    const lists = [sourceList, teamList];
    // const fromList = lists.find((l) => l.id === fromItem.originalList.id);
    const toList = lists.find((l) => l.id === toListId);
    // const newFromItems = fromList.items.filter((it) => it.id !== fromItem.id);

    // If list already has the item we return with no effect.
    if (toList.items.find((it) => it.id === fromItem.id)) {
      return;
    }

    // Remove from the old list TODO: do this only for lists that are not "clonable"
    // props.reorderList(fromItem.originalList.id, newFromItems);

    // Update to list
    const newToItems = [
      ...toList.items,
      {
        id: fromItem.id,
        title: fromItem.title,
        level: fromItem.level,
        order: toItem.order
      }
    ];

    const newToItemsOrdered = moveItem(
      newToItems,
      newToItems.length - 1,
      toItem.order
    );

    props.reorderList(toList.id, newToItemsOrdered);
  };

  return (
    <>
      <Breadcrumb
        data={{
          title: T.translate("track_team_lists.team_lists"),
          pathname: match.url
        }}
      />
      <div className="container">
        <h3> {T.translate("track_team_lists.team_lists")} </h3>
        <hr />
        <div className={`row ${styles.wrapper}`}>
          <div className={`col-md-6 ${styles.sourceWrapper}`}>
            <div className={styles.filtersWrapper}>
              <SelectionPlanDropdown
                id="sp-source"
                value={sourceSelPlanId}
                className={styles.filter}
                onChange={(ev) => props.setSelectionPlan(ev.target.value)}
                selectionPlans={selectionPlans}
                placeholder={T.translate(
                  "track_team_lists.placeholders.select_selection_plan"
                )}
              />
              <TrackDropdown
                id="source-tracks"
                value={sourceTrackId}
                className={styles.filter}
                onChange={(ev) => handleTrackChange(ev.target.value)}
                tracks={sourceTrackOptions}
                disabled={!sourceTrackOptions?.length}
                placeholder={T.translate(
                  "track_team_lists.placeholders.select_track"
                )}
              />
              <FreeTextSearch
                value={sourceSearchTerm}
                className={styles.filter}
                placeholder={T.translate(
                  "track_team_lists.placeholders.search_activities"
                )}
                onSearch={handleSearch}
              />
            </div>
            <div
              className={styles.sourceListWrapper}
              onScroll={handleScrollEvent}
            >
              {!sourceList?.items?.length && (
                <div className={styles.emptyTrack}>
                  No Activities found for this track.
                </div>
              )}
              {sourceList?.items?.length > 0 && (
                <List
                  list={sourceList}
                  altThreshold={10}
                  limit={10}
                  onCardClick={console.log}
                  onReorder={console.log}
                  onColumnChange={console.log}
                  onDrop={console.log}
                />
              )}
            </div>
          </div>
          <div className={`col-md-6 ${styles.teamWrapper}`}>
            <div className={styles.teamListHeader}>
              <p className={styles.title}>
                Team List ({teamListLength} / {trackLimit})
              </p>
              {teamList && (
                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <b>Beginner:</b> {teamList.meta?.beginner}
                  </div>
                  <div className={styles.metaItem}>
                    <b>Intermediate:</b> {teamList.meta?.intermediate}
                  </div>
                  <div className={styles.metaItem}>
                    <b>Advanced:</b> {teamList.meta?.advanced}
                  </div>
                  <div className={styles.metaItem}>
                    <b>N/A:</b> {teamList.meta?.na}
                  </div>
                </div>
              )}
            </div>
            <List
              list={teamList}
              sortable
              altThreshold={7}
              limit={10}
              onCardClick={console.log}
              onReorder={props.reorderList}
              onColumnChange={handleColumnChange}
              onDrop={props.updateTeamList}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = ({ currentSummitState, teamListsState }) => ({
  summit: currentSummitState.currentSummit,
  ...teamListsState
});

export default connect(mapStateToProps, {
  getSelectionPlans,
  setSelectionPlan,
  getSourceList,
  getTeamList,
  reorderList,
  updateTeamList
})(TeamListsPage);
