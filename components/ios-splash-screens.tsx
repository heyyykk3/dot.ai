"use client"
import { isIOS } from "@/lib/mobile-detection"

export function IOSSplashScreens() {
  // Only render on iOS
  if (typeof window === "undefined" || !isIOS()) return null

  return (
    <>
      {/* iPhone 5, SE (1st gen) */}
      <link
        href="/splash/iphone5_splash.png"
        media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        rel="apple-touch-startup-image"
      />

      {/* iPhone 6, 6s, 7, 8, SE (2nd gen) */}
      <link
        href="/splash/iphone6_splash.png"
        media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        rel="apple-touch-startup-image"
      />

      {/* iPhone 6+, 6s+, 7+, 8+ */}
      <link
        href="/splash/iphoneplus_splash.png"
        media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        rel="apple-touch-startup-image"
      />

      {/* iPhone X, XS, 11 Pro, 12 mini, 13 mini */}
      <link
        href="/splash/iphonex_splash.png"
        media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        rel="apple-touch-startup-image"
      />

      {/* iPhone XR, 11, XS Max, 11 Pro Max */}
      <link
        href="/splash/iphonexr_splash.png"
        media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        rel="apple-touch-startup-image"
      />

      {/* iPhone 12, 12 Pro, 13, 13 Pro, 14 */}
      <link
        href="/splash/iphone12_splash.png"
        media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        rel="apple-touch-startup-image"
      />

      {/* iPhone 12 Pro Max, 13 Pro Max, 14 Plus */}
      <link
        href="/splash/iphone12promax_splash.png"
        media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        rel="apple-touch-startup-image"
      />

      {/* iPhone 14 Pro, 15, 15 Pro */}
      <link
        href="/splash/iphone14pro_splash.png"
        media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        rel="apple-touch-startup-image"
      />

      {/* iPhone 14 Pro Max, 15 Pro Max */}
      <link
        href="/splash/iphone14promax_splash.png"
        media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        rel="apple-touch-startup-image"
      />
    </>
  )
}
