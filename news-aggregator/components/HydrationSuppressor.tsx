'use client'

import { useEffect } from 'react'

/**
 * This component suppresses specific hydration warnings caused by browser extensions
 * (like Bitwarden's "bis_skin_checked" attribute) that clutter the terminal.
 */
export default function HydrationSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error
      console.error = (...args: any[]) => {
        // Suppress warnings related to "bis_skin_checked" injected by extensions
        const isExtensionWarning = args.some(arg => 
          typeof arg === 'string' && arg.includes('bis_skin_checked')
        )
        
        if (isExtensionWarning) return

        originalError.apply(console, args)
      }
    }
  }, [])

  return null
}
