"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  List,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PortableTextEditorProps {
  value: string | null;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const EMPTY_HTML = "<p></p>";

function isEmpty(html: string): boolean {
  return !html || html === EMPTY_HTML || html === "<p><br></p>" || html.trim() === "";
}

type ToolbarButton = {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  action: () => void;
};

export function PortableTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  className,
}: PortableTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none outline-none px-3 py-2.5 text-sm leading-relaxed min-h-[116px]",
          "[&_p]:my-0.5",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
          "[&_mark]:bg-yellow-200 [&_mark]:rounded-[2px] [&_mark]:px-0.5",
        ),
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(isEmpty(html) ? "" : html);
    },
  });

  if (!editor) return null;

  const toolbarButtons: ToolbarButton[] = [
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
      label: "Bullet List",
      icon: <List className="size-3.5" />,
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Ordered List",
      icon: <ListOrdered className="size-3.5" />,
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-input px-2 py-1.5">
        {toolbarButtons.map((btn, i) => (
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
              i === 4 && "ml-1",
            )}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
