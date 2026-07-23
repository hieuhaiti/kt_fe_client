// Tải file raster (GeoTIFF hoặc ZIP) từ URL và trigger browser download.
// Mirror admin/src/lib/geoserver.ts:downloadRasterFile — detect magic bytes để
// đảm bảo extension đúng (GeoServer WCS trả `image/tiff` trực tiếp, còn GEE
// getDownloadURL đôi khi trả ZIP bundle).

function detectRasterExtension(bytes) {
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "zip";

  const littleEndianTiff =
    bytes[0] === 0x49 &&
    bytes[1] === 0x49 &&
    (bytes[2] === 0x2a || bytes[2] === 0x2b) &&
    bytes[3] === 0x00;
  const bigEndianTiff =
    bytes[0] === 0x4d &&
    bytes[1] === 0x4d &&
    bytes[2] === 0x00 &&
    (bytes[3] === 0x2a || bytes[3] === 0x2b);

  return littleEndianTiff || bigEndianTiff ? "tif" : null;
}

function withExtension(filename, extension) {
  return /\.[^.]+$/.test(filename)
    ? filename.replace(/\.[^.]+$/, `.${extension}`)
    : `${filename}.${extension}`;
}

export async function downloadRasterFile(url, filename) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Máy chủ trả lỗi HTTP ${response.status}.`);

  const blob = await response.blob();
  if (!blob.size) throw new Error("Tệp raster tải về rỗng.");

  const bytes = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const extension = detectRasterExtension(bytes);
  if (!extension) throw new Error("Máy chủ không trả về tệp GeoTIFF hợp lệ.");

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = withExtension(filename, extension);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}
