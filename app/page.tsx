"use client";

import { useState, useCallback } from "react";
import FileUploader from "@/components/FileUploader";
import MarkdownPreview from "@/components/MarkdownPreview";
import MarkdownEditor from "@/components/MarkdownEditor";
import ActionBar from "@/components/ActionBar";
import { parsePDF } from "@/lib/pdf-parser";
import { convertToMarkdown } from "@/lib/markdown-converter";
import { formatFileSize } from "@/lib/utils";

export default function Home() {
  const [markdown, setMarkdown] = useState("");
  const [filename, setFilename] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState({ page: 0, total: 0 });
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  const handleFileSelected = useCallback(async (file: File) => {
    setError("");
    setIsConverting(true);
    setFilename(file.name);
    setMarkdown("");
    setProgress({ page: 0, total: 0 });

    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parsePDF(buffer, (page, total) => {
        setProgress({ page, total });
      });

      if (parsed.pages.every((p) => p.items.length === 0)) {
        setError(
          "No text found in this PDF. It may be a scanned document (image-based). Text extraction requires PDFs with embedded text."
        );
        setIsConverting(false);
        return;
      }

      const md = convertToMarkdown(parsed);
      setMarkdown(md);
    } catch (err) {
      setError(
        `Failed to convert PDF: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsConverting(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            PDF to Markdown
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Client-side conversion
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {!markdown && !isConverting && (
          <div className="max-w-2xl mx-auto">
            <FileUploader
              onFileSelected={handleFileSelected}
              isConverting={isConverting}
            />
          </div>
        )}

        {isConverting && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Converting {filename}...
            </p>
            {progress.total > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Page {progress.page} of {progress.total}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mt-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {markdown && !isConverting && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setMarkdown("");
                  setFilename("");
                  setError("");
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Upload new file
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filename}
              </span>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col min-h-[500px]">
              <ActionBar
                markdown={markdown}
                filename={filename}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              <div className="flex-1 overflow-auto">
                {activeTab === "preview" ? (
                  <MarkdownPreview markdown={markdown} />
                ) : (
                  <MarkdownEditor markdown={markdown} onChange={setMarkdown} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Your PDF never leaves your browser. All processing happens locally.
      </footer>
    </div>
  );
}
