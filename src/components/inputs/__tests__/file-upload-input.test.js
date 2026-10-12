import React from "react";
import { render } from "@testing-library/react";
import FileUploadInput from "../file-upload-input";

const renderedProps = {};

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/upload-input-v3",
  () => ({
    __esModule: true,
    default: (props) => {
      renderedProps.v3 = props;
      return null;
    }
  })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/upload-input-v4",
  () => ({
    __esModule: true,
    default: (props) => {
      renderedProps.v4 = props;
      return null;
    }
  })
);

const API_BASE = "https://file-upload-api.test";

describe("FileUploadInput", () => {
  const onUploadComplete = jest.fn();

  beforeEach(() => {
    delete renderedProps.v3;
    delete renderedProps.v4;
    window.FILE_UPLOAD_API_BASE_URL = API_BASE;
  });

  afterEach(() => {
    delete window.FILE_UPLOAD_API_BASE_URL;
    delete window.FILE_UPLOAD_USE_V4;
  });

  const renderInput = () =>
    render(
      <FileUploadInput
        id="slide"
        value={[]}
        onUploadComplete={onUploadComplete}
        parallelChunkUploads
      />
    );

  it("uploads direct to storage through V4 when the flag is 'true'", () => {
    window.FILE_UPLOAD_USE_V4 = "true";

    renderInput();

    expect(renderedProps.v3).toBeUndefined();
    expect(renderedProps.v4.postUrl).toBe(`${API_BASE}/api/v1/files`);
    expect(renderedProps.v4.id).toBe("slide");
    expect(renderedProps.v4.onUploadComplete).toBe(onUploadComplete);
    expect(renderedProps.v4).not.toHaveProperty("djsConfig");
    expect(renderedProps.v4).not.toHaveProperty("parallelChunkUploads");
  });

  it.each([undefined, "false", "1"])(
    "keeps the chunked V3 upload when the flag is %p",
    (flag) => {
      if (flag !== undefined) window.FILE_UPLOAD_USE_V4 = flag;

      renderInput();

      expect(renderedProps.v4).toBeUndefined();
      expect(renderedProps.v3.postUrl).toBe(`${API_BASE}/api/v1/files/upload`);
      expect(renderedProps.v3.djsConfig).toEqual({ withCredentials: true });
      expect(renderedProps.v3.parallelChunkUploads).toBe(true);
      expect(renderedProps.v3.onUploadComplete).toBe(onUploadComplete);
    }
  );
});
