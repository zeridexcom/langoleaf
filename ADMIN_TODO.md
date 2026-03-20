# Admin Panel - Full Real-Time Implementation

## Tasks

### 1. Database Setup (Supabase SQL)
- [ ] Create admin_notifications table for real-time admin alerts
- [ ] Create support_tickets and support_messages tables for live support
- [ ] Create activity_feed table for real-time activity tracking
- [ ] Add real-time triggers for document submissions, new applications
- [ ] Fix existing RPC functions

### 2. Real-Time Infrastructure
- [ ] Create Supabase Realtime subscription hooks
- [ ] Create useRealtimeActivity hook
- [ ] Create useRealtimeNotifications hook
- [ ] Create useRealtimeSupport hook

### 3. Admin Layout & Sidebar
- [ ] Create new AdminLayout component
- [ ] Create AdminSidebar with notification badges
- [ ] Add real-time notification bell

### 4. Admin Dashboard Components
- [ ] Rewrite Overview tab with live stats
- [ ] Rewrite Applications tab with real-time updates
- [ ] Rewrite Freelancers tab as full CRM
- [ ] Rewrite Students tab with real-time data
- [ ] Create Documents verification queue
- [ ] Create Support chat system
- [ ] Create Activity Feed component

### 5. API Routes
- [ ] Create /api/admin/support/tickets
- [ ] Create /api/admin/support/messages
- [ ] Create /api/admin/documents/pending
- [ ] Update /api/admin/stats for real data
- [ ] Update /api/admin/freelancers for real data

### 6. Testing
- [ ] Test real-time notifications
- [ ] Test support chat
- [ ] Verify all data is real (no mocks)
