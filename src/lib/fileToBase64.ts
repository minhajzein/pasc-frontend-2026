/**
 * Read a File and return its base64 data URL (e.g. "data:image/png;base64,...").
 * Use the full data URL or strip the prefix when sending to API depending on backend expectation.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Return base64 string without the data URL prefix (e.g. "image/png;base64,").
 * Use this when the API expects raw base64.
 */
export function fileToBase64Raw(file: File): Promise<string> {
  return fileToBase64(file).then((dataUrl) => {
    const base64 = dataUrl.split(",")[1];
    if (!base64) throw new Error("Invalid data URL");
    return base64;
  });
}
