"use client";

import { useState } from "react";
import { 
  Pin, 
  Edit2, 
  Trash2, 
  MoreVertical,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useStudentNotes, Note } from "@/hooks/useStudentNotes";
import { NoteEditor } from "./note-editor";
import { cn } from "@/lib/utils/cn";

interface NotesListProps {
  studentId: string;
}

const categoryColors: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  follow_up: "bg-blue-100 text-blue-700",
  important: "bg-red-100 text-red-700",
  document: "bg-emerald-100 text-emerald-700",
  communication: "bg-purple-100 text-purple-700",
};

const categoryLabels: Record<string, string> = {
  general: "General",
  follow_up: "Follow-up",
  important: "Important",
  document: "Document",
  communication: "Communication",
};

export function NotesList({ studentId }: NotesListProps) {
  const { notes, loading, createNote, updateNote, deleteNote, togglePin } = useStudentNotes({ studentId });
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleCreateNote = async (content: string, category: string) => {
    await createNote(content, category as Note["category"]);
    setShowEditor(false);
  };

  const handleUpdateNote = async (noteId: string, content: string, category: string) => {
    await updateNote(noteId, { content, category: category as Note["category"] });
    setEditingNote(null);
  };

  const handleDelete = async (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(noteId);
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    // Pinned notes first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then by date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {notes.length}
          </span>
        </div>
        <button
          onClick={() => setShowEditor(!showEditor)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            showEditor
              ? "bg-gray-100 text-gray-700"
              : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {showEditor ? "Cancel" : "+ Add Note"}
        </button>
      </div>

      {/* New Note Editor */}
      {showEditor && (
        <div className="mb-6">
          <NoteEditor
            onSubmit={handleCreateNote}
            onCancel={() => setShowEditor(false)}
          />
        </div>
      )}

      {/* Notes List */}
      {sortedNotes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>No notes yet</p>
          <p className="text-sm mt-1">Add a note to keep track of important information</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isEditing={editingNote === note.id}
              onEdit={() => setEditingNote(note.id)}
              onCancelEdit={() => setEditingNote(null)}
              onUpdate={(content, category) => handleUpdateNote(note.id, content, category)}
              onDelete={() => handleDelete(note.id)}
              onTogglePin={() => togglePin(note.id, note.isPinned)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NoteItemProps {
  note: Note;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (content: string, category: string) => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

function NoteItem({ 
  note, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onUpdate, 
  onDelete, 
  onTogglePin 
}: NoteItemProps) {
  if (isEditing) {
    return (
      <NoteEditor
        initialContent={note.content}
        initialCategory={note.category}
        onSubmit={onUpdate}
        onCancel={onCancelEdit}
        isEditing={true}
      />
    );
  }

  return (
    <div className={cn(
      "group relative p-4 rounded-xl border transition-all",
      note.isPinned
        ? "bg-amber-50/50 border-amber-200"
        : "bg-gray-50 border-gray-200 hover:border-gray-300"
    )}>
      {/* Pin indicator */}
      {note.isPinned && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-amber-100 text-amber-600 p-1 rounded-full">
            <Pin className="w-3 h-3 fill-current" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full",
            categoryColors[note.category]
          )}>
            {categoryLabels[note.category]}
          </span>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
          </span>
          {note.updatedAt !== note.createdAt && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onTogglePin}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              note.isPinned
                ? "text-amber-600 hover:bg-amber-100"
                : "text-gray-400 hover:bg-gray-200"
            )}
            title={note.isPinned ? "Unpin" : "Pin"}
          >
            <Pin className={cn("w-4 h-4", note.isPinned && "fill-current")} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: note.content }}
      />

      {/* Author */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50">
        {note.author.avatar ? (
          <img
            src={note.author.avatar}
            alt={note.author.name}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">
            {note.author.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-xs text-gray-500">{note.author.name}</span>
      </div>
    </div>
  );
}
