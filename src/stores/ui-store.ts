import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Notifications
  notifications: Notification[]
  
  // Global loading states
  isLoading: boolean
  loadingMessage: string | null
  
  // Modal states
  activeModal: string | null
  modalData: Record<string, any> | null
  
  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  setLoading: (isLoading: boolean, message?: string | null) => void
  
  openModal: (modalId: string, data?: Record<string, any>) => void
  closeModal: () => void
  
  // Reset
  reset: () => void
}

const initialState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'system' as const,
  notifications: [],
  isLoading: false,
  loadingMessage: null,
  activeModal: null,
  modalData: null,
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      toggleSidebarCollapsed: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setTheme: (theme) => set({ theme }),
      
      addNotification: (notification) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newNotification = { ...notification, id }
        
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }))
        
        // Auto-remove after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, notification.duration || 5000)
        }
        
        return id
      },
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      setLoading: (isLoading, message = null) => set({ 
        isLoading, 
        loadingMessage: message 
      }),
      
      openModal: (modalId, data) => set({ 
        activeModal: modalId, 
        modalData: data || null 
      }),
      
      closeModal: () => set({ 
        activeModal: null, 
        modalData: null 
      }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'ui-settings-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)
