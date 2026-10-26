"use client";

import { useId, useState } from "react";

import {
  CONNECT_QR_ALT,
  CONNECT_QR_ART_PATH,
  CONNECT_QR_STANDARD_PATH,
  CONNECT_QR_TOGGLE_SHOW_ILLUSTRATED,
  CONNECT_QR_TOGGLE_SHOW_STANDARD,
} from "@/lib/connect";

/** Rendered QR artwork size inside the 17.5rem panel (280px − 2×8px padding). */
const QR_DISPLAY_SIZE = 264;

type QrMode = "illustrated" | "standard";

export function ConnectQrToggle() {
  const [mode, setMode] = useState<QrMode>("illustrated");
  const qrImageId = useId();

  const isIllustrated = mode === "illustrated";
  const src = isIllustrated ? CONNECT_QR_ART_PATH : CONNECT_QR_STANDARD_PATH;
  const toggleLabel = isIllustrated
    ? CONNECT_QR_TOGGLE_SHOW_STANDARD
    : CONNECT_QR_TOGGLE_SHOW_ILLUSTRATED;

  return (
    <div className="connect-qr-section">
      <div className="connect-qr-panel" data-qr-mode={mode}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          id={qrImageId}
          className="connect-qr"
          src={src}
          alt={CONNECT_QR_ALT}
          width={QR_DISPLAY_SIZE}
          height={QR_DISPLAY_SIZE}
          decoding="async"
        />
      </div>
      <button
        type="button"
        className="connect-qr-toggle"
        aria-controls={qrImageId}
        aria-pressed={!isIllustrated}
        onClick={() =>
          setMode((current) =>
            current === "illustrated" ? "standard" : "illustrated",
          )
        }
      >
        {toggleLabel}
      </button>
    </div>
  );
}
