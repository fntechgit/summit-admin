import formTemplateListReducer from "../form-template-list-reducer";
import {
  RECEIVE_FORM_TEMPLATES,
  FORM_TEMPLATE_ARCHIVED
} from "../../../actions/form-template-actions";

// Verifies the reducer decrements currentPage when archiving the only item on the last page.
it("decrements currentPage when archiving the only item on the last page", () => {
  // 21 items across 3 pages; page 3 has exactly 1 item
  const onPage3 = formTemplateListReducer(undefined, {
    type: RECEIVE_FORM_TEMPLATES,
    payload: {
      response: {
        data: [{ id: 21, is_archived: false, items: [] }],
        total: 21,
        last_page: 3,
        current_page: 3
      }
    }
  });
  expect(onPage3.currentPage).toBe(3);

  // Archive that item — reducer correctly decrements to page 2
  const afterArchive = formTemplateListReducer(onPage3, {
    type: FORM_TEMPLATE_ARCHIVED,
    payload: { response: { id: 21, is_archived: true } }
  });
  expect(afterArchive.currentPage).toBe(2); // reducer correction works
});
