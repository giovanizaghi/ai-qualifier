import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AlertDialogProps {
  children: React.ReactNode
}

interface AlertDialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogTitleProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogFooterProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogActionProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

interface AlertDialogCancelProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const AlertDialogContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

const AlertDialog: React.FC<AlertDialogProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setOpen(false)}
          />
          <div className="relative">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.type === AlertDialogContent) {
                return child
              }
              return null
            })}
          </div>
        </div>
      )}
    </AlertDialogContext.Provider>
  )
}

const AlertDialogTrigger: React.FC<AlertDialogTriggerProps> = ({ children }) => {
  const { setOpen } = React.useContext(AlertDialogContext)

  return (
    <div onClick={() => setOpen(true)}>
      {children}
    </div>
  )
}

const AlertDialogContent: React.FC<AlertDialogContentProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "bg-background p-6 shadow-lg rounded-lg border max-w-md w-full mx-4",
      className
    )}>
      {children}
    </div>
  )
}

const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  )
}

const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({ children, className }) => {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  )
}

const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({ children, className }) => {
  return (
    <p className={cn("text-sm text-muted-foreground mt-2", className)}>
      {children}
    </p>
  )
}

const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({ children, className }) => {
  return (
    <div className={cn("flex justify-end space-x-2 mt-6", className)}>
      {children}
    </div>
  )
}

const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ children, onClick, className }) => {
  const { setOpen } = React.useContext(AlertDialogContext)

  const handleClick = () => {
    onClick?.()
    setOpen(false)
  }

  return (
    <Button onClick={handleClick} className={className}>
      {children}
    </Button>
  )
}

const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ children, onClick, className }) => {
  const { setOpen } = React.useContext(AlertDialogContext)

  const handleClick = () => {
    onClick?.()
    setOpen(false)
  }

  return (
    <Button variant="outline" onClick={handleClick} className={className}>
      {children}
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}