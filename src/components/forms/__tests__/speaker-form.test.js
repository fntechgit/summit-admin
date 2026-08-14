/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SpeakerForm from "../speaker-form";
import showConfirmDialog from "../../mui/showConfirmDialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn()
}));

const buildEntity = (overrides = {}) => ({
  id: 42,
  title: "Dev",
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@test.com",
  member: null,
  bio: "",
  irc: "",
  twitter: "",
  company: "",
  phone_number: "",
  pic: "https://cdn.test/pic.png",
  big_pic: "https://cdn.test/big.png",
  all_presentations: [],
  registration_codes: [],
  summit_assistances: [],
  affiliations: [],
  ...overrides
});

const renderForm = (props = {}) => {
  const onRemoveAttach = props.onRemoveAttach || jest.fn().mockResolvedValue();
  const entity = buildEntity(props.entity);
  const { container, rerender } = render(
    <SpeakerForm
      entity={entity}
      errors={{}}
      summits={[]}
      history={{ push: jest.fn() }}
      onSubmit={jest.fn()}
      onAttach={jest.fn()}
      onRemoveAttach={onRemoveAttach}
    />
  );
  const rerenderWithEntity = (nextEntity) =>
    rerender(
      <SpeakerForm
        entity={nextEntity}
        errors={{}}
        summits={[]}
        history={{ push: jest.fn() }}
        onSubmit={jest.fn()}
        onAttach={jest.fn()}
        onRemoveAttach={onRemoveAttach}
      />
    );
  return { onRemoveAttach, container, entity, rerenderWithEntity };
};

// uicore's UploadInput only renders its `.remove` control while the preview is hovered
const previews = (container) => container.querySelectorAll(".file-box");

const clickRemove = async (container, index) => {
  const preview = previews(container)[index];
  await userEvent.hover(preview);
  await userEvent.click(preview.querySelector(".remove"));
};

describe("SpeakerForm photo removal", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deletes the profile photo only after the user confirms", async () => {
    showConfirmDialog.mockResolvedValue(true);
    const { onRemoveAttach, container } = renderForm();

    await clickRemove(container, 0);

    await waitFor(() =>
      expect(onRemoveAttach).toHaveBeenCalledWith(42, "profile")
    );
    expect(showConfirmDialog).toHaveBeenCalledTimes(1);
  });

  it("deletes nothing when the user cancels the confirm", async () => {
    showConfirmDialog.mockResolvedValue(false);
    const { onRemoveAttach, container } = renderForm();

    await clickRemove(container, 0);

    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalledTimes(1));
    expect(onRemoveAttach).not.toHaveBeenCalled();
  });

  it("targets the big photo endpoint from the big photo input", async () => {
    showConfirmDialog.mockResolvedValue(true);
    const { onRemoveAttach, container } = renderForm();

    await clickRemove(container, 1);

    await waitFor(() => expect(onRemoveAttach).toHaveBeenCalledWith(42, "big"));
  });

  it("clears the field locally without confirming for an unsaved speaker", async () => {
    const { onRemoveAttach, container } = renderForm({ entity: { id: 0 } });

    await clickRemove(container, 0);

    await waitFor(() => expect(previews(container)).toHaveLength(1));
    expect(showConfirmDialog).not.toHaveBeenCalled();
    expect(onRemoveAttach).not.toHaveBeenCalled();
  });

  it("preserves unsaved field edits when the removal updates props.entity", async () => {
    showConfirmDialog.mockResolvedValue(true);
    // real removeAttachedPicture resolves only after the PIC_DELETED-driven
    // redux update has already flowed down as new props - a promise that
    // never settles during this test reproduces that ordering
    const onRemoveAttach = jest.fn(() => new Promise(() => {}));
    const { container, entity, rerenderWithEntity } = renderForm({
      onRemoveAttach
    });

    const twitterInput = container.querySelector("#twitter");
    await userEvent.clear(twitterInput);
    await userEvent.type(twitterInput, "unsaved-handle");
    expect(twitterInput.value).toBe("unsaved-handle");

    await clickRemove(container, 0);
    await waitFor(() =>
      expect(onRemoveAttach).toHaveBeenCalledWith(42, "profile")
    );

    // simulates the redux entity coming back down as props after PIC_DELETED,
    // with only the picture field cleared and every other field unchanged
    rerenderWithEntity({ ...entity, pic: "" });

    expect(container.querySelector("#twitter").value).toBe("unsaved-handle");
  });
});
