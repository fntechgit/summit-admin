/**
 * Copyright 2019 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  IconButton,
  Tooltip,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DragAndDropList from "../../components/mui/dnd-list";
import showConfirmDialog from "../../components/mui/showConfirmDialog";
import { getSummitById } from "../../actions/summit-actions";
import {
  getOrderExtraQuestion,
  getOrderExtraQuestions,
  deleteOrderExtraQuestion,
  updateOrderExtraQuestionOrder
} from "../../actions/order-actions";
import EditOrderExtraQuestionPage from "./edit-order-extra-question-page";
import { INT_BASE } from "../../utils/constants";

// "CheckBoxList" -> "Check Box List"
const humanizeType = (type) => type.split(/(?=[A-Z])/).join(" ");

const OrderExtraQuestionListPage = ({
  currentSummit,
  orderExtraQuestions,
  totalOrderExtraQuestions,
  history,
  ...props
}) => {
  useEffect(() => {
    if (currentSummit?.id) props.getOrderExtraQuestions();
  }, [currentSummit?.id]);

  const questionsUrl = `/app/summits/${currentSummit.id}/order-extra-questions`;

  // One card open at a time: the form reads currentOrderExtraQuestionState,
  // which holds a single entity, so a second expansion would fight the first.
  const [expandedId, setExpandedId] = useState(null);

  const handleToggle = (questionId) => {
    if (expandedId === questionId) {
      setExpandedId(null);
      return;
    }
    props.getOrderExtraQuestion(questionId);
    setExpandedId(questionId);
  };

  const handleAdd = () => history.push(`${questionsUrl}/new`);

  const handleDelete = async (question) => {
    const confirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("order_extra_question_list.remove_warning")}${
        question.name
      }`,
      iconType: "warning",
      confirmButtonText: T.translate("general.yes_delete")
    });

    if (confirmed) props.deleteOrderExtraQuestion(question.id);
  };

  // dnd-list renumbers `order` across the list; the action PUTs the moved one.
  const handleReorder = (reordered, result) =>
    props.updateOrderExtraQuestionOrder(
      reordered,
      parseInt(result.draggableId, INT_BASE)
    );

  if (!currentSummit.id) return <div />;

  return (
    <Box className="container">
      <Typography variant="h5" sx={{ mb: 2 }}>
        {T.translate("order_extra_question_list.order_extra_questions")} (
        {totalOrderExtraQuestions})
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          {T.translate("order_extra_question_list.add_question")}
        </Button>
      </Box>

      {orderExtraQuestions.length === 0 ? (
        <Typography color="text.secondary">
          {T.translate("order_extra_question_list.no_order_extra_questions")}
        </Typography>
      ) : (
        <DragAndDropList
          items={orderExtraQuestions}
          onReorder={handleReorder}
          droppableId="order-extra-questions"
          renderItem={(question) => (
            <Card
              elevation={1}
              sx={{
                mb: 1.5,
                "&:hover .drag-handle": { visibility: "visible" }
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", pt: 0.5 }}>
                <DragIndicatorIcon
                  className="drag-handle"
                  sx={{
                    color: "text.disabled",
                    visibility: "hidden",
                    transform: "rotate(90deg)",
                    fontSize: 18
                  }}
                />
              </Box>
              <CardContent
                onClick={() => handleToggle(question.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  pt: 0,
                  cursor: "pointer",
                  "&:last-child": { pb: 2 }
                }}
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box
                    component="div"
                    sx={{ "& p": { m: 0 } }}
                    dangerouslySetInnerHTML={{ __html: question.label }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {humanizeType(question.type)} &middot; {question.name}
                  </Typography>
                </Box>
                <Tooltip title={T.translate("general.delete")}>
                  <IconButton
                    aria-label={T.translate("general.delete")}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDelete(question);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardContent>
              {/* unmountOnExit so only the open card pays for a Jodit editor */}
              <Collapse in={expandedId === question.id} unmountOnExit>
                <Divider />
                <EditOrderExtraQuestionPage inline />
              </Collapse>
            </Card>
          )}
        />
      )}
    </Box>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentOrderExtraQuestionListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentOrderExtraQuestionListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getOrderExtraQuestion,
  getOrderExtraQuestions,
  updateOrderExtraQuestionOrder,
  deleteOrderExtraQuestion
})(OrderExtraQuestionListPage);
