"use client";

import { Camera, ImagePlus, LoaderCircle, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";

import { removeProfilePhoto, uploadProfilePhoto } from "@/lib/profile-actions";

/** Files under this go up as they are; bigger ones are shrunk in the browser first. */
const SEND_AS_IS = 1.5 * 1024 * 1024;
/** Matches `RAW_PHOTO_LIMIT` on the server. */
const RAW_LIMIT = 9 * 1024 * 1024;
/** Longest side when shrinking in the browser. The server makes the final WebP. */
const SHRINK_TO = 2048;

/**
 * Makes a big phone photo quicker to send. The server still converts whatever arrives to WebP;
 * this only saves mobile data. Formats the browser can't draw (HEIC on Android, say) go as they are.
 */
async function shrink(file: File): Promise<Blob> {
  if (file.size <= SEND_AS_IS || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, SHRINK_TO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    // JPEG has no transparency: put see-through PNGs on white rather than black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.9));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/**
 * The photo at the top of Edit profile. Tapping it opens a sheet (from the bottom on phones)
 * to take a photo, pick one or remove it. A picked photo is saved straight away.
 */
export function PhotoPicker({ photoUrl, initials }: { photoUrl?: string; initials: string }) {
  const sheetRef = useRef<HTMLDialogElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(photoUrl);
  const [preview, setPreview] = useState<string>();
  const [message, setMessage] = useState<{ tone: "error" | "done"; text: string }>();
  const [pending, startTransition] = useTransition();

  // Free the preview's memory once it is replaced or the screen closes.
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  const close = () => sheetRef.current?.close();

  function choose(input: HTMLInputElement | null) {
    close();
    input?.click();
  }

  function onPicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // Picking the same file again should still count.
    if (!file) return;
    setMessage(undefined);

    startTransition(async () => {
      const blob = await shrink(file);
      if (blob.size > RAW_LIMIT) {
        setMessage({ tone: "error", text: "This photo is too large. Choose one under 9 MB." });
        return;
      }
      setPreview(URL.createObjectURL(blob));
      const data = new FormData();
      data.append("photo", blob, file.name || "photo");
      const result = await uploadProfilePhoto(data).catch(() => ({
        error: "We couldn’t save your photo. Check your connection and try again.",
        photoUrl: undefined,
      }));
      setPreview(undefined);
      if (result.error) {
        setMessage({ tone: "error", text: result.error });
      } else {
        setSaved(result.photoUrl);
        setMessage({ tone: "done", text: "Photo updated" });
      }
    });
  }

  function remove() {
    close();
    setMessage(undefined);
    startTransition(async () => {
      try {
        await removeProfilePhoto();
        setSaved(undefined);
        setMessage({ tone: "done", text: "Photo removed" });
      } catch {
        setMessage({ tone: "error", text: "We couldn’t remove your photo. Try again." });
      }
    });
  }

  const shown = preview ?? saved;
  const sheetItem =
    "flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-base font-semibold text-ink hover:bg-selected";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <button
        type="button"
        onClick={() => sheetRef.current?.showModal()}
        disabled={pending}
        aria-label={saved ? "Change profile photo" : "Add profile photo"}
        className="group relative rounded-full disabled:cursor-wait"
      >
        <span className="relative inline-flex size-28 items-center justify-center overflow-hidden rounded-full bg-success text-3xl font-bold text-white ring-4 ring-card shadow-card">
          {shown ? (
            <Image
              src={shown}
              alt=""
              fill
              sizes="112px"
              unoptimized={Boolean(preview)}
              className="object-cover"
              onError={() => setPreview(undefined)}
            />
          ) : (
            initials
          )}
          {pending ? (
            <span className="absolute inset-0 flex items-center justify-center bg-ink/55">
              <LoaderCircle aria-hidden className="size-8 animate-spin" />
            </span>
          ) : null}
        </span>
        <span className="absolute bottom-0.5 right-0.5 inline-flex size-9 items-center justify-center rounded-full bg-brand text-white ring-4 ring-card transition-transform group-hover:scale-105">
          <Camera aria-hidden className="size-4.5" />
        </span>
      </button>

      <p aria-live="polite" className="min-h-5 text-sm font-semibold">
        {pending ? (
          <span className="text-body">Saving your photo…</span>
        ) : message ? (
          <span className={message.tone === "error" ? "text-danger" : "text-success"}>{message.text}</span>
        ) : (
          <button
            type="button"
            onClick={() => sheetRef.current?.showModal()}
            className="text-brand hover:underline"
          >
            {saved ? "Change photo" : "Add a photo"}
          </button>
        )}
      </p>

      <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={onPicked} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={onPicked} />

      {/* A bottom sheet on phones, a small dialog on wider screens. */}
      <dialog
        ref={sheetRef}
        aria-labelledby="photo-sheet-title"
        onClick={(event) => event.target === sheetRef.current && close()}
        className="sheet fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-3xl bg-card p-0 text-ink shadow-floating backdrop:bg-ink/45 sm:inset-0 sm:m-auto sm:h-fit sm:max-w-sm sm:rounded-3xl"
      >
        <div className="px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 sm:pb-3">
          <span aria-hidden className="mx-auto mb-2 block h-1.5 w-10 rounded-full bg-line sm:hidden" />
          <div className="flex items-center justify-between px-4 py-2">
            <h2 id="photo-sheet-title" className="font-display text-lg font-bold">Profile photo</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="inline-flex size-9 items-center justify-center rounded-full text-body hover:bg-selected"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <p className="px-4 pb-2 text-left text-xs text-body">
            Any photo format works. We turn it into a small WebP under 2 MB.
          </p>
          {/* Phones and tablets only: on a computer the camera option opens the same file picker. */}
          <button type="button" onClick={() => choose(cameraRef.current)} className={`${sheetItem} hidden pointer-coarse:flex`}>
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Camera aria-hidden className="size-5" />
            </span>
            Take a photo
          </button>
          <button type="button" onClick={() => choose(galleryRef.current)} className={sheetItem}>
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand">
              <ImagePlus aria-hidden className="size-5" />
            </span>
            <span className="pointer-coarse:hidden">Choose a file</span>
            <span className="hidden pointer-coarse:inline">Choose from gallery</span>
          </button>
          {saved ? (
            <button type="button" onClick={remove} className={`${sheetItem} text-danger`}>
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-danger-soft">
                <Trash2 aria-hidden className="size-5" />
              </span>
              Remove photo
            </button>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
