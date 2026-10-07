import { createHash } from "node:crypto";

import sharp from "sharp";

/**
 * Profile photos: any image the doctor picks is converted here, with sharp, to a WebP under
 * 2 MB, then stored on Cloudinary as it is. No Cloudinary transformations are asked for, on
 * upload or in the URL, so what patients see is exactly this file.
 */

/** The most a stored photo may weigh. */
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
/** The most a picked file may weigh before conversion. Under `serverActions.bodySizeLimit`. */
export const RAW_PHOTO_LIMIT = 9 * 1024 * 1024;

/** Longest side of the stored photo. Plenty for an avatar shown at up to 160 CSS pixels. */
const MAX_SIDE = 1024;
/** Tried in turn until the WebP fits; smaller sizes come last, and are rarely needed. */
const ATTEMPTS = [
  { side: MAX_SIDE, quality: 82 },
  { side: MAX_SIDE, quality: 70 },
  { side: 800, quality: 65 },
  { side: 640, quality: 55 },
];

export class PhotoError extends Error {}

/** HEIC and HEIF, as iPhones save them. sharp's own build can't read them. */
function isHeif(bytes: Buffer) {
  if (bytes.length < 12 || bytes.toString("ascii", 4, 8) !== "ftyp") return false;
  return ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(
    bytes.toString("ascii", 8, 12),
  );
}

/** Decodes the picked file into something sharp can read. */
async function readable(bytes: Buffer): Promise<Buffer> {
  if (!isHeif(bytes)) return bytes;
  const { default: convert } = await import("heic-convert");
  try {
    return Buffer.from(await convert({ buffer: bytes, format: "JPEG", quality: 0.95 }));
  } catch {
    throw new PhotoError("We couldn’t read this HEIC photo. Try a JPG or PNG instead.");
  }
}

/** Any image → a WebP no bigger than `PHOTO_MAX_BYTES`, turned the right way up. */
export async function toWebp(file: File): Promise<Buffer> {
  if (file.size === 0) throw new PhotoError("This file is empty. Choose another photo.");
  if (file.size > RAW_PHOTO_LIMIT) throw new PhotoError("This photo is too large. Choose one under 9 MB.");

  const source = await readable(Buffer.from(await file.arrayBuffer()));
  // Only the first frame of an animated GIF or WebP; a huge image is refused, not decoded.
  const image = () => sharp(source, { animated: false, limitInputPixels: 80_000_000 });

  try {
    const meta = await image().metadata();
    if (!meta.width || !meta.height) throw new PhotoError("This file isn’t a photo we can read.");
  } catch (error) {
    if (error instanceof PhotoError) throw error;
    throw new PhotoError("This file isn’t a photo we can read. Try a JPG, PNG or WebP.");
  }

  for (const { side, quality } of ATTEMPTS) {
    const webp = await image()
      .rotate() // Applies the camera's orientation, then drops the EXIF, location included.
      .resize(side, side, { fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toBuffer();
    if (webp.length <= PHOTO_MAX_BYTES) return webp;
  }
  throw new PhotoError("We couldn’t make this photo small enough. Try another one.");
}

// ---------------------------------------------------------------------------
// Cloudinary, through its upload API with a signed request. No SDK needed.

function cloudinary() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new Error("Cloudinary is not configured (CLOUDINARY_* in .env)");
  return { cloud, key, secret };
}

/** Cloudinary's signature: the parameters sorted by name, joined, with the secret, SHA-1. */
function signed(params: Record<string, string>) {
  const { key, secret } = cloudinary();
  const toSign = Object.keys(params)
    .sort()
    .map((name) => `${name}=${params[name]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + secret).digest("hex");
  return { ...params, api_key: key, signature };
}

/** One photo per doctor, replaced in place, so old photos never pile up. */
const publicId = (doctorId: string) => `healthmatrix/doctors/${doctorId}`;

async function call(action: "upload" | "destroy", body: FormData) {
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary().cloud}/image/${action}`, {
    method: "POST",
    body,
  });
  const result = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    result?: string;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(`Cloudinary ${action} failed (${response.status}): ${result.error?.message ?? "no message"}`);
  }
  return result;
}

/** Stores the WebP and returns its URL. The URL's version changes each time, so caches refresh. */
export async function uploadPhoto(doctorId: string, webp: Buffer) {
  const params = signed({
    public_id: publicId(doctorId),
    overwrite: "true",
    invalidate: "true",
    timestamp: String(Math.floor(Date.now() / 1000)),
  });
  const body = new FormData();
  body.append("file", new Blob([new Uint8Array(webp)], { type: "image/webp" }), "photo.webp");
  for (const [name, value] of Object.entries(params)) body.append(name, value);

  const { secure_url } = await call("upload", body);
  if (!secure_url) throw new Error("Cloudinary upload returned no URL");
  return secure_url;
}

/** Deletes the doctor's photo. Missing already is fine. */
export async function deletePhoto(doctorId: string) {
  const params = signed({
    public_id: publicId(doctorId),
    invalidate: "true",
    timestamp: String(Math.floor(Date.now() / 1000)),
  });
  const body = new FormData();
  for (const [name, value] of Object.entries(params)) body.append(name, value);
  await call("destroy", body);
}
