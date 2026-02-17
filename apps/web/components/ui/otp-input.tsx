"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  className?: string
  error?: boolean
  autoFocus?: boolean
  onComplete?: (value: string) => void
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  className,
  error = false,
  autoFocus = false,
  onComplete,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(autoFocus ? 0 : null)

  // Split value into individual digits
  const digits = React.useMemo(() => {
    const arr = value.split("").slice(0, length)
    while (arr.length < length) {
      arr.push("")
    }
    return arr
  }, [value, length])

  // Focus on next input or previous input
  const focusInput = React.useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus()
      setFocusedIndex(index)
    }
  }, [length])

  // Handle input change
  const handleChange = React.useCallback(
    (index: number, digit: string) => {
      // Only allow digits
      if (digit && !/^\d$/.test(digit)) {
        return
      }

      const newDigits = [...digits]
      newDigits[index] = digit
      const newValue = newDigits.join("")

      onChange(newValue)

      // Move to next input if digit entered, or previous if deleted
      if (digit) {
        if (index < length - 1) {
          focusInput(index + 1)
        } else {
          // All digits filled, trigger completion
          if (newValue.length === length && onComplete) {
            onComplete(newValue)
          }
        }
      }
    },
    [digits, length, onChange, focusInput, onComplete]
  )

  // Handle paste
  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)

      if (pastedData.length === 0) return

      const newDigits = [...digits]
      for (let i = 0; i < pastedData.length && index + i < length; i++) {
        // @ts-ignore
        newDigits[index + i] = pastedData[i]
      }

      const newValue = newDigits.join("")
      onChange(newValue)

      // Focus on next empty input or last input
      const nextIndex = Math.min(index + pastedData.length, length - 1)
      focusInput(nextIndex)

      // Trigger completion if all digits filled
      if (newValue.length === length && onComplete) {
        setTimeout(() => onComplete(newValue), 0)
      }
    },
    [digits, length, onChange, focusInput, onComplete]
  )

  // Handle keydown
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          // Delete current digit
          handleChange(index, "")
        } else if (index > 0) {
          // Move to previous input and delete
          focusInput(index - 1)
          handleChange(index - 1, "")
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault()
        focusInput(index - 1)
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault()
        focusInput(index + 1)
      } else if (e.key === "Delete") {
        handleChange(index, "")
      }
    },
    [digits, length, handleChange, focusInput]
  )

  // Handle focus
  const handleFocus = React.useCallback(
    (index: number) => {
      setFocusedIndex(index)
      // Select all text on focus
      inputRefs.current[index]?.select()
    },
    []
  )

  // Handle blur
  const handleBlur = React.useCallback(() => {
    setFocusedIndex(null)
  }, [])

  // Auto-focus first input on mount if enabled
  React.useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  return (
    <div className={cn("flex items-center gap-2 justify-center", className)}>
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onPaste={(e) => handlePaste(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-2xl font-mono tracking-widest p-0",
            error && "border-destructive focus-visible:ring-destructive",
            focusedIndex === index && "ring-2 ring-ring ring-offset-2"
          )}
          aria-label={`OTP digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  )
}

