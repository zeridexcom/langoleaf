"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  AtSign,
  Send,
  X
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NoteEditorProps {
  onSubmit: (content: string, category: string) => void;
  onCancel?: () => void;
  initialContent?: string;
  initialCategory?: string;
  isEditing?: boolean;
}

const categories = [
  { value: "general", label: "General", color: "bg-gray-100 text-gray-700" },
  { value: "follow_up", label: "Follow-up", color: "bg-blue-100 text-blue-700" },
  { value: "important", label: "Important", color: "bg-red-100 text-red-700" },
  { value: "document", label: "Document", color: "bg-emerald-100 text-emerald-700" },
  { value: "communication", label: "Communication", color: "bg-purple-100 text-purple-700" },
];

export function NoteEditor({ 
  onSubmit, 
  onCancel, 
  initialContent = "", 
  initialCategory = "general",
  isEditing = false 
}: NoteEditorProps) {
  const [category, setCategory] = useState(initialCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: "mention bg-primary/10 text-primary px-1 rounded",
        },
        suggestion: {
          items: ({ query }: { query: string }) => {
            // In a real app, this would fetch from an API
            return [
              { id: "1", label: "Admin" },
              { id: "2", label: "Support" },
              { id: "3", label: "Manager" },
            ]
              .filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5);
          },
          render: () => {
            return {
              onStart: (props: any) => {
                // Render suggestion dropdown
              },
              onUpdate: (props: any) => {
                // Update suggestions
              },
              onKeyDown: (props: any) => {
                return false;
              },
              onExit: () => {
                // Cleanup
              },
            };
          },
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3",
      },
    },
  });

  const handleSubmit = useCallback(async () => {
    if (!editor || isSubmitting) return;
    
    const content = editor.getHTML();
    if (!content.trim() || content === "<p></p>") return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, category);
      if (!isEditing) {
        editor.commands.clearContent();
        setCategory("general");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [editor, category, onSubmit, isSubmitting, isEditing]);

  if (!editor) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded hover:bg-gray-200 transition-colors",
            editor.isActive("bold") && "bg-gray-200 text-primary"
          )}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded hover:bg-gray-200 transition-colors",
            editor.isActive("italic") && "bg-gray-200 text-primary"
          )}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded hover:bg-gray-200 transition-colors",
            editor.isActive("bulletList") && "bg-gray-200 text-primary"
          )}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded hover:bg-gray-200 transition-colors",
            editor.isActive("orderedList") && "bg-gray-200 text-primary"
          )}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "p-1.5 rounded hover:bg-gray-200 transition-colors",
            editor.isActive("blockquote") && "bg-gray-200 text-primary"
          )}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().insertContent("@").run()}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Mention"
        >
          <AtSign className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Category:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !editor.getText().trim()}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors",
              isSubmitting || !editor.getText().trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90"
            )}
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isEditing ? "Update" : "Add Note"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
