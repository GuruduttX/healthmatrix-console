"use client";

import { Camera, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";

import { DialogHeader, dialogClass } from "@/components/dialog-parts";
import { IconTile } from "@/components/ui";
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
  const sheetItem = "btn btn-lg w-full justify-start gap-3 px-2.5 text-left font-medium";

  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <button
        type="button"
        onClick={() => sheetRef.current?.showModal()}
        disabled={pending}
        aria-label={saved ? "Change profile photo" : "Add profile photo"}
        className="group relative rounded-full disabled:cursor-wait"
      >
        {/* In a ring of white, as on the profile; the camera badge is the one orange on it. */}
        <span className="block rounded-full bg-white/70 p-1 shadow-[0_1px_2px_rgba(30,50,70,0.06),0_6px_14px_rgba(30,50,70,0.1)]">
          <span className="relative inline-flex size-24 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-brand-mid to-brand text-2xl font-bold text-white">
            {shown ? (
              <Image
                src={shown}
                alt=""
                fill
                sizes="96px"
                unoptimized={Boolean(preview)}
                className="object-cover"
                onError={() => setPreview(undefined)}
              />
            ) : (
              initials
            )}
            {pending ? (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/55">
                <LoaderCircle aria-hidden className="size-6 animate-spin" />
              </span>
            ) : null}
          </span>
        </span>
        <span className="absolute bottom-0 right-0 inline-flex size-9 items-center justify-center rounded-full border-[2.5px] border-white bg-brand-deep text-white shadow-glow transition-transform group-active:scale-95">
          <Camera aria-hidden className="size-4" />
        </span>
      </button>

      <p aria-live="polite" className="min-h-5 text-[13px] font-medium">
        {pending ? (
          <span className="text-body">Saving your photo…</span>
        ) : message ? (
          <span className={message.tone === "error" ? "text-danger" : "text-brand-deep"}>{message.text}</span>
        ) : (
          <button
            type="button"
            onClick={() => sheetRef.current?.showModal()}
            className="font-semibold text-body hover:text-ink hover:underline"
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
        className={`${dialogClass} text-left`}
      >
        <DialogHeader titleId="photo-sheet-title" title="Profile photo" onClose={close} />
        <div className="px-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-1 sm:pb-3">
          <p className="px-2.5 pb-2 text-left text-xs text-muted">
            Any photo format works. We turn it into a small WebP under 2 MB.
          </p>
          {/* Phones and tablets only: on a computer the camera option opens the same file picker. */}
          <button type="button" onClick={() => choose(cameraRef.current)} className={`${sheetItem} btn-ghost text-ink pointer-fine:hidden`}>
            <IconTile icon={Camera} tone="neutral" />
            Take a photo
          </button>
          <button type="button" onClick={() => choose(galleryRef.current)} className={`${sheetItem} btn-ghost text-ink`}>
            <IconTile icon={ImagePlus} tone="neutral" />
            <span className="pointer-coarse:hidden">Choose a file</span>
            <span className="hidden pointer-coarse:inline">Choose from gallery</span>
          </button>
          {saved ? (
            <button type="button" onClick={remove} className={`${sheetItem} btn-danger-ghost`}>
              <IconTile icon={Trash2} tone="danger" />
              Remove photo
            </button>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
