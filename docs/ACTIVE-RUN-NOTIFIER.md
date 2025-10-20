# Active Run Notifier Feature

## Overview
A floating notification component that tracks background qualification runs and provides quick navigation to view their progress.

## Components Created

### 1. `ActiveRunNotifier` Component
**File**: `src/components/shared/active-run-notifier.tsx`

A client-side component that displays floating cards for active qualification runs.

**Features**:
- ✅ Real-time polling (3-second intervals)
- ✅ Shows progress bar and completion status
- ✅ Quick navigation to run details page
- ✅ Dismissible notifications
- ✅ Multiple run support (stacked)
- ✅ Animated entrance/exit
- ✅ Fixed bottom-right positioning
- ✅ Backdrop blur effect

**Props**:
```typescript
interface ActiveRunNotifierProps {
  userId: string;
}
```

**UI Elements**:
- Loading spinner icon
- ICP title
- Progress bar
- Status text (X of Y prospects analyzed)
- "View Progress" button
- Dismiss button

### 2. `ActiveRunNotifierWrapper` Component
**File**: `src/components/shared/active-run-notifier-wrapper.tsx`

A client-side wrapper that checks authentication and conditionally renders the notifier.

**Features**:
- ✅ Checks user authentication
- ✅ Only renders for logged-in users
- ✅ Silent failure for unauthenticated users

### 3. Active Runs API Endpoint
**File**: `src/app/api/qualify/active/route.ts`

**Endpoint**: `GET /api/qualify/active`

Returns user's active qualification runs (PENDING or PROCESSING status).

**Response**:
```json
{
  "success": true,
  "runs": [
    {
      "id": "run123",
      "status": "PROCESSING",
      "totalProspects": 10,
      "completed": 5,
      "createdAt": "2025-10-20T10:00:00Z",
      "icp": {
        "id": "icp123",
        "title": "E-commerce SaaS Companies",
        "company": {
          "name": "Stripe",
          "domain": "stripe.com"
        }
      }
    }
  ]
}
```

**Features**:
- ✅ Authentication required
- ✅ Filters for PENDING/PROCESSING status
- ✅ Sorted by creation date (newest first)
- ✅ Limited to 5 most recent runs
- ✅ Includes ICP and company details

## Integration

### Added to Root Layout
**File**: `src/app/layout.tsx`

The `ActiveRunNotifierWrapper` is added to the root layout so it appears on all pages for authenticated users.

```tsx
<SessionProvider>
  <SonnerProvider />
  <ActiveRunNotifierWrapper />
  {children}
</SessionProvider>
```

## User Flow

1. **User starts qualification**: Submits domains on `/qualify` page
2. **Background processing begins**: Redirected to `/qualify/[runId]`
3. **User navigates away**: Can explore other pages
4. **Floating notification appears**: Shows active runs in bottom-right corner
5. **Real-time updates**: Progress bar and count update every 3 seconds
6. **Quick navigation**: Click "View Progress" to return to results page
7. **Auto-dismissal**: Notification disappears when run completes
8. **Manual dismissal**: User can click X to hide notification

## Styling

**Position**: Fixed bottom-right with 1.5rem margin
**Width**: Max 384px (sm)
**Shadow**: Large shadow for elevation
**Backdrop**: Blur effect with transparency
**Animation**: Slide-in from bottom
**Z-index**: 50 (above most content)

## Behavior

### Polling Logic
- Polls `/api/qualify/active` every 3 seconds
- Only fetches runs with PENDING/PROCESSING status
- Excludes manually dismissed runs
- Stops polling when no active runs exist

### Dismissal
- Per-run dismissal stored in component state
- Not persisted (resets on page refresh)
- Dismissed runs won't reappear until page refresh

### Navigation
- Clicking "View Progress" navigates to `/qualify/[runId]`
- Uses Next.js router for client-side navigation
- Preserves app state

## Performance Considerations

- ✅ Lightweight API calls (minimal data)
- ✅ Polling only when notifications visible
- ✅ Cleanup on unmount
- ✅ Limit to 5 active runs max
- ✅ No polling for unauthenticated users

## Future Enhancements

- [ ] WebSocket support for real-time updates (eliminate polling)
- [ ] Browser notifications when run completes
- [ ] Persist dismissal state in localStorage
- [ ] Sound notification option
- [ ] Expandable details view
- [ ] Batch dismiss all
- [ ] Run cancellation from notifier
- [ ] Estimated time remaining
- [ ] Success/failure toast on completion

## Testing Scenarios

### Scenario 1: Single Active Run
1. Start qualification with 5 domains
2. Navigate to dashboard
3. Verify notification appears
4. Wait for updates
5. Click "View Progress"
6. Verify navigation to run page

### Scenario 2: Multiple Active Runs
1. Start 3 qualification runs
2. Navigate away
3. Verify all 3 notifications appear (stacked)
4. Dismiss one
5. Verify others remain
6. Navigate to specific run

### Scenario 3: Run Completion
1. Start qualification with 1 domain (fast)
2. Navigate away
3. Wait for completion
4. Verify notification disappears

### Scenario 4: Unauthenticated User
1. Sign out
2. Navigate to public page
3. Verify no notifications appear
4. No API calls made

### Scenario 5: Manual Dismissal
1. Start qualification
2. Navigate away
3. Click X on notification
4. Verify notification disappears
5. Refresh page
6. Verify notification reappears (dismissal not persisted)

## Files Modified

1. ✅ Created `src/components/shared/active-run-notifier.tsx`
2. ✅ Created `src/components/shared/active-run-notifier-wrapper.tsx`
3. ✅ Created `src/app/api/qualify/active/route.ts`
4. ✅ Updated `src/components/shared/index.ts`
5. ✅ Updated `src/app/layout.tsx`

## Dependencies Used

- `next/navigation` - useRouter for navigation
- `lucide-react` - Icons (Loader2, X, ChevronRight)
- `@/components/ui/*` - Button, Card, Progress
- `@/lib/utils` - cn utility for className merging

## API Calls Made

1. `GET /api/qualify/active` - Fetch active runs (polled)
2. `GET /api/auth/session` - Check authentication (once on mount)

---

**Status**: ✅ Complete and Integrated
**Date**: October 20, 2025
