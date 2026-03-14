import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudentFilters, StudentSort } from '@/types/api'

interface StudentFilterState extends StudentFilters, StudentSort {
  // View mode
  viewMode: 'grid' | 'list'
  
  // Actions
  setSearch: (search: string) => void
  setStatus: (status: string[]) => void
  setProgram: (program: string | undefined) => void
  setUniversity: (university: string | undefined) => void
  setSource: (source: string | undefined) => void
  setTags: (tags: string[]) => void
  setDateRange: (dateFrom?: string, dateTo?: string) => void
  setFreelancerId: (freelancerId: string | undefined) => void
  setSortBy: (sortBy: string) => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
  setViewMode: (viewMode: 'grid' | 'list') => void
  
  // Reset
  resetFilters: () => void
  resetAll: () => void
}

const initialState: StudentFilterState = {
  search: '',
  status: [],
  program: undefined,
  university: undefined,
  source: undefined,
  tags: [],
  dateFrom: undefined,
  dateTo: undefined,
  freelancerId: undefined,
  sortBy: 'created_at',
  sortOrder: 'desc',
  viewMode: 'grid',
  
  // Placeholder actions (will be overridden)
  setSearch: () => {},
  setStatus: () => {},
  setProgram: () => {},
  setUniversity: () => {},
  setSource: () => {},
  setTags: () => {},
  setDateRange: () => {},
  setFreelancerId: () => {},
  setSortBy: () => {},
  setSortOrder: () => {},
  setViewMode: () => {},
  resetFilters: () => {},
  resetAll: () => {},
}

export const useStudentFilterStore = create<StudentFilterState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSearch: (search) => set({ search }),
      
      setStatus: (status) => set({ status }),
      
      setProgram: (program) => set({ program }),
      
      setUniversity: (university) => set({ university }),
      
      setSource: (source) => set({ source }),
      
      setTags: (tags) => set({ tags }),
      
      setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
      
      setFreelancerId: (freelancerId) => set({ freelancerId }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      setSortOrder: (sortOrder) => set({ sortOrder }),
      
      setViewMode: (viewMode) => set({ viewMode }),
      
      resetFilters: () => set({
        search: '',
        status: [],
        program: undefined,
        university: undefined,
        source: undefined,
        tags: [],
        dateFrom: undefined,
        dateTo: undefined,
        freelancerId: undefined,
      }),
      
      resetAll: () => set(initialState),
    }),
    {
      name: 'student-filters-storage',
      partialize: (state) => ({
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
      }),
    }
  )
)
