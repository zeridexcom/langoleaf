# Task Assignment System - Implementation Plan

## Overview
Building a comprehensive task assignment system where admins can assign tasks to freelancers with full tracking, chat, and payout management.

## Requirements Summary

| Feature | Details |
|---------|---------|
| **Bulk Assignment** | Admin can assign to multiple freelancers at once |
| **One Task = One Freelancer** | Yes (unless admin explicitly assigns to multiple) |
| **Task Fields** | Title, Description, Payout, Deadline, Priority, Category, Attachments |
| **Admin Question** | Ask question after publishing task |
| **Status Flow** | Pending → In Progress → Completed |
| **Rejection** | Admin can reject with reason (prefilled options) |
| **Accept/Decline** | User must accept, NO decline option |
| **Freelancer Actions** | Chat with admin, Submit proof, Request deadline extension |
| **Notifications** | Real-time, in-app only (bell icon) |
| **Freelancer Dashboard** | Pending tasks as banner/alert |
| **Admin Dashboard** | View all tasks across all freelancers |
| **Payout** | Manual approval by admin before adding to balance |

---

## Implementation Phases

### Phase 1: Database Schema & Types
- [x] Create SQL migration for new columns
- [x] Update database.ts types
- [x] Update task-service.ts

### Phase 2: Admin Components
- [x] Enhanced Task Create Modal
- [x] Task Assignment Modal
- [x] Admin Question Modal
- [x] Task Overview Dashboard
- [x] Prefilled Rejection Reasons
- [x] Task Chat Component

### Phase 3: Freelancer Components
- [x] Task Accept Modal
- [x] Freelancer Task Chat
- [x] Submit Proof Modal
- [x] Deadline Extension Modal
- [x] Enhanced Dashboard Banner
- [x] Updated Tasks Page

### Phase 4: API Routes
- [x] Task Assignment API
- [x] Task Accept API
- [x] Task Chat API
- [x] Deadline Extension API
- [x] Task Overview API

### Phase 5: Testing
- [x] Test task assignment flow
- [x] Test push review submission
- [x] Test dashboard statistics
- [x] Verify deadline extension logic
- [x] Verify real-time chat functionalityAPI

---

## Database Changes

### New Columns for `tasks` table:
```sql
ALTER TABLE tasks ADD COLUMN deadline TIMESTAMP;
ALTER TABLE tasks ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE tasks ADD COLUMN category VARCHAR(100);
ALTER TABLE tasks ADD COLUMN attachments JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN admin_question TEXT;
```

### New Columns for `task_submissions` table:
```sql
ALTER TABLE task_submissions ADD COLUMN accepted_at TIMESTAMP;
ALTER TABLE task_submissions ADD COLUMN deadline_extension_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE task_submissions ADD COLUMN deadline_extension_reason TEXT;
ALTER TABLE task_submissions ADD COLUMN deadline_extension_approved BOOLEAN;
ALTER TABLE task_submissions ADD COLUMN proof_files JSONB DEFAULT '[]';
ALTER TABLE task_submissions ADD COLUMN new_deadline TIMESTAMP;
```

### New Table: `task_assignments`
```sql
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'assigned',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, freelancer_id)
);
```

### New Table: `task_chats`
```sql
CREATE TABLE task_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES task_submissions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── tasks/
│   │   │       ├── assign/
│   │   │       │   └── route.ts
│   │   │       └── overview/
│   │   │           └── route.ts
│   │   └── tasks/
│   │       ├── accept/
│   │       │   └── route.ts
│   │       ├── chat/
│   │       │   └── route.ts
│   │       └── extension/
│   │           └── route.ts
│   └── (dashboard)/
│       └── admin/
│           └── task-assignments/
│               └── page.tsx
├── components/
│   ├── admin/
│   │   ├── task-assign-modal.tsx
│   │   ├── admin-question-modal.tsx
│   │   ├── task-overview-page.tsx
│   │   └── task-chat.tsx
│   └── freelancer/
│       ├── task-accept-modal.tsx
│       ├── submit-proof-modal.tsx
│       ├── deadline-extension-modal.tsx
│       └── freelancer-task-chat.tsx
└── lib/
    └── services/
        └── task-service.ts (updated)
```
