"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, ImagePlus, Italic, Link as LinkIcon, Highlighter, Underline as UnderlineIcon } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface RichMailEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onKeyDown?: (e: KeyboardEvent) => void;
}

const EMPTY_HTML = "<p></p>";

export function isEditorEmpty(html: string): boolean {
  return !html || html === EMPTY_HTML || html === "<p><br></p>" || html.trim() === "";
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function RichMailEditor({
  content,
  onChange,
  placeholder = "Write your message…",
  className,
  minHeight = "160px",
  onKeyDown,
}: RichMailEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, blockquote: false, code: false, codeBlock: false }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: true, allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none outline-none px-4 py-3 text-sm leading-relaxed",
          "[&_p]:my-0.5 [&_a]:text-blue-600 [&_a]:underline [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-500/30 [&_mark]:rounded-[2px] [&_mark]:px-0.5",
          "[&_img]:max-w-full [&_img]:rounded [&_img]:my-1 [&_img]:inline",
        ),
      },
      handleKeyDown: (_view, event) => {
        onKeyDown?.(event);
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  if (!editor) return null;

  const handleInsertLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", prev ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (src) editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  type ToolbarBtn = {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    action: () => void;
  };

  const toolbarBtns: ToolbarBtn[] = [
    {
      label: "Bold",
      icon: <Bold className="size-3.5" />,
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: <Italic className="size-3.5" />,
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: <UnderlineIcon className="size-3.5" />,
      active: editor.isActive("underline"),
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Highlight",
      icon: <Highlighter className="size-3.5" />,
      active: editor.isActive("highlight"),
      action: () => editor.chain().focus().toggleHighlight().run(),
    },
    {
      label: "Link",
      icon: <LinkIcon className="size-3.5" />,
      active: editor.isActive("link"),
      action: handleInsertLink,
    },
    {
      label: "Image",
      icon: <ImagePlus className="size-3.5" />,
      active: false,
      action: () => imageInputRef.current?.click(),
    },
  ];

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b px-3 py-1.5">
        {toolbarBtns.map((btn, i) => (
          <button
            key={btn.label}
            type="button"
            aria-label={btn.label}
            onClick={btn.action}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              btn.active
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              i === 4 && "ml-1", // slight gap before Link
            )}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="flex-1 overflow-y-auto"
      />

      {/* Hidden image file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
    </div>
  );
}
