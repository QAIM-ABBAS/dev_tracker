import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  autoSaveMs?: number;
  onSave?: (value: string) => void;
  minHeight?: number;
}

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
  const theme = useThemeStore((s) => s.theme);
  const codeStyle = theme === "dark" ? vscDarkPlus : oneLight;

  useEffect(() => {
    if (value !== draft) setDraft(value);
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
                    style={codeStyle as any}
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
          <span className="text-pf-900">No content yet.</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-pf-border bg-pf-900/60">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-pf-border px-2 py-1">
        <div className="flex gap-1">
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] uppercase tracking-wide transition",
              mode === "edit"
                ? "bg-pf-900 text-pf-100"
                : "text-pf-700 hover:text-pf-400"
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
                ? "bg-pf-900 text-pf-100"
                : "text-pf-700 hover:text-pf-400"
            )}
          >
            <Eye size={10} className="mr-1 inline" />
            Preview
          </button>
        </div>
        <span className="text-[10px] text-pf-700">
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
          className="w-full resize-y bg-transparent p-2 text-sm text-pf-100 outline-none placeholder-pf-900"
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
                      style={codeStyle as any}
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
            <span className="text-pf-900">Nothing to preview.</span>
          )}
        </div>
      )}
    </div>
  );
}