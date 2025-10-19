"use client"

import { Toaster } from "sonner"

export function SonnerProvider() {
  return (
    <Toaster
      position="bottom-right"
      expand={false}
      richColors
      closeButton
    />
  )
}