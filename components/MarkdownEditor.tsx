"use client";

interface MarkdownEditorProps {
  markdown: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({
  markdown,
  onChange,
}: MarkdownEditorProps) {
  return (
    <textarea
      className="w-full h-full p-6 font-mono text-sm bg-transparent resize-none focus:outline-none text-gray-800 dark:text-gray-200"
      value={markdown}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  );
}
