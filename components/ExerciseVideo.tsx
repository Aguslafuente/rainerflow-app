"use client";

import { useState } from "react";

export function ExerciseVideo({
  url,
  label,
  small = false,
}: {
  url: string;
  label?: string;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`video-btn ${small ? "sm" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Ver video"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        Video
      </button>
      {open && (
        <div className="video-overlay" onClick={() => setOpen(false)}>
          <div className="video-box" onClick={(e) => e.stopPropagation()}>
            {label && <div className="video-title">{label}</div>}
            <video
              src={url}
              autoPlay
              muted
              loop
              playsInline
              controls
              style={{ width: "100%", borderRadius: 12, background: "#000" }}
            />
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12, width: "auto" }}
              onClick={() => setOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
