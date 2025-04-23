import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  size?: number
  className?: string
  linkTo?: string
}

export function Logo({ size = 40, className = "", linkTo = "/" }: LogoProps) {
  const logoContent = (
    <div className={`flex items-center ${className}`}>
      <Image src="/images/logo.png" alt="dot.ai logo" width={size} height={size} className="object-contain" priority />
    </div>
  )

  if (linkTo) {
    return <Link href={linkTo}>{logoContent}</Link>
  }

  return logoContent
}
