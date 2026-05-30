// frontend/src/components/window-title-bar.tsx

"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";

const appWindow = getCurrentWindow();

export function WindowTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = async () => {
    try {
      await appWindow.minimize();
    } catch (err) {
      console.error("Minimize failed:", err);
    }
  };

  const handleMaximize = async () => {
    try {
      await appWindow.toggleMaximize();
      setIsMaximized(!isMaximized);
    } catch (err) {
      console.error("Maximize failed:", err);
    }
  };

  const handleClose = async () => {
    try {
      await appWindow.close();
    } catch (err) {
      console.error("Close failed:", err);
    }
  };

  return (
    <div
      className="flex w-screen items-center justify-between p-3"
      data-tauri-drag-region
    >
      {/* Traffic Lights */}
      <div className="flex h-full items-center gap-2">
        {/* Close */}
        <button
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="group flex h-3 w-3 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[#ff5f57] transition-all hover:brightness-95"
          title="Close"
        >
          <svg
            width="6"
            height="6"
            viewBox="0 0 6 6"
            fill="none"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <path d="M1 1L5 5M5 1L1 5" stroke="#4a0000" strokeWidth="1" />
          </svg>
        </button>
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          onMouseDown={(e) => e.stopPropagation()}
          className="group flex h-3 w-3 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[#febc2e] transition-all hover:brightness-95"
          title="Minimize"
        >
          <svg
            width="6"
            height="1"
            viewBox="0 0 6 1"
            fill="none"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <path d="M0.5 0.5H5.5" stroke="#8a6000" strokeWidth="1" />
          </svg>
        </button>
        {/* Maximize */}
        <button className="group pointer-events-none flex h-3 w-3 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-gray-400"></button>
      </div>

      {/* Center title (optional, can be used for page title) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 select-none text-xs text-[#6b7280]"
        data-tauri-drag-region
      >
        link-do
      </div>

      {/* Spacer to balance the traffic lights */}
      <div className="w-[90px]" />
    </div>
  );
}

export function HomeWindowTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = async () => {
    try {
      await appWindow.minimize();
    } catch (err) {
      console.error("Minimize failed:", err);
    }
  };

  const handleMaximize = async () => {
    try {
      await appWindow.toggleMaximize();
      setIsMaximized(!isMaximized);
    } catch (err) {
      console.error("Maximize failed:", err);
    }
  };

  const handleClose = async () => {
    try {
      await appWindow.close();
    } catch (err) {
      console.error("Close failed:", err);
    }
  };

  return (
    <div
      className="flex h-8 w-screen items-center justify-between"
      data-tauri-drag-region
    >
      {/* Traffic Lights */}
      <div
        className="flex h-full w-[280px] items-center gap-2 bg-white px-3"
        data-tauri-drag-region
      >
        {/* Close */}
        <button
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="group flex h-3 w-3 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[#ff5f57] transition-all hover:brightness-95"
          title="Close"
        >
          <svg
            width="6"
            height="6"
            viewBox="0 0 6 6"
            fill="none"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <path d="M1 1L5 5M5 1L1 5" stroke="#4a0000" strokeWidth="1" />
          </svg>
        </button>
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          onMouseDown={(e) => e.stopPropagation()}
          className="group flex h-3 w-3 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[#febc2e] transition-all hover:brightness-95"
          title="Minimize"
        >
          <svg
            width="6"
            height="1"
            viewBox="0 0 6 1"
            fill="none"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <path d="M0.5 0.5H5.5" stroke="#8a6000" strokeWidth="1" />
          </svg>
        </button>
        {/* Maximize */}
        <button className="group pointer-events-none flex h-3 w-3 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-gray-400"></button>
      </div>

      {/* Center title (optional, can be used for page title) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 select-none text-xs text-[#6b7280]"
        data-tauri-drag-region
      ></div>
    </div>
  );
}
