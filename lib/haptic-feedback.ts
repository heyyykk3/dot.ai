// Haptic feedback utility for mobile devices

// Check if vibration API is available
const hasVibration = typeof navigator !== "undefined" && "vibrate" in navigator

// Different vibration patterns
export const HapticPattern = {
  LIGHT: 10, // Light tap
  MEDIUM: 25, // Medium tap
  HEAVY: 35, // Heavy tap
  SUCCESS: [10, 30, 10], // Success pattern
  ERROR: [50, 30, 50], // Error pattern
  WARNING: [30, 50, 30], // Warning pattern
}

/**
 * Trigger haptic feedback
 * @param pattern Vibration pattern in milliseconds
 * @returns Boolean indicating if vibration was triggered
 */
export function triggerHaptic(pattern: number | number[] = HapticPattern.LIGHT): boolean {
  if (!hasVibration) return false

  try {
    navigator.vibrate(pattern)
    return true
  } catch (error) {
    console.error("Error triggering haptic feedback:", error)
    return false
  }
}

/**
 * Check if haptic feedback is available
 */
export function isHapticAvailable(): boolean {
  return hasVibration
}

/**
 * Enable or disable haptic feedback based on user preference
 * @param enabled Whether haptic feedback should be enabled
 */
export function setHapticEnabled(enabled: boolean): void {
  localStorage.setItem("hapticFeedbackEnabled", enabled ? "true" : "false")
}

/**
 * Get current haptic feedback preference
 * @returns Boolean indicating if haptic feedback is enabled
 */
export function isHapticEnabled(): boolean {
  // Default to enabled if not set
  const setting = localStorage.getItem("hapticFeedbackEnabled")
  return setting === null ? true : setting === "true"
}

/**
 * Trigger haptic feedback if enabled
 * @param pattern Vibration pattern in milliseconds
 * @returns Boolean indicating if vibration was triggered
 */
export function triggerHapticIfEnabled(pattern: number | number[] = HapticPattern.LIGHT): boolean {
  if (!isHapticEnabled()) return false
  return triggerHaptic(pattern)
}
