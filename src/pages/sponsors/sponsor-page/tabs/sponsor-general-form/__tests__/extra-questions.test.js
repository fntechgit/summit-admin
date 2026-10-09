import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SponsorExtraQuestions from "../extra-questions";

const QUESTIONS = [
  { id: 9, name: "FAVORITE_COLOR", label: "Color?", type: "Text", order: 1 },
  { id: 10, name: "NEWSLETTER", label: "News?", type: "CheckBox", order: 2 }
];

const renderList = (props = {}) => {
  const handlers = {
    getSponsorExtraQuestion: jest.fn(() => Promise.resolve()),
    saveSponsorExtraQuestion: jest.fn(() => Promise.resolve({})),
    saveSponsorExtraQuestionValue: jest.fn(() => Promise.resolve()),
    resetSponsorExtraQuestionForm: jest.fn(),
    onExtraQuestionReOrder: jest.fn(),
    onExtraQuestionDelete: jest.fn(),
    getSponsorExtraQuestionUsage: jest.fn(() =>
      Promise.resolve({ answers_count: 0, reps_count: 0, reps: [] })
    ),
    onExtraQuestionForceDelete: jest.fn(() => Promise.resolve()),
    ...props
  };
  render(
    <SponsorExtraQuestions
      sponsorId={5}
      summit={{ id: 7 }}
      extraQuestions={QUESTIONS}
      {...handlers}
    />
  );
  return handlers;
};

describe("SponsorExtraQuestions force delete", () => {
  it("hides the force delete action from non admins", () => {
    renderList({ canForceDelete: false });

    expect(
      screen.queryByRole("button", { name: "edit_sponsor.force_delete" })
    ).not.toBeInTheDocument();
  });

  it("shows a force delete action per question to admins", () => {
    renderList({ canForceDelete: true });

    expect(
      screen.getAllByRole("button", { name: "edit_sponsor.force_delete" })
    ).toHaveLength(QUESTIONS.length);
  });

  it("opens the confirmation for the chosen question and force deletes it on the sponsor", async () => {
    const handlers = renderList({ canForceDelete: true });

    await userEvent.click(
      screen.getAllByRole("button", { name: "edit_sponsor.force_delete" })[0]
    );

    await waitFor(() =>
      expect(handlers.getSponsorExtraQuestionUsage).toHaveBeenCalledWith(5, 9)
    );
    expect(
      screen.getByText("edit_sponsor.force_delete_title")
    ).toBeInTheDocument();

    await screen.findByTestId("force-delete-reason");
    await userEvent.click(screen.getByTestId("force-delete-check-devices"));
    await userEvent.click(screen.getByTestId("force-delete-check-pending"));
    await userEvent.click(screen.getByTestId("force-delete-check-third_party"));
    await userEvent.type(
      screen.getByTestId("force-delete-reason"),
      "created by mistake"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "edit_sponsor.force_delete" })
    );

    await waitFor(() =>
      expect(handlers.onExtraQuestionForceDelete).toHaveBeenCalledWith(5, 9, {
        reason: "created by mistake",
        deleteAnswers: false
      })
    );
    // the plain delete is never used for a force delete
    expect(handlers.onExtraQuestionDelete).not.toHaveBeenCalled();
  });
});
