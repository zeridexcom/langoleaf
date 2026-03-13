"use client";

import { useState, useEffect, useCallback } from "react";

export interface Note {
  id: string;
  content: string;
  isPinned: boolean;
  category: "general" | "follow_up" | "important" | "document" | "communication";
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface UseStudentNotesOptions {
  studentId: string;
}

export function useStudentNotes({ studentId }: UseStudentNotesOptions) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/students/${studentId}/notes`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();
      setNotes(data.notes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const createNote = useCallback(async (content: string, category: Note["category"] = "general") => {
    try {
      const response = await fetch(`/api/students/${studentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, category }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      const data = await response.json();
      setNotes(prev => [data.note, ...prev]);
      return data.note;
    } catch (err) {
      throw err;
    }
  }, [studentId]);

  const updateNote = useCallback(async (noteId: string, updates: Partial<Pick<Note, "content" | "category" | "isPinned">>) => {
    try {
      const response = await fetch(`/api/students/${studentId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      const data = await response.json();
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, ...data.note } : note
      ));
      return data.note;
    } catch (err) {
      throw err;
    }
  }, [studentId]);

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (err) {
      throw err;
    }
  }, [studentId]);

  const togglePin = useCallback(async (noteId: string, isPinned: boolean) => {
    return updateNote(noteId, { isPinned: !isPinned });
  }, [updateNote]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    refresh: fetchNotes,
  };
}
