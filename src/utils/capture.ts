// Holds the photo being analysed between the Camera and Analyzing screens,
// so multi-megabyte base64 never travels through navigation params.
export type Capture = { uri: string; base64: string; mediaType: string };

let pending: Capture | undefined;

export const setPendingCapture = (c: Capture) => {
  pending = c;
};

export const takePendingCapture = () => pending;

export const clearPendingCapture = () => {
  pending = undefined;
};

export const mediaTypeFor = (uri: string, fallback = 'image/jpeg') => {
  const m = uri.match(/^data:(image\/[a-z]+);/);
  if (m) return m[1];
  if (/\.png$/i.test(uri)) return 'image/png';
  if (/\.webp$/i.test(uri)) return 'image/webp';
  return fallback;
};
