export function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false

  // Check for common mobile user agents
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ""

  // Regular expression for mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

  // Check if the screen width is mobile-sized
  const isMobileWidth = window.innerWidth <= 768

  return mobileRegex.test(userAgent) || isMobileWidth
}

// Check if the device is iOS
export function isIOS(): boolean {
  if (typeof window === "undefined") return false

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ""
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
}

// Check if the device is Android
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ""
  return /Android/i.test(userAgent)
}

// Get device orientation
export function getOrientation(): "portrait" | "landscape" {
  if (typeof window === "undefined") return "portrait"

  return window.innerHeight > window.innerWidth ? "portrait" : "landscape"
}
