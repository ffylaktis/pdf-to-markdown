"use client";

import { useState } from "react";
import { copyToClipboard, downloadMarkdown } from "@/lib/utils";

interface ActionBarProps {
  markdown: string;
  filename: string;
  activeTab: "preview" | "raw";
  onTabChange: (tab: "preview" | "raw") => void;
}

export default function ActionBar({
  markdown,
  filename,
  activeTab,
  onTabChange,
}: ActionBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(markdown);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex gap-1">
        <button
          onClick={() => onTabChange("preview")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === "preview"
              ? "bg-gray-200 dark:bg-gray-700 font-medium"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => onTabChange("raw")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === "raw"
              ? "bg-gray-200 dark:bg-gray-700 font-medium"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          Raw
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
        <button
          onClick={() => downloadMarkdown(markdown, filename)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download .md
        </button>
      </div>
    </div>
  );
}
