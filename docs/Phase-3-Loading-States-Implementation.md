# Phase 3: Loading States & Performance - Implementation Guide

## Overview
This document provides comprehensive documentation for all loading states, error handling, and form validation components implemented in Phase 3.

## Table of Contents
1. [Skeleton Components](#skeleton-components)
2. [Loading Indicators](#loading-indicators)
3. [Error Handling](#error-handling)
4. [Form Validation](#form-validation)
5. [Usage Examples](#usage-examples)

---

## Skeleton Components

Located in `/src/components/skeletons/`

### Base Skeleton
```tsx
import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-4 w-full" />
```

### Card Skeletons
```tsx
import { CardSkeleton, GridCardSkeleton, ListCardSkeleton } from "@/components/skeletons"

// Single card
<CardSkeleton showFooter lines={3} />

// Grid of cards
<GridCardSkeleton count={6} />

// List of cards
<ListCardSkeleton count={5} />
```

### Dashboard Skeletons
```tsx
import { DashboardWidgetSkeleton, DashboardGridSkeleton } from "@/components/skeletons"

// Single widget
<DashboardWidgetSkeleton type="stat" />
<DashboardWidgetSkeleton type="chart" />
<DashboardWidgetSkeleton type="list" />
<DashboardWidgetSkeleton type="progress" />

// Full dashboard
<DashboardGridSkeleton />
```

### Assessment Skeletons
```tsx
import { 
  QuestionSkeleton, 
  AssessmentProgressSkeleton,
  AssessmentResultSkeleton,
  AssessmentListSkeleton 
} from "@/components/skeletons"

<QuestionSkeleton />
<AssessmentProgressSkeleton />
<AssessmentResultSkeleton />
<AssessmentListSkeleton count={6} />
```

### Table Skeletons
```tsx
import { TableSkeleton, DataGridSkeleton, SearchResultsSkeleton } from "@/components/skeletons"

<TableSkeleton rows={10} columns={5} showHeader />
<DataGridSkeleton count={12} />
<SearchResultsSkeleton count={8} />
```

---

## Loading Indicators

Located in `/src/components/loading-indicators.tsx`

### General Loading Indicator
```tsx
import { LoadingIndicator } from "@/components/loading-indicators"

// Inline
<LoadingIndicator message="Loading data..." size="md" />

// Full screen
<LoadingIndicator message="Loading..." size="lg" fullScreen />
```

### Saving Indicator
```tsx
import { SavingIndicator } from "@/components/loading-indicators"

// Inline
<SavingIndicator message="Saving..." variant="inline" />

// Toast notification
<SavingIndicator message="Saving changes..." variant="toast" />
```

### Progress Saving Indicator
```tsx
import { ProgressSavingIndicator } from "@/components/loading-indicators"

const [showSaved, setShowSaved] = useState(false)

// Automatically shows for 3 seconds when triggered
<ProgressSavingIndicator show={showSaved} message="Progress saved" />
```

### Submission Processing
```tsx
import { SubmissionProcessing } from "@/components/loading-indicators"

{isSubmitting && <SubmissionProcessing message="Processing your submission..." />}
```

### Pagination Loading
```tsx
import { PaginationLoading } from "@/components/loading-indicators"

{loadingMore && <PaginationLoading message="Loading more results..." />}
```

### Inline Loading
```tsx
import { InlineLoading } from "@/components/loading-indicators"

<InlineLoading text="Processing..." />
```

---

## Error Handling

Located in `/src/components/error-handling.tsx`

### Network Error
```tsx
import { NetworkError } from "@/components/error-handling"

<NetworkError 
  message="Unable to fetch assessments"
  onRetry={async () => {
    await fetchData()
  }}
/>
```

Features:
- Detects online/offline status
- Shows appropriate messaging
- Retry button (disabled when offline)
- Auto-updates when connection restored

### Retryable Error
```tsx
import { RetryableError } from "@/components/error-handling"

<RetryableError
  error={error}
  onRetry={async () => await refetch()}
  maxRetries={3}
  autoRetry={true}
  retryDelay={2000}
/>
```

Features:
- Configurable max retries
- Auto-retry with countdown
- Manual retry button
- Tracks retry attempts
- Disables retry after max attempts

### Form Error
```tsx
import { FormError } from "@/components/error-handling"

<FormError 
  error="Please enter a valid email address"
  field="Email"
  onDismiss={() => clearError('email')}
/>

// Multiple errors
<FormError 
  error={["Password too short", "Must contain uppercase letter"]}
  field="Password"
/>
```

### Offline Indicator
```tsx
import { OfflineIndicator } from "@/components/error-handling"

// Add to layout - shows banner when offline
<OfflineIndicator message="You are offline. Changes will sync when reconnected." />
```

### Data Sync Status
```tsx
import { DataSyncStatus } from "@/components/error-handling"

const [syncing, setSyncing] = useState(false)
const [lastSynced, setLastSynced] = useState<Date>()
const [syncError, setSyncError] = useState<string>()

<DataSyncStatus
  syncing={syncing}
  lastSynced={lastSynced}
  error={syncError}
  onRetry={async () => await syncData()}
/>
```

---

## Form Validation

Located in `/src/components/form-validation.tsx`

### Form Validation Hook
```tsx
import { useFormValidation, commonSchemas } from "@/components/form-validation"
import { z } from "zod"

const loginSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
})

function LoginForm() {
  const {
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldError,
  } = useFormValidation({
    schema: loginSchema,
    onSubmit: async (data) => {
      await login(data)
    },
    validateOnChange: true,
    validateOnBlur: true,
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit({ email, password })
    }}>
      <input
        type="email"
        onChange={(e) => {
          setEmail(e.target.value)
          handleChange('email', e.target.value)
        }}
        onBlur={(e) => handleBlur('email', e.target.value)}
      />
      {getFieldError('email') && (
        <FieldValidation error={getFieldError('email')} />
      )}
      
      {/* ... rest of form */}
    </form>
  )
}
```

### Common Validation Schemas
```tsx
import { commonSchemas } from "@/components/form-validation"
import { z } from "zod"

// Available schemas:
commonSchemas.email      // Valid email format
commonSchemas.password   // 8+ chars, uppercase, lowercase, number
commonSchemas.name       // 2+ characters
commonSchemas.required   // Non-empty string

// Combine in custom schemas:
const schema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  name: commonSchemas.name,
  terms: z.boolean().refine(val => val === true, "You must accept terms"),
})
```

### Field Validation Display
```tsx
import { FieldValidation } from "@/components/form-validation"

<FieldValidation 
  error={errors.email} 
  showError={touched.email}
/>
```

### Success Message
```tsx
import { SuccessMessage } from "@/components/form-validation"

{success && (
  <SuccessMessage 
    message="Profile updated successfully!"
    onDismiss={() => setSuccess(false)}
  />
)}
```

### Form Validation Errors Display
```tsx
import { FormValidationErrors } from "@/components/form-validation"

<FormValidationErrors errors={errors} />
```

---

## Usage Examples

### Complete Assessment Page with Loading and Error States

```tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  AssessmentListSkeleton,
  LoadingIndicator,
  NetworkError,
  RetryableError,
  OfflineIndicator 
} from "@/components"

export default function AssessmentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [assessments, setAssessments] = useState([])
  
  const fetchAssessments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/assessments')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setAssessments(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchAssessments()
  }, [])
  
  if (loading) {
    return <AssessmentListSkeleton count={6} />
  }
  
  if (error) {
    return (
      <NetworkError
        message={error.message}
        onRetry={fetchAssessments}
      />
    )
  }
  
  return (
    <>
      <OfflineIndicator />
      {/* Your assessment content */}
    </>
  )
}
```

### Form with Real-time Validation

```tsx
"use client"

import { useState } from "react"
import { z } from "zod"
import { 
  useFormValidation, 
  commonSchemas,
  FieldValidation,
  SuccessMessage,
  SubmissionProcessing
} from "@/components"

const profileSchema = z.object({
  name: commonSchemas.name,
  email: commonSchemas.email,
  bio: z.string().max(500, "Bio must be less than 500 characters"),
})

export default function ProfileForm() {
  const [formData, setFormData] = useState({ name: "", email: "", bio: "" })
  const [success, setSuccess] = useState(false)
  
  const {
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldError,
  } = useFormValidation({
    schema: profileSchema,
    onSubmit: async (data) => {
      await updateProfile(data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
    validateOnChange: true,
    validateOnBlur: true,
  })
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(formData)
    }}>
      {success && <SuccessMessage message="Profile updated!" />}
      
      <div>
        <label>Name</label>
        <input
          value={formData.name}
          onChange={(e) => {
            const value = e.target.value
            setFormData(prev => ({ ...prev, name: value }))
            handleChange('name', value)
          }}
          onBlur={(e) => handleBlur('name', e.target.value)}
        />
        <FieldValidation error={getFieldError('name')} />
      </div>
      
      {/* More fields... */}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
      
      {isSubmitting && <SubmissionProcessing />}
    </form>
  )
}
```

### Dashboard with Progressive Loading

```tsx
import { Suspense } from "react"
import { DashboardWidgetSkeleton } from "@/components/skeletons"

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Suspense fallback={<DashboardWidgetSkeleton type="stat" />}>
        <StatsCard />
      </Suspense>
      
      <Suspense fallback={<DashboardWidgetSkeleton type="chart" />}>
        <ChartCard />
      </Suspense>
      
      <Suspense fallback={<DashboardWidgetSkeleton type="list" />}>
        <ActivityList />
      </Suspense>
      
      <Suspense fallback={<DashboardWidgetSkeleton type="progress" />}>
        <ProgressCard />
      </Suspense>
    </div>
  )
}
```

---

## Best Practices

### Loading States
1. **Always show loading feedback** for operations taking > 300ms
2. **Use skeleton screens** for initial page loads
3. **Use inline spinners** for button actions
4. **Progressive loading** for complex pages (load sections independently)
5. **Optimistic updates** where appropriate (show success immediately, rollback on error)

### Error Handling
1. **Always provide retry mechanisms** for network errors
2. **Show user-friendly messages** (avoid technical jargon)
3. **Detect offline state** and guide users accordingly
4. **Log errors** for debugging (console.error or monitoring service)
5. **Provide context** about what failed and how to recover

### Form Validation
1. **Validate on blur** for better UX (don't show errors immediately on typing)
2. **Show errors inline** near the problematic field
3. **Use clear, actionable messages** ("Email is required" not "Invalid input")
4. **Disable submit when validation fails** to prevent errors
5. **Show success feedback** after successful submission

---

## Testing

All components are designed to be testable. Example test:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NetworkError } from '@/components/error-handling'

describe('NetworkError', () => {
  it('calls onRetry when retry button clicked', async () => {
    const onRetry = jest.fn()
    render(<NetworkError onRetry={onRetry} />)
    
    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)
    
    await waitFor(() => {
      expect(onRetry).toHaveBeenCalled()
    })
  })
  
  it('disables retry when offline', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false
    })
    
    render(<NetworkError onRetry={jest.fn()} />)
    
    const retryButton = screen.getByText('Try Again')
    expect(retryButton).toBeDisabled()
  })
})
```

---

## Performance Considerations

1. **Skeleton components are lightweight** - no heavy computations
2. **Loading indicators use CSS animations** - GPU accelerated
3. **Error boundaries prevent crashes** - graceful degradation
4. **Validation is debounced** internally where appropriate
5. **Components are tree-shakeable** - only import what you need

---

## Accessibility

All components follow WCAG 2.1 guidelines:

- ✅ Proper ARIA labels
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus management
- ✅ Color contrast compliance
- ✅ Loading announcements

---

## Troubleshooting

### Skeleton not showing
- Ensure parent has proper height/width
- Check if loading state is properly toggled

### Validation not working
- Verify Zod schema is correct
- Check field names match between form and schema
- Ensure handleChange/handleBlur are called

### Retry not working
- Check network connectivity
- Verify onRetry function is async and returns promise
- Check browser console for errors

---

## Future Enhancements

Potential improvements for future phases:

1. **Advanced skeleton matching** - Generate skeletons from component structure
2. **Predictive loading** - Preload likely next pages
3. **Smart retry** - Exponential backoff strategies
4. **Validation caching** - Cache validation results
5. **Analytics integration** - Track error rates and retry success

---

**Phase 3 Implementation Complete** ✅  
**Date**: October 19, 2025  
**Components Created**: 25+  
**Code Quality**: Production-ready with TypeScript, accessibility, and error handling
