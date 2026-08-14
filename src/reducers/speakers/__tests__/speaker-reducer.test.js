/**
 * @jest-environment jsdom
 */
import speakerReducer from "../speaker-reducer";
import { BIG_PIC_DELETED, PIC_DELETED } from "../../../actions/speaker-actions";

const stateWithPics = {
  entity: {
    id: 42,
    first_name: "Ada",
    pic: "https://cdn.test/pic.png",
    big_pic: "https://cdn.test/big.png"
  },
  errors: {}
};

describe("speakerReducer photo deletion", () => {
  it("clears pic and leaves big_pic untouched on PIC_DELETED", () => {
    const next = speakerReducer(stateWithPics, {
      type: PIC_DELETED,
      payload: { response: {} }
    });

    expect(next.entity.pic).toBe("");
    expect(next.entity.big_pic).toBe("https://cdn.test/big.png");
    expect(next.entity.first_name).toBe("Ada");
  });

  it("clears big_pic and leaves pic untouched on BIG_PIC_DELETED", () => {
    const next = speakerReducer(stateWithPics, {
      type: BIG_PIC_DELETED,
      payload: { response: {} }
    });

    expect(next.entity.big_pic).toBe("");
    expect(next.entity.pic).toBe("https://cdn.test/pic.png");
  });
});
