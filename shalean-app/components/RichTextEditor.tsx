"use client";

import React, { useEffect, useRef } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className = "",
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Keep DOM in sync when the value changes externally.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== el.innerHTML) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command: string, valueArg?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore execCommand is still widely supported in browsers we target.
    document.execCommand(command, false, valueArg);
    onChange(el.innerHTML);
  };

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerHTML);
  };

  const isEmpty = !value || value.replace(/<br\s*\/?>/gi, "").trim().length === 0;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 underline"
        >
          U
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
        >
          1. List
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h2>")}
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h3>")}
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
        >
          H3
        </button>
      </div>

      <div className="relative">
        {placeholder && isEmpty && (
          <div className="pointer-events-none absolute inset-x-3 top-2 text-[11px] text-slate-400 select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white min-h-[140px] max-h-[420px] overflow-y-auto prose prose-sm prose-slate focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          contentEditable
          onInput={handleInput}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;

