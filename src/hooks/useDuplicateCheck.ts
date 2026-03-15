"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Fuse from "fuse.js";

export interface DuplicateStudent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  program: string | null;
  university: string | null;
  status: string;
  created_at: string;
  similarity?: number;
}

export interface DuplicateCheckResult {
  emailDuplicate: DuplicateStudent | null;
  phoneDuplicate: DuplicateStudent | null;
  nameMatches: DuplicateStudent[];
  hasDuplicates: boolean;
}

export function useDuplicateCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DuplicateCheckResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkDuplicates = useCallback(async (
    email: string,
    phone: string,
    firstName: string,
    lastName: string,
    excludeId?: string
  ): Promise<DuplicateCheckResult> => {
    // Cancel any ongoing check
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsChecking(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch all existing students for this freelancer
      const { data: existingStudents, error } = await supabase
        .from("students")
        .select("id, full_name, email, phone, program, university, status, created_at")
        .eq("freelancer_id", user.id)
        .is("deleted_at", null);

      if (error) throw error;

      const students = existingStudents || [];
      
      // Check for exact email duplicate
      const emailDuplicate = students.find(
        s => s.email.toLowerCase() === email.toLowerCase() && s.id !== excludeId
      ) || null;

      // Normalize phone for comparison
      const normalizedPhone = phone.replace(/\D/g, "");
      const phoneDuplicate = students.find(s => {
        if (!s.phone || s.id === excludeId) return false;
        const existingNormalized = s.phone.replace(/\D/g, "");
        return existingNormalized === normalizedPhone || 
               existingNormalized.endsWith(normalizedPhone) ||
               normalizedPhone.endsWith(existingNormalized);
      }) || null;

      // Fuzzy name matching using Fuse.js
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
      const fuseOptions = {
        keys: ["full_name"],
        threshold: 0.4, // 0 = exact match, 1 = match anything
        includeScore: true,
      };

      const fuse = new Fuse(
        students.filter(s => s.id !== excludeId).map(s => ({
          ...s,
          similarity: 0,
        })),
        fuseOptions
      );

      const fuseResults = fuse.search(fullName);
      const nameMatches: DuplicateStudent[] = fuseResults
        .filter(r => r.score !== undefined && r.score < 0.4)
        .map(r => ({
          ...r.item,
          similarity: Math.round((1 - (r.score || 0)) * 100),
        }))
        .slice(0, 5); // Top 5 matches

      const checkResult: DuplicateCheckResult = {
        emailDuplicate: emailDuplicate ? {
          ...emailDuplicate,
          similarity: 100,
        } : null,
        phoneDuplicate: phoneDuplicate ? {
          ...phoneDuplicate,
          similarity: 100,
        } : null,
        nameMatches,
        hasDuplicates: !!(emailDuplicate || phoneDuplicate || nameMatches.length > 0),
      };

      setResult(checkResult);
      
      if (checkResult.hasDuplicates) {
        setShowModal(true);
      }

      return checkResult;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return {
        emailDuplicate: null,
        phoneDuplicate: null,
        nameMatches: [],
        hasDuplicates: false,
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const clearDuplicates = useCallback(() => {
    setResult(null);
    setShowModal(false);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return {
    isChecking,
    result,
    showModal,
    checkDuplicates,
    clearDuplicates,
    closeModal,
    setShowModal,
  };
}

// Hook for real-time field checking
export function useRealtimeDuplicateCheck() {
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "duplicate" | "available">("idle");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "checking" | "duplicate" | "available">("idle");
  const [duplicateStudent, setDuplicateStudent] = useState<DuplicateStudent | null>(null);
  
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const phoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkEmail = useCallback(async (email: string, excludeId?: string) => {
    if (!email || !email.includes("@")) {
      setEmailStatus("idle");
      return;
    }

    setEmailStatus("checking");
    
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
    }

    emailTimeoutRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        let query = supabase
          .from("students")
          .select("id, full_name, email, phone, program, university, status, created_at")
          .eq("email", email.toLowerCase())
          .eq("freelancer_id", user.id)
          .is("deleted_at", null);

        if (excludeId) {
          query = query.neq("id", excludeId);
        }

        const { data, error } = await query.single();

        if (error || !data) {
          setEmailStatus("available");
          setDuplicateStudent(null);
        } else {
          setEmailStatus("duplicate");
          setDuplicateStudent(data);
        }
      } catch (error) {
        setEmailStatus("idle");
      }
    }, 500); // 500ms debounce
  }, []);

  const checkPhone = useCallback(async (phone: string, excludeId?: string) => {
    if (!phone || phone.length < 10) {
      setPhoneStatus("idle");
      return;
    }

    setPhoneStatus("checking");
    
    if (phoneTimeoutRef.current) {
      clearTimeout(phoneTimeoutRef.current);
    }

    phoneTimeoutRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const normalizedPhone = phone.replace(/\D/g, "");
        
        // Fetch all students and check phone match
        const { data, error } = await supabase
          .from("students")
          .select("id, full_name, email, phone, program, university, status, created_at")
          .eq("freelancer_id", user.id)
          .is("deleted_at", null);

        if (error) {
          setPhoneStatus("idle");
          return;
        }

        const duplicate = data?.find(s => {
          if (!s.phone || s.id === excludeId) return false;
          const existingNormalized = s.phone.replace(/\D/g, "");
          return existingNormalized === normalizedPhone;
        });

        if (duplicate) {
          setPhoneStatus("duplicate");
          setDuplicateStudent(duplicate);
        } else {
          setPhoneStatus("available");
        }
      } catch (error) {
        setPhoneStatus("idle");
      }
    }, 500);
  }, []);

  const resetStatus = useCallback(() => {
    setEmailStatus("idle");
    setPhoneStatus("idle");
    setDuplicateStudent(null);
  }, []);

  return {
    emailStatus,
    phoneStatus,
    duplicateStudent,
    checkEmail,
    checkPhone,
    resetStatus,
  };
}
