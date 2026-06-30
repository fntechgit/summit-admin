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
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
import SortableTable from "openstack-uicore-foundation/lib/components/mui/sortable-table";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import Many2ManyDropDown from "../../inputs/many-2-many-dropdown";
import { querySelectionPlanExtraQuestions } from "../../../actions/selection-plan-actions";
import { stripTags } from "../../../utils/methods";

const extraQuestionColumns = [
  {
    columnKey: "type",
    header: T.translate("order_extra_question_list.question_type")
  },
  {
    columnKey: "label",
    header: T.translate("order_extra_question_list.visible_question")
  },
  {
    columnKey: "name",
    header: T.translate("order_extra_question_list.question_id")
  }
];

const ExtraQuestionsTab = ({
  hidden,
  currentSummit,
  extraQuestionsOrder,
  extraQuestionsOrderDir,
  onEditExtraQuestion,
  onDeleteExtraQuestion,
  onAddNewExtraQuestion,
  onAssignExtraQuestion2SelectionPlan,
  updateExtraQuestionOrder
}) => {
  const { values } = useFormikContext();

  const fetchOptions = (input, callback) => {
    if (!input) return Promise.resolve({ options: [] });
    return querySelectionPlanExtraQuestions(currentSummit.id, input, callback);
  };

  const handleLink = (question) => {
    onAssignExtraQuestion2SelectionPlan(
      currentSummit.id,
      values.id,
      question.id
    );
  };

  return (
    <div role="tabpanel" id="tabpanel-extra_questions" hidden={hidden}>
      <Box sx={{ pt: 2 }}>
        <Grid2 container spacing={2} sx={{ alignItems: "center", mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Many2ManyDropDown
              id="addAllowedExtraQuestions"
              isClearable
              CSSClass=""
              placeholder={T.translate(
                "edit_selection_plan.placeholders.link_question"
              )}
              fetchOptions={fetchOptions}
              onAdd={handleLink}
            />
          </Grid2>
          <Grid2
            size={{ xs: 12, md: 6 }}
            sx={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              type="button"
              variant="contained"
              onClick={onAddNewExtraQuestion}
            >
              {T.translate("edit_selection_plan.add_extra_questions")}
            </Button>
          </Grid2>
        </Grid2>
        {values.extra_questions.length === 0 && (
          <div>{T.translate("edit_selection_plan.no_extra_questions")}</div>
        )}
        {values.extra_questions.length > 0 && (
          <SortableTable
            options={{
              sortCol: extraQuestionsOrder,
              sortDir: extraQuestionsOrderDir
            }}
            data={values.extra_questions.map((q) => ({
              ...q,
              label: stripTags(q.label)
            }))}
            columns={extraQuestionColumns}
            onReorder={updateExtraQuestionOrder}
            updateOrderKey="order"
            onEdit={(item) => onEditExtraQuestion(item.id)}
            onDelete={onDeleteExtraQuestion}
            confirmButtonColor="error"
          />
        )}
      </Box>
    </div>
  );
};

ExtraQuestionsTab.propTypes = {
  hidden: PropTypes.bool.isRequired,
  currentSummit: PropTypes.shape({ id: PropTypes.number.isRequired })
    .isRequired,
  extraQuestionsOrder: PropTypes.string.isRequired,
  extraQuestionsOrderDir: PropTypes.number.isRequired,
  onEditExtraQuestion: PropTypes.func.isRequired,
  onDeleteExtraQuestion: PropTypes.func.isRequired,
  onAddNewExtraQuestion: PropTypes.func.isRequired,
  onAssignExtraQuestion2SelectionPlan: PropTypes.func.isRequired,
  updateExtraQuestionOrder: PropTypes.func.isRequired
};

export default ExtraQuestionsTab;
