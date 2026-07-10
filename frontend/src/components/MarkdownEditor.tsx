import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  /** Auto-save debounce in ms. Calls onSave after pause. */
  autoSaveMs?: number;
  onSave?: (value: string) => void;
  minHeight?: number;
}

/**
 * Inline Markdown editor with auto-save.
 * - Click pencil to edit, eye to preview.
 * - Auto-saves on blur and after `autoSaveMs` of inactivity.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write markdown…",
  editable = true,
  autoSaveMs = 600,
  onSave,
  minHeight = 120,
}: Props) {
  const [mode, setMode] = useState<"edit" | "preview">("preview");
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync when external value changes (e.g. after a refetch)
  useEffect(() => {
    if (value !== draft) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const scheduleSave = (next: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave?.(next);
    }, autoSaveMs);
  };

  const handleChange = (next: string) => {
    setDraft(next);
    onChange?.(next);
    if (onSave) scheduleSave(next);
  };

  const handleBlur = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (onSave && draft !== value) onSave(draft);
  };

  if (!editable) {
    return (
      <div className="pf-markdown" style={{ minHeight }}>
        {value ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match && !String(children).includes("\n");
                if (isInline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <SyntaxHighlighter
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    style={vscDarkPlus as any}
                    language={match?.[1] ?? "text"}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                );
              },
            }}
          >
            {value}
          </ReactMarkdown>
        ) : (
          <span className="text-ink-600">No content yet.</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink-800 bg-ink-900/60">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-ink-800 px-2 py-1">
        <div className="flex gap-1">
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] uppercase tracking-wide transition",
              mode === "edit"
                ? "bg-ink-700 text-ink-100"
                : "text-ink-500 hover:text-ink-300"
            )}
          >
            <Pencil size={10} className="mr-1 inline" />
            Edit
          </button>
          <button
            onClick={() => setMode("preview")}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] uppercase tracking-wide transition",
              mode === "preview"
                ? "bg-ink-700 text-ink-100"
                : "text-ink-500 hover:text-ink-300"
            )}
          >
            <Eye size={10} className="mr-1 inline" />
            Preview
          </button>
        </div>
        <span className="text-[10px] text-ink-600">
          {mode === "edit" ? "Markdown supported · auto-saves" : ""}
        </span>
      </div>

      {/* Body */}
      {mode === "edit" ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full resize-y bg-transparent p-2 text-sm text-ink-100 outline-none placeholder-ink-600"
          style={{ minHeight }}
        />
      ) : (
        <div className="pf-markdown p-2" style={{ minHeight }}>
          {draft ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !String(children).includes("\n");
                  if (isInline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <SyntaxHighlighter
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      style={vscDarkPlus as any}
                      language={match?.[1] ?? "text"}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
              }}
            >
              {draft}
            </ReactMarkdown>
          ) : (
            <span className="text-ink-600">Nothing to preview.</span>
          )}
        </div>
      )}
    </div>
  );
}
