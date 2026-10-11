import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SponsorExtraQuestions from "../extra-questions";

// the real table confirms with its own dialog before calling onDelete, a trash button per row
// stands in for it: it is only rendered when the table is given onDelete
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/sortable-table",
  () => ({
    __esModule: true,
    default: ({ data, onDelete }) => (
      <div>
        {data.map((q) => (
          <div key={q.id}>
            <span>{q.name}</span>
            {onDelete && (
              <button type="button" onClick={() => onDelete(q.id)}>
                trash-{q.id}
              </button>
            )}
          </div>
        ))}
      </div>
    )
  })
);

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
    onExtraQuestionDelete: jest.fn(() => Promise.resolve()),
    getSponsorExtraQuestionUsage: jest.fn(() =>
      Promise.resolve({ answers_count: 0, reps_count: 0, reps: [] })
    ),
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

describe("SponsorExtraQuestions delete", () => {
  it("hides the trash from non admins", () => {
    renderList({ canDelete: false });

    expect(screen.queryByText(/^trash-/)).not.toBeInTheDocument();
  });

  it("shows the trash per question to admins", () => {
    renderList({ canDelete: true });

    expect(screen.getAllByText(/^trash-/)).toHaveLength(QUESTIONS.length);
  });

  it("opens the confirmation for the chosen question and deletes it on the sponsor", async () => {
    const handlers = renderList({ canDelete: true });

    await userEvent.click(screen.getByText("trash-9"));

    await waitFor(() =>
      expect(handlers.getSponsorExtraQuestionUsage).toHaveBeenCalledWith(5, 9)
    );
    expect(
      screen.getByText("edit_sponsor.delete_question_title")
    ).toBeInTheDocument();
    // nothing is deleted until the dialog is confirmed
    expect(handlers.onExtraQuestionDelete).not.toHaveBeenCalled();

    await screen.findByTestId("delete-reason");
    await userEvent.click(screen.getByTestId("delete-check-devices"));
    await userEvent.click(screen.getByTestId("delete-check-pending"));
    await userEvent.click(screen.getByTestId("delete-check-third_party"));
    await userEvent.type(
      screen.getByTestId("delete-reason"),
      "created by mistake"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "edit_sponsor.delete_question" })
    );

    await waitFor(() =>
      expect(handlers.onExtraQuestionDelete).toHaveBeenCalledWith(5, 9, {
        reason: "created by mistake",
        deleteAnswers: false
      })
    );
  });
});
