"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";

const DRAFT_KEY = "student_form_draft";
const DRAFT_EXPIRY_DAYS = 7;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

interface DraftData {
  formData: Record<string, any>;
  timestamp: number;
  expiresAt: number;
}

interface UseFormDraftOptions {
  formId?: string;
  onRestore?: (data: Record<string, any>) => void;
}

export function useFormDraft(options: UseFormDraftOptions = {}) {
  const { formId = "default", onRestore } = options;
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const draftKey = `${DRAFT_KEY}_${formId}`;

  // Check for existing draft on mount
  useEffect(() => {
    const checkExistingDraft = () => {
      try {
        const draftJson = localStorage.getItem(draftKey);
        if (!draftJson) {
          setHasDraft(false);
          return;
        }

        const draft: DraftData = JSON.parse(draftJson);
        
        // Check if draft has expired
        if (Date.now() > draft.expiresAt) {
          localStorage.removeItem(draftKey);
          setHasDraft(false);
          return;
        }

        setHasDraft(true);
      } catch (error) {
        console.error("Error checking draft:", error);
        setHasDraft(false);
      }
    };

    checkExistingDraft();
  }, [draftKey]);

  // Save draft to localStorage
  const saveDraft = useCallback((formData: Record<string, any>, showToast = false) => {
    try {
      const draft: DraftData = {
        formData,
        timestamp: Date.now(),
        expiresAt: Date.now() + (DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      };

      localStorage.setItem(draftKey, JSON.stringify(draft));
      setLastSaved(new Date());
      setHasDraft(true);

      if (showToast) {
        toast.success("Draft saved", {
          icon: "💾",
          duration: 2000,
        });
      }

      return true;
    } catch (error) {
      console.error("Error saving draft:", error);
      return false;
    }
  }, [draftKey]);

  // Restore draft from localStorage
  const restoreDraft = useCallback(() => {
    try {
      const draftJson = localStorage.getItem(draftKey);
      if (!draftJson) return null;

      const draft: DraftData = JSON.parse(draftJson);

      // Check if draft has expired
      if (Date.now() > draft.expiresAt) {
        localStorage.removeItem(draftKey);
        setHasDraft(false);
        return null;
      }

      setIsRestored(true);
      setHasDraft(false);
      
      if (onRestore) {
        onRestore(draft.formData);
      }

      toast.success("Draft restored", {
        icon: "📋",
        duration: 3000,
      });

      return draft.formData;
    } catch (error) {
      console.error("Error restoring draft:", error);
      return null;
    }
  }, [draftKey, onRestore]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      setLastSaved(null);
      setIsRestored(false);
      
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }

      return true;
    } catch (error) {
      console.error("Error clearing draft:", error);
      return false;
    }
  }, [draftKey]);

  // Start auto-save
  const startAutoSave = useCallback((getFormData: () => Record<string, any>) => {
    // Clear any existing interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    // Save immediately
    const initialData = getFormData();
    if (Object.keys(initialData).some(key => initialData[key])) {
      saveDraft(initialData);
    }

    // Set up interval
    autoSaveIntervalRef.current = setInterval(() => {
      const data = getFormData();
      // Only save if there's actual data
      if (Object.keys(data).some(key => {
        const value = data[key];
        return value !== "" && value !== null && value !== undefined && 
               !(Array.isArray(value) && value.length === 0);
      })) {
        saveDraft(data, true);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [saveDraft]);

  // Stop auto-save
  const stopAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
  }, []);

  // Discard draft
  const discardDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    toast("Draft discarded", {
      icon: "🗑️",
      duration: 2000,
    });
  }, [draftKey]);

  // Format last saved time
  const getLastSavedText = useCallback(() => {
    if (!lastSaved) return null;
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    
    return lastSaved.toLocaleDateString();
  }, [lastSaved]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  return {
    hasDraft,
    lastSaved,
    isRestored,
    saveDraft,
    restoreDraft,
    clearDraft,
    startAutoSave,
    stopAutoSave,
    discardDraft,
    getLastSavedText,
  };
}

// Hook for form field tracking
export function useFormFieldTracking() {
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  const markTouched = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set(Array.from(prev).concat(fieldName)));
  }, []);

  const markDirty = useCallback((fieldName: string) => {
    setDirtyFields(prev => new Set(Array.from(prev).concat(fieldName)));
  }, []);

  const isFieldTouched = useCallback((fieldName: string) => {
    return touchedFields.has(fieldName);
  }, [touchedFields]);

  const isFieldDirty = useCallback((fieldName: string) => {
    return dirtyFields.has(fieldName);
  }, [dirtyFields]);

  const resetTracking = useCallback(() => {
    setTouchedFields(new Set());
    setDirtyFields(new Set());
  }, []);

  return {
    touchedFields,
    dirtyFields,
    markTouched,
    markDirty,
    isFieldTouched,
    isFieldDirty,
    resetTracking,
  };
}
