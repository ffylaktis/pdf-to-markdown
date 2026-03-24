"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatFileSize } from "@/lib/utils";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isConverting: boolean;
}

export default function FileUploader({
  onFileSelected,
  isConverting,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: isConverting,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
        ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"}
        ${isConverting ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {isDragActive ? (
          <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
            Drop your PDF here
          </p>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
              Drop a PDF here, or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Accepts .pdf files up to 50 MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
