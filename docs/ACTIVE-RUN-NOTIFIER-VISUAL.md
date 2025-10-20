# Active Run Notifier - Visual Guide

## Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Root Layout                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │          ActiveRunNotifierWrapper                 │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │   Check Auth: GET /api/auth/session         │  │  │
│  │  │   ✓ Authenticated? → Render ActiveRunNotifier│  │  │
│  │  │   ✗ Not authenticated? → Render null         │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │        ActiveRunNotifier                    │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │  Poll: GET /api/qualify/active       │  │  │  │
│  │  │  │  Every 3 seconds                     │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  │                                             │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │  Active Runs (PROCESSING/PENDING)    │  │  │  │
│  │  │  │  - Filter dismissed                   │  │  │  │
│  │  │  │  - Compare with previous              │  │  │  │
│  │  │  │  - Detect completion                  │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  │                                             │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │  Render Floating Cards               │  │  │  │
│  │  │  │  - Progress bar                       │  │  │  │
│  │  │  │  - Status text                        │  │  │  │
│  │  │  │  - View Progress button               │  │  │  │
│  │  │  │  - Dismiss button                     │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                    Page Content                         │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       │ 1. Render Layout
       ▼
┌─────────────────────────┐
│ ActiveRunNotifierWrapper│
└──────┬──────────────────┘
       │
       │ 2. Check Auth
       ▼
┌─────────────────────────┐
│ GET /api/auth/session   │
└──────┬──────────────────┘
       │
       │ 3. If authenticated
       ▼
┌─────────────────────────┐
│  ActiveRunNotifier      │
└──────┬──────────────────┘
       │
       │ 4. Start polling (every 3s)
       ▼
┌─────────────────────────┐
│ GET /api/qualify/active │
└──────┬──────────────────┘
       │
       │ 5. Fetch active runs
       ▼
┌─────────────────────────┐
│   Prisma Database       │
│   - QualificationRun    │
│   - WHERE status IN     │
│     [PENDING,PROCESSING]│
└──────┬──────────────────┘
       │
       │ 6. Return filtered runs
       ▼
┌─────────────────────────┐
│  Process Runs           │
│  - Filter dismissed     │
│  - Compare progress     │
│  - Detect completion    │
└──────┬──────────────────┘
       │
       │ 7a. If completed
       ▼
┌─────────────────────────┐
│  Show Toast             │
│  "Qualification Complete"│
└─────────────────────────┘
       │
       │ 7b. If still processing
       ▼
┌─────────────────────────┐
│  Show Floating Card     │
│  - Progress bar         │
│  - Status text          │
│  - Action buttons       │
└─────────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────┐
│         ActiveRunNotifier Component State       │
├─────────────────────────────────────────────────┤
│                                                 │
│  activeRuns: ActiveRun[]                        │
│  ├─ Current processing runs                     │
│  └─ Updated every 3 seconds                     │
│                                                 │
│  dismissed: Set<string>                         │
│  ├─ User-dismissed run IDs                      │
│  └─ Persists during session                     │
│                                                 │
│  isVisible: boolean                             │
│  ├─ True if activeRuns.length > 0               │
│  └─ Controls component render                   │
│                                                 │
│  previousRunsRef: Map<string, ActiveRun>        │
│  ├─ Tracks previous state                       │
│  └─ Used for completion detection               │
│                                                 │
└─────────────────────────────────────────────────┘
```

## UI Positioning

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Page Content                                           │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                             ┌─────────┐ │
│                                             │ Notif 1 │ │
│                                             │ ┌─────┐ │ │
│                                             │ │█████│ │ │
│                                             │ │50%  │ │ │
│                                             │ └─────┘ │ │
│                                             └─────────┘ │
│                                             ┌─────────┐ │
│                                             │ Notif 2 │ │
│                                             │ ┌─────┐ │ │
│                                             │ │███░░│ │ │
│                                             │ │30%  │ │ │
│                                             │ └─────┘ │ │
│                                             └─────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
Fixed bottom-right, z-index: 50, max-width: 384px
```

## User Interaction Flow

```
┌──────────────────┐
│  User starts     │
│  qualification   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Redirected to   │
│  /qualify/[runId]│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  User navigates  │
│  to /dashboard   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Notification    │
│  appears (3s)    │
└────────┬─────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────────┐  ┌──────────────┐
│  Click "View     │  │  Click X to  │
│  Progress"       │  │  dismiss     │
└────────┬─────────┘  └──────┬───────┘
         │                   │
         ▼                   ▼
┌──────────────────┐  ┌──────────────┐
│  Navigate to     │  │  Notification│
│  /qualify/[runId]│  │  hidden      │
└──────────────────┘  └──────────────┘
```

## Polling Lifecycle

```
Component Mount
      │
      ▼
┌─────────────────┐
│ Fetch active runs│◄──────┐
└────────┬────────┘        │
         │                 │
         ▼                 │
┌─────────────────┐        │
│ Process results │        │
└────────┬────────┘        │
         │                 │
         ▼                 │
┌─────────────────┐        │
│ Update state    │        │
└────────┬────────┘        │
         │                 │
         ▼                 │
┌─────────────────┐        │
│ Render UI       │        │
└────────┬────────┘        │
         │                 │
         ▼                 │
┌─────────────────┐        │
│ Wait 3 seconds  │────────┘
└─────────────────┘
         │
         │ (if activeRuns.length === 0)
         ▼
┌─────────────────┐
│ Stop polling    │
└─────────────────┘
         │
         ▼
Component Unmount
```

## Completion Detection Logic

```
┌─────────────────────────────────────┐
│  Previous State                     │
│  Run A: completed = 8, total = 10   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Current State (new fetch)          │
│  Run A: completed = 10, total = 10  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Compare States                     │
│  previousRun.completed < run.completed│
│  AND run.completed === run.totalProspects│
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  🎉 Completion Detected!            │
│  - Show toast notification          │
│  - Keep tracking until removed      │
│    from API response                │
└─────────────────────────────────────┘
```

## API Endpoint Logic

```
GET /api/qualify/active

┌─────────────────────┐
│ Check auth          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Query database      │
│ WHERE:              │
│ - userId = session  │
│ - status IN         │
│   [PENDING,         │
│    PROCESSING]      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Include relations:  │
│ - icp               │
│   - company         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Order by createdAt  │
│ Take 5 most recent  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Map and return      │
│ - id                │
│ - status            │
│ - totalProspects    │
│ - completed         │
│ - icp.title         │
│ - company info      │
└─────────────────────┘
```

## Toast Notification Flow

```
Run Completed
      │
      ▼
┌─────────────────────┐
│ toast.success()     │
│                     │
│ Title:              │
│ "Qualification      │
│  Complete"          │
│                     │
│ Description:        │
│ "{icp.title} -      │
│  {N} prospects"     │
│                     │
│ Action:             │
│ "View Results"      │
│ → navigate to       │
│   /qualify/[runId]  │
│                     │
│ Duration: 10s       │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│ User can:           │
│ - Click action btn  │
│ - Dismiss           │
│ - Wait for auto-hide│
└─────────────────────┘
```

## Mobile Responsive Behavior

```
Desktop (>768px)          Mobile (<768px)
┌──────────────┐         ┌──────────┐
│              │         │          │
│          ┌──┐│         │          │
│          │N││         │  ┌────┐ │
│          │o││         │  │Notif│ │
│          │t││         │  │ Box│ │
│          │i││         │  └────┘ │
│          │f││         │          │
│          └──┘│         └──────────┘
└──────────────┘         Bottom-6
Bottom-right             Right-6
Max-width: 384px         Max-width: 90%
```

---

**Note**: All diagrams are simplified representations. Actual implementation includes error handling, TypeScript types, and additional edge case management.
