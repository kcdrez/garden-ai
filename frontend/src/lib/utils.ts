import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { MouseEvent } from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isCardNavigationSuppressed(e: MouseEvent): boolean {
  return !!(e.target as HTMLElement).closest(
    '[data-radix-popper-content-wrapper], [role="menu"], button',
  );
}
