"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

type MenuImageUploadProps = {
  restaurantId: string;
  value: string;
  onChange: (url: string) => void;
};

export function MenuImageUpload({ restaurantId, value, onChange }: MenuImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!/^(image\/jpeg|image\/png|image\/webp)$/i.test(file.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setBusy(true);
    setProgress(0);
    setError("");

    try {
      const blob = await upload(`restaurants/${restaurantId}/menu/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/owner/menu/upload",
        clientPayload: JSON.stringify({ restaurantId }),
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      onChange(blob.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function openFilePicker() {
    if (!busy) inputRef.current?.click();
  }

  return (
    <div className="owner-menu-upload">
      <div className="owner-menu-upload-row">
        <button
          type="button"
          className="outline-button owner-upload-button"
          onClick={openFilePicker}
          disabled={busy}
          aria-label={busy ? `Uploading image ${progress}%` : "Upload menu photo"}
        >
          {busy ? `Uploading ${progress}%` : "Upload photo"}
        </button>
        <input
          ref={inputRef}
          className="owner-upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          disabled={busy}
          aria-hidden="true"
          tabIndex={-1}
        />
        {value && <span className="owner-upload-success">Photo ready</span>}
      </div>
      <small>JPG, PNG, or WebP. Maximum 5 MB.</small>
      {busy && <progress value={progress} max={100} aria-label="Image upload progress" />}
      {error && <span className="owner-upload-error" role="alert">{error}</span>}
    </div>
  );
}
