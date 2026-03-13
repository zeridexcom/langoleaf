"use client";

import { useState, useCallback, useMemo } from "react";

export interface FieldChange<T = any> {
  field: string;
  oldValue: T;
  newValue: T;
  isModified: boolean;
}

export interface ChangeTrackingState<T extends Record<string, any>> {
  originalData: T;
  currentData: T;
  changes: FieldChange[];
  hasChanges: boolean;
  modifiedFields: Set<string>;
}

export function useChangeTracking<T extends Record<string, any>>(
  initialData: T
) {
  const [originalData] = useState<T>(initialData);
  const [currentData, setCurrentData] = useState<T>(initialData);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Calculate changes
  const changes = useMemo<FieldChange[]>(() => {
    const result: FieldChange[] = [];
    
    Object.keys(originalData).forEach((key) => {
      const oldValue = originalData[key];
      const newValue = currentData[key];
      const isModified = JSON.stringify(oldValue) !== JSON.stringify(newValue);
      
      if (isModified || touchedFields.has(key)) {
        result.push({
          field: key,
          oldValue,
          newValue,
          isModified,
        });
      }
    });
    
    return result;
  }, [originalData, currentData, touchedFields]);

  // Check if any changes exist
  const hasChanges = useMemo(() => {
    return changes.some((change) => change.isModified);
  }, [changes]);

  // Get set of modified field names
  const modifiedFields = useMemo(() => {
    return new Set(changes.filter((c) => c.isModified).map((c) => c.field));
  }, [changes]);

  // Update a field value
  const updateField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setCurrentData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setTouchedFields((prev) => new Set(Array.from(prev).concat(String(field))));
  }, []);

  // Mark field as touched (for validation)
  const markTouched = useCallback((field: string) => {
    setTouchedFields((prev) => new Set(Array.from(prev).concat(field)));
  }, []);

  // Check if field is modified
  const isFieldModified = useCallback(
    (field: string) => modifiedFields.has(field),
    [modifiedFields]
  );

  // Check if field is touched
  const isFieldTouched = useCallback(
    (field: string) => touchedFields.has(field),
    [touchedFields]
  );

  // Get old value for a field
  const getOldValue = useCallback(
    (field: string) => originalData[field as keyof T],
    [originalData]
  );

  // Get change for a specific field
  const getFieldChange = useCallback(
    (field: string): FieldChange | undefined => {
      return changes.find((c) => c.field === field);
    },
    [changes]
  );

  // Undo a specific field change
  const undoField = useCallback((field: string) => {
    setCurrentData((prev) => ({
      ...prev,
      [field]: originalData[field as keyof T],
    }));
  }, [originalData]);

  // Undo all changes
  const undoAll = useCallback(() => {
    setCurrentData(originalData);
    setTouchedFields(new Set());
  }, [originalData]);

  // Reset with new data (after successful save)
  const reset = useCallback((newData: T) => {
    setCurrentData(newData);
    setTouchedFields(new Set());
  }, []);

  // Get changes summary for display
  const getChangesSummary = useCallback(() => {
    return changes
      .filter((c) => c.isModified)
      .map((c) => ({
        field: c.field,
        label: formatFieldLabel(c.field),
        oldValue: formatValue(c.oldValue),
        newValue: formatValue(c.newValue),
      }));
  }, [changes]);

  return {
    // State
    originalData,
    currentData,
    changes,
    hasChanges,
    modifiedFields,
    touchedFields,
    
    // Actions
    updateField,
    markTouched,
    undoField,
    undoAll,
    reset,
    setCurrentData,
    
    // Helpers
    isFieldModified,
    isFieldTouched,
    getOldValue,
    getFieldChange,
    getChangesSummary,
  };
}

// Helper function to format field labels
function formatFieldLabel(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Helper function to format values for display
function formatValue(value: any): string {
  if (value === null || value === undefined) return "Empty";
  if (value === "") return "Empty";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ") || "Empty";
  return String(value);
}
