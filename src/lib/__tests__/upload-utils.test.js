import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeUploadError } from "../upload-utils.js";

describe("W071 - Upload Error Mapping & Technical Leakage Prevention", () => {
  test("1. Oversized file simulation maps to Vietnamese message with action", () => {
    const error1 = new Error("File too large");
    const error2 = "File exceeds maxSize limit (oversized)";
    
    const msg1 = normalizeUploadError(error1);
    const msg2 = normalizeUploadError(error2);

    assert.equal(msg1, "Tệp quá lớn. Hãy chọn tệp nhỏ hơn.");
    assert.equal(msg2, "Tệp quá lớn. Hãy chọn tệp nhỏ hơn.");
  });

  test("2. Unsupported file type simulation maps to Vietnamese message with action", () => {
    const error1 = new Error("File type not accepted");
    const error2 = "Unsupported MIME type: application/x-dosexec";

    const msg1 = normalizeUploadError(error1);
    const msg2 = normalizeUploadError(error2);

    assert.equal(msg1, "Định dạng tệp không được hỗ trợ. Hãy chọn tệp khác.");
    assert.equal(msg2, "Định dạng tệp không được hỗ trợ. Hãy chọn tệp khác.");
  });

  test("3. Network failure simulation maps to Vietnamese message with action", () => {
    const error1 = new Error("Network error: fetch failed ECONNREFUSED");
    const error2 = "Request timeout after 30000ms";

    const msg1 = normalizeUploadError(error1);
    const msg2 = normalizeUploadError(error2);

    assert.equal(msg1, "Kết nối không ổn định. Kiểm tra mạng rồi thử lại.");
    assert.equal(msg2, "Kết nối không ổn định. Kiểm tra mạng rồi thử lại.");
  });

  test("4. Generic Error('Upload failed') maps to safe fallback without leaking raw details", () => {
    const genericErr = new Error("Upload failed");
    const msg = normalizeUploadError(genericErr);

    assert.equal(msg, "Không thể tải tệp lên. Kiểm tra tệp rồi thử lại.");
  });

  test("5. Server rejection (403, 500) maps to safe server error message", () => {
    const serverErr = new Error("Server rejected request: HTTP 500 Internal Server Error");
    const msg = normalizeUploadError(serverErr);

    assert.equal(msg, "Máy chủ không nhận tệp. Hãy thử lại sau.");
  });

  test("6. Never leaks technical stack, fetch failed, AxiosError, blob, or internal path", () => {
    const simulatedTechnicalLeak = new Error(
      "AxiosError: fetch failed at D:\\Code\\@kt_web_GIS\\client\\src\\services\\upload.js:42 blob:http://localhost/123\n    at Object.upload (D:\\Code\\@kt_web_GIS\\client\\src\\services\\upload.js:45)"
    );

    const message = normalizeUploadError(simulatedTechnicalLeak);

    assert.doesNotMatch(message, /stack/i);
    assert.doesNotMatch(message, /fetch failed/i);
    assert.doesNotMatch(message, /AxiosError/i);
    assert.doesNotMatch(message, /blob:/i);
    assert.doesNotMatch(message, /D:\\Code/i);
    assert.doesNotMatch(message, /localhost/i);
    assert.ok(message.length > 0);
  });
});
