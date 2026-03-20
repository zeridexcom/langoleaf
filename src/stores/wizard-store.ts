import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WizardPersonalInfo, WizardAcademicInfo, WizardDocumentInfo } from '@/types/api'

interface WizardState {
  // Current step (1-4: Personal, Academic, Documents, Review)
  step: number
  
  // Form data
  personalInfo: WizardPersonalInfo
  academicInfo: WizardAcademicInfo
  documents: WizardDocumentInfo
  
  // UI state
  isSubmitting: boolean
  error: string | null
  
  // Actions
  setStep: (step: number) => void
  setPersonalInfo: (info: Partial<WizardPersonalInfo>) => void
  setAcademicInfo: (info: Partial<WizardAcademicInfo>) => void
  setDocuments: (documents: WizardDocumentInfo['documents']) => void
  addDocument: (document: WizardDocumentInfo['documents'][0]) => void
  removeDocument: (index: number) => void
  setSubmitting: (isSubmitting: boolean) => void
  setError: (error: string | null) => void
  
  // Navigation
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  
  // Reset
  reset: () => void
  clearDraft: () => void
}

const initialState = {
  step: 1,
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  },
  academicInfo: {
    previousEducation: '',
    workExperience: '',
    source: '',
    tags: [],
    createApplication: false,
    universityId: '',
    programId: '',
    intakeDate: '',
  },
  documents: {
    documents: [],
  },
  isSubmitting: false,
  error: null,
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setStep: (step) => set({ step }),
      
      setPersonalInfo: (info) => set((state) => ({
        personalInfo: { ...state.personalInfo, ...info },
      })),
      
      setAcademicInfo: (info) => set((state) => ({
        academicInfo: { ...state.academicInfo, ...info },
      })),
      
      setDocuments: (documents) => set({
        documents: { documents },
      }),
      
      addDocument: (document) => set((state) => ({
        documents: {
          documents: [...state.documents.documents, document],
        },
      })),
      
      removeDocument: (index) => set((state) => ({
        documents: {
          documents: state.documents.documents.filter((_, i) => i !== index),
        },
      })),
      
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      
      setError: (error) => set({ error }),
      
      nextStep: () => {
        const { step } = get()
        if (step < 4) {
          set({ step: step + 1, error: null })
        }
      },
      
      prevStep: () => {
        const { step } = get()
        if (step > 1) {
          set({ step: step - 1, error: null })
        }
      },
      
      goToStep: (step) => {
        if (step >= 1 && step <= 4) {
          set({ step, error: null })
        }
      },
      
      reset: () => set(initialState),
      
      clearDraft: () => {
        set(initialState)
        localStorage.removeItem('student-wizard-storage')
      },
    }),
    {
      name: 'student-wizard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        step: state.step,
        personalInfo: state.personalInfo,
        academicInfo: state.academicInfo,
        documents: state.documents,
      }),
    }
  )
)
