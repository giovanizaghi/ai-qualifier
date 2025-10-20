"use client"

import { useState, useCallback } from "react"
import { z, ZodError, ZodSchema } from "zod"

import { FormError } from "./error-handling"

export interface ValidationError {
  field: string
  message: string
}

export interface UseFormValidationOptions<T> {
  schema: ZodSchema<T>
  onSubmit: (data: T) => Promise<void> | void
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormValidationOptions<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateField = useCallback(
    (field: string, value: any): string | null => {
      try {
        // Validate single field
        const fieldSchema = (schema as any).shape?.[field]
        if (fieldSchema) {
          fieldSchema.parse(value)
        }
        return null
      } catch (error) {
        if (error instanceof ZodError) {
          return error.issues[0]?.message || "Validation error"
        }
        return "Validation error"
      }
    },
    [schema]
  )

  const validateForm = useCallback(
    (data: T): Record<string, string> => {
      try {
        schema.parse(data)
        return {}
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors: Record<string, string> = {}
          error.issues.forEach((err: any) => {
            const field = err.path[0] as string
            if (field && !fieldErrors[field]) {
              fieldErrors[field] = err.message
            }
          })
          return fieldErrors
        }
        return {}
      }
    },
    [schema]
  )

  const handleChange = useCallback(
    (field: string, value: any) => {
      if (validateOnChange && touched[field]) {
        const error = validateField(field, value)
        setErrors((prev) => ({
          ...prev,
          [field]: error || "",
        }))
      }
    },
    [validateField, validateOnChange, touched]
  )

  const handleBlur = useCallback(
    (field: string, value: any) => {
      setTouched((prev) => ({ ...prev, [field]: true }))
      
      if (validateOnBlur) {
        const error = validateField(field, value)
        setErrors((prev) => ({
          ...prev,
          [field]: error || "",
        }))
      }
    },
    [validateField, validateOnBlur]
  )

  const handleSubmit = useCallback(
    async (data: T) => {
      setIsSubmitting(true)
      setSubmitError(null)

      // Validate all fields
      const fieldErrors = validateForm(data)
      
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        setIsSubmitting(false)
        return
      }

      try {
        await onSubmit(data)
        setErrors({})
        setTouched({})
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "An error occurred during submission"
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [validateForm, onSubmit]
  )

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
    setSubmitError(null)
  }, [])

  return {
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    clearError,
    clearAllErrors,
    getFieldError: (field: string) => errors[field] || null,
    hasError: (field: string) => Boolean(errors[field]),
  }
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  required: z.string().min(1, "This field is required"),
}

// Validation helper for real-time feedback
export interface FieldValidationProps {
  error?: string | null
  showError?: boolean
  className?: string
}

export function FieldValidation({ error, showError = true, className }: FieldValidationProps) {
  if (!error || !showError) {return null}

  return (
    <p className={`text-sm text-red-600 dark:text-red-400 mt-1 animate-in slide-in-from-top-1 ${className || ''}`}>
      {error}
    </p>
  )
}

// Success message component
export interface SuccessMessageProps {
  message: string
  className?: string
  onDismiss?: () => void
}

export function SuccessMessage({ message, className, onDismiss }: SuccessMessageProps) {
  return (
    <div className={`p-4 bg-green-50 dark:bg-green-950 border border-green-500 rounded-lg animate-in slide-in-from-top-2 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-green-700 dark:text-green-300">
          {message}
        </p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

// Form validation error display component
export interface FormValidationErrorsProps {
  errors: Record<string, string>
  className?: string
}

export function FormValidationErrors({ errors, className }: FormValidationErrorsProps) {
  const errorMessages = Object.entries(errors)
    .filter(([, message]) => message)
    .map(([field, message]) => ({ field, message }))

  if (errorMessages.length === 0) {return null}

  return (
    <div className={className}>
      {errorMessages.map(({ field, message }) => (
        <FormError key={field} error={message} field={field} />
      ))}
    </div>
  )
}
