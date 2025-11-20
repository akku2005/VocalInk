import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useMemo, useState } from "react";
import CustomDropdown from "./CustomDropdown";
import { apiService } from "../../services/api";
import { resolveAssetUrl } from "../../constants/apiConfig";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Quote,
  Link2,
  Link2Off,
  Image as ImageIcon,
  Table as TableIcon,
  Type,
} from "lucide-react";

const RichTextEditor = ({ value, onChange, className = "" }) => {
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [headings, setHeadings] = useState([]);

  const baseExtensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        history: true,
      }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Write your story… Type / for commands",
      }),
    ],
    []
  );

  const extensions = useMemo(() => {
    const seen = new Set();
    return baseExtensions.filter((ext) => {
      const name = ext?.name;
      if (!name) return true;
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [baseExtensions]);

  const editor = useEditor({
    extensions,
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange && onChange(html);
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setStats({ words, chars: text.length });
      const hs = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          hs.push({ level: node.attrs.level, text: node.textContent, pos });
        }
      });
      setHeadings(hs);
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none text-text-primary leading-8 text-[17px] font-serif",
      },
      handlePaste: async (view, event) => {
        const items = event.clipboardData?.items || [];
        for (const item of items) {
          if (item.type?.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              try {
                const resp = await apiService.upload("/images/upload", file);
                const url = resolveAssetUrl(resp.data.url || resp.data.data?.url);
                editor?.chain().focus().setImage({ src: url }).run();
                return true;
              } catch (e) {
                console.error("Paste upload failed", e);
              }
            }
          }
        }
        return false;
      },
      handleDrop: async (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const image = files.find((f) => f.type.startsWith("image/"));
        if (image) {
          try {
            const resp = await apiService.upload("/images/upload", image);
            const url = resolveAssetUrl(resp.data.url || resp.data.data?.url);
            editor?.chain().focus().setImage({ src: url }).run();
            return true;
          } catch (e) {
            console.error("Drop upload failed", e);
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && typeof value === "string" && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const unsetLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const insertImage = async () => {
    const method = window.prompt(
      'Type "url" to insert by URL, or "upload" to upload an image',
      "upload"
    );
    if (!method) return;

    if (method.toLowerCase() === "url") {
      const url = window.prompt("Image URL");
      if (!url) return;
      editor.chain().focus().setImage({ src: url }).run();
      return;
    }

    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const resp = await apiService.upload("/images/upload", file);
        const url = resolveAssetUrl(resp.data.url || resp.data.data?.url);
        editor.chain().focus().setImage({ src: url }).run();
      };
      input.click();
    } catch (e) {
      console.error("Image upload failed", e);
      alert("Image upload failed");
    }
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const btn = (active) =>
    `px-2.5 py-1.5 rounded-md hover:bg-secondary-100 cursor-pointer ${active ? "bg-primary-100 text-primary-700" : ""}`;
  const divider = <span className="mx-1 text-border">|</span>;

  const inTable = editor.isActive("table");

  return (
    <div className={`border border-border rounded-lg ${className}`}>
      <div className="p-2 lg:p-3 border-b border-border flex flex-wrap items-center gap-2 text-sm sticky top-0 bg-background z-10">
        <div className="flex items-center gap-1">
          <button
            title="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            className="p-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            title="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            className="p-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
        {divider}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
            <Type className="w-3.5 h-3.5" /> Text
          </span>
          <CustomDropdown
            value={
              editor.isActive("heading", { level: 1 })
                ? "h1"
                : editor.isActive("heading", { level: 2 })
                  ? "h2"
                  : editor.isActive("heading", { level: 3 })
                    ? "h3"
                    : "p"
            }
            onChange={(v) => {
              const chain = editor.chain().focus();
              if (v === "p") chain.setParagraph().run();
              if (v === "h1") chain.toggleHeading({ level: 1 }).run();
              if (v === "h2") chain.toggleHeading({ level: 2 }).run();
              if (v === "h3") chain.toggleHeading({ level: 3 }).run();
            }}
            options={[
              { id: "p", name: "Paragraph" },
              { id: "h1", name: "Heading 1" },
              { id: "h2", name: "Heading 2" },
              { id: "h3", name: "Heading 3" },
            ]}
          />
        </div>
        {divider}
        <div className="flex items-center gap-1">
          <button
            title="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btn(editor.isActive("bold"))}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            title="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btn(editor.isActive("italic"))}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={btn(editor.isActive("bulletList"))}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            title="Ordered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={btn(editor.isActive("orderedList"))}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            title="Code Block"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={btn(editor.isActive("codeBlock"))}
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            title="Quote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={btn(editor.isActive("blockquote"))}
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>
        {divider}
        <div className="flex items-center gap-1">
          <button
            title="Set Link"
            onClick={setLink}
            className={btn(editor.isActive("link"))}
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            title="Remove Link"
            onClick={unsetLink}
            className="p-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
          >
            <Link2Off className="w-4 h-4" />
          </button>
          <button
            title="Insert Image"
            onClick={insertImage}
            className="p-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            title="Insert Table"
            onClick={insertTable}
            className="p-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>
        {inTable && (
          <>
            {divider}
            <div className="hidden sm:flex items-center gap-1">
              <button
                title="Add Column Before"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="px-2.5 py-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
              >
                +Col◀
              </button>
              <button
                title="Add Column After"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="px-2.5 py-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
              >
                +Col▶
              </button>
              <button
                title="Add Row Before"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="px-2.5 py-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
              >
                +Row▲
              </button>
              <button
                title="Add Row After"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="px-2.5 py-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
              >
                +Row▼
              </button>
              <button
                title="Delete Column"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="px-2.5 py-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
              >
                Del Col
              </button>
              <button
                title="Delete Row"
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="px-2.5 py-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
              >
                Del Row
              </button>
              <button
                title="Delete Table"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="px-2.5 py-1.5 rounded-md hover:bg-secondary-100 cursor-pointer"
              >
                Del Table
              </button>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
        <div className="p-6 min-h-64 glassmorphism-card text-black rounded-lg border border-border">
          <EditorContent
            editor={editor}
            className="text-black leading-8 text-[17px] "
            style={{ whiteSpace: "pre-wrap" }}
          />
        </div>
        <aside className="hidden lg:block p-3 border border-border rounded-lg h-fit sticky top-20 bg-background">
          <div className="text-xs uppercase tracking-wide text-text-secondary mb-2">
            Headings
          </div>
          <ul className="space-y-1 text-sm text-text-primary">
            {headings.length === 0 && (
              <li className="text-text-secondary">No headings yet</li>
            )}
            {headings.map((h, idx) => (
              <li key={`${h.pos}-${idx}`}>
                <button
                  className={`text-left hover:underline cursor-pointer ${h.level === 1 ? "font-semibold" : h.level === 2 ? "" : "text-text-secondary"}`}
                  onClick={() =>
                    editor.chain().focus().setTextSelection(h.pos).run()
                  }
                >
                  {Array(h.level).fill("—").join("")} {h.text || "Untitled"}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="px-4 py-2 border-t border-border text-xs text-text-secondary flex items-center justify-between">
        <span>{stats.words} words</span>
        <span>{stats.chars} chars</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
