/**
 * Copyright 2025 OpenStack Foundation
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

import React, { useState, useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, Divider, Grid2, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTableSortable from "../../mui/sortable-table/mui-table-sortable";
import { DEFAULT_CURRENT_PAGE, MAX_PER_PAGE } from "../../../utils/constants";
import AddSponsorExtraQuestionPopup from "./add-extra-question-popup";

const SponsorExtraQuestions = ({
  sponsorId,
  extraQuestions = [],
  summit,
  getSponsorExtraQuestion,
  saveSponsorExtraQuestion,
  saveSponsorExtraQuestionValue,
  resetSponsorExtraQuestionForm,
  onExtraQuestionReOrder,
  onExtraQuestionDelete
}) => {
  const [tableData, setTableData] = useState(extraQuestions);
  const [showAddExtraQuestionPopup, setShowAddExtraQuestionPopup] =
    useState(false);

  useEffect(() => {
    const sortedExtraQuestions = extraQuestions.sort(
      (a, b) => a.order - b.order
    );
    setTableData(sortedExtraQuestions);
  }, [extraQuestions]);

  const handleCloseExtraQuestionPopup = () => {
    resetSponsorExtraQuestionForm();
    setShowAddExtraQuestionPopup(false);
  };

  const handleOpenExtraQuestionPopup = () => {
    setShowAddExtraQuestionPopup(true);
  };

  const handleReorder = (newOrder, itemId, newItemOrder) => {
    setTableData(newOrder);
    onExtraQuestionReOrder(newOrder, sponsorId, itemId, newItemOrder);
  };

  const handleEditExtraQuestion = (extraQuestion) => {
    getSponsorExtraQuestion(extraQuestion.id).then(() =>
      setShowAddExtraQuestionPopup(true)
    );
  };

  const handleDeleteExtraQuestion = (extraQuestionId) => {
    onExtraQuestionDelete(sponsorId, extraQuestionId);
  };

  const handleSubmitExtraQuestion = (extraQuestion) => {
    const { valuesToSave, ...extraQuestionToSave } = extraQuestion;

    const hasValues = valuesToSave && valuesToSave.length > 0;

    if (!hasValues) {
      saveSponsorExtraQuestion(extraQuestionToSave).then(() =>
        handleCloseExtraQuestionPopup()
      );
      return;
    }

    if (!extraQuestionToSave.id) {
      saveSponsorExtraQuestion(extraQuestionToSave).then((eq) => {
        const saveValuePromises = valuesToSave.map((value) =>
          saveSponsorExtraQuestionValue(eq.id, value)
        );
        Promise.all(saveValuePromises).then(() =>
          handleCloseExtraQuestionPopup()
        );
      });
      return;
    }

    const saveValuePromises = valuesToSave.map((value) =>
      saveSponsorExtraQuestionValue(extraQuestionToSave.id, value)
    );

    Promise.all(saveValuePromises).then(() => {
      saveSponsorExtraQuestion(extraQuestionToSave).then(() =>
        handleCloseExtraQuestionPopup()
      );
    });
  };

  const columns = [
    {
      columnKey: "type",
      header: T.translate("generic_extra_question_list.question_type"),
      render: (c) => c.type.split(/(?=[A-Z])/).join(" ")
    },
    {
      columnKey: "label",
      header: T.translate("generic_extra_question_list.visible_question"),
      render: (c) => (
        <Box component="div" dangerouslySetInnerHTML={{ __html: c.label }} />
      )
    },
    {
      columnKey: "name",
      header: T.translate("generic_extra_question_list.question_id")
    }
  ];

  return (
    <>
      <Box sx={{ px: 2, py: 0, mt: 2, backgroundColor: "#FFF" }}>
        <Grid2
          container
          size={12}
          sx={{ height: "68px", alignItems: "center" }}
        >
          <Grid2 size={12}>
            <Typography
              sx={{
                fontWeight: "500",
                letterSpacing: "0.15px",
                fontSize: "2rem",
                lineHeight: "1.6rem"
              }}
            >
              {T.translate("edit_sponsor.extra_questions")}
            </Typography>
          </Grid2>
        </Grid2>
        <Divider />
        <Grid2
          container
          size={12}
          sx={{ py: 2, height: "68px", alignItems: "center" }}
        >
          <Grid2 size={12}>
            <Box
              sx={{
                p: 2,
                fontSize: "1.2rem",
                lineHeight: "1.5rem",
                color: "#1E88E5",
                backgroundColor: "#03A9F41A"
              }}
            >
              {T.translate("edit_sponsor.extra_questions_info")}
            </Box>
          </Grid2>
        </Grid2>
        <Grid2
          container
          size={12}
          sx={{ height: "68px", alignItems: "center" }}
        >
          <Grid2 size={9}>
            <Typography
              sx={{
                fontWeight: "400",
                letterSpacing: "0.15px",
                fontSize: "1.6rem",
                lineHeight: "150%",
                textTransform: "lowercase"
              }}
            >
              {extraQuestions.length}{" "}
              {T.translate("edit_sponsor.extra_questions")}
            </Typography>
          </Grid2>
          <Grid2
            size={3}
            sx={{ py: 3, display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              variant="contained"
              onClick={handleOpenExtraQuestionPopup}
              startIcon={<AddIcon />}
              sx={{ height: "36px" }}
            >
              {T.translate("edit_sponsor.add_question")}
            </Button>
          </Grid2>
        </Grid2>
        <Grid2 container size={12} sx={{ py: 3 }}>
          {extraQuestions.length === 0 && (
            <div>{T.translate("edit_sponsor.no_extra_questions")}</div>
          )}

          {extraQuestions.length > 0 && (
            <MuiTableSortable
              data={tableData}
              columns={columns}
              totalRows={tableData.length}
              currentPage={DEFAULT_CURRENT_PAGE}
              perPage={MAX_PER_PAGE}
              onEdit={handleEditExtraQuestion}
              onDelete={handleDeleteExtraQuestion}
              onReorder={handleReorder}
              deleteDialogBody={(name) =>
                T.translate("edit_sponsor.extra_question_remove_warning", {
                  name
                })
              }
            />
          )}
        </Grid2>
      </Box>
      {showAddExtraQuestionPopup && (
        <AddSponsorExtraQuestionPopup
          open={showAddExtraQuestionPopup}
          summit={summit}
          onClose={handleCloseExtraQuestionPopup}
          onSubmit={handleSubmitExtraQuestion}
        />
      )}
    </>
  );
};

export default SponsorExtraQuestions;
