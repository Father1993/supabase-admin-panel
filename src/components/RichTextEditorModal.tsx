"use client";

import { useEffect, useRef, useState } from "react";

export function RichTextEditorModal({
    open,
    initialHtml,
    onCancel,
    onSave,
  }: {
    open: boolean;
    initialHtml: string;
    onCancel: () => void;
    onSave: (html: string) => void;
  }) {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [html, setHtml] = useState<string>("");
  
    useEffect(() => {
      if (open && editorRef.current) {
        const initial = initialHtml || "";
        editorRef.current.innerHTML = initial;
        setHtml(initial);
      }
    }, [open, initialHtml]);
  
    if (!open) return null;
  
    function exec(cmd: string, val?: string) {
      editorRef.current?.focus();
      document.execCommand(cmd, false, val);
    }
  
    function handleSave() {
      onSave(html);
    }
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-4xl bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex flex-wrap gap-2">
              <button className="px-2 py-1 text-sm bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50" onClick={() => exec("bold")}>B</button>
              <button className="px-2 py-1 text-sm bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50" onClick={() => exec("italic")}><em>I</em></button>
              <button className="px-2 py-1 text-sm bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50" onClick={() => exec("underline")}><u>U</u></button>
              <button className="px-2 py-1 text-sm bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50" onClick={() => exec("insertUnorderedList")}>• Список</button>
              <button className="px-2 py-1 text-sm bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50" onClick={() => exec("insertOrderedList")}>1. Список</button>
              <button className="px-2 py-1 text-sm bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50" onClick={() => exec("formatBlock", "h2")}>H2</button>
              <button className="px-2 py-1 text-sm bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50" onClick={() => exec("formatBlock", "p")}>P</button>
              <button
                className="px-2 py-1 text-sm bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  const url = prompt("URL ссылки:");
                  if (url) exec("createLink", url);
                }}
              >
                Ссылка
              </button>
              <button className="px-2 py-1 text-sm bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50" onClick={() => exec("removeFormat")}>Очистить</button>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 text-sm bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50" onClick={onCancel}>Отмена</button>
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleSave}>Сохранить</button>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div
              ref={editorRef}
              className="min-h-[320px] max-h-[50vh] overflow-auto border border-slate-300 rounded-lg p-4 focus:outline-none bg-white text-slate-900 rich-html rich-html-detailed"
              contentEditable
              suppressContentEditableWarning
              onInput={() => setHtml(editorRef.current?.innerHTML ?? "")}
            />
            <p className="text-xs text-slate-500">Совет: выделите текст и используйте кнопки сверху для форматирования. HTML будет очищен автоматически при сохранении.</p>
          </div>
        </div>
      </div>
    );
  }