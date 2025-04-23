import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Check, Github, Linkedin, ExternalLink } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <span className="text-2xl font-bold">dot.ai</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/chat">
              <Button>Chat</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Simple, Transparent Pricing
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  Choose the plan that's right for you
                </p>
              </div>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
              {/* Free Tier */}
              <div className="flex flex-col rounded-lg border bg-card p-6 shadow-sm">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Free</h3>
                  <p className="text-gray-500 dark:text-gray-400">Perfect for getting started with AI</p>
                </div>
                <div className="mt-4 flex items-baseline text-gray-900 dark:text-gray-50">
                  <span className="text-5xl font-extrabold tracking-tight">$0</span>
                  <span className="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">/month</span>
                </div>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>Access to all AI models</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>Unlimited text conversations</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>10 image generations per day</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>Chat history (7 days)</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/signin">
                    <Button className="w-full">Sign Up Free</Button>
                  </Link>
                </div>
              </div>

              {/* Premium Tier */}
              <div className="relative flex flex-col rounded-lg border bg-card p-6 shadow-sm">
                <div className="absolute -top-4 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Coming Soon
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Premium</h3>
                  <p className="text-gray-500 dark:text-gray-400">For power users who need more</p>
                </div>
                <div className="mt-4 flex items-baseline text-gray-900 dark:text-gray-50">
                  <span className="text-5xl font-extrabold tracking-tight">$9.99</span>
                  <span className="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">/month</span>
                </div>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>Priority access to newest models</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>Unlimited image generations</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>Unlimited chat history</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>Higher rate limits</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Button className="w-full" variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <div className="mt-8 grid gap-6 text-left">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">What models are available in the free tier?</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    The free tier includes access to all AI models including Gemini 2.5 Pro, DeepSeek v3, DeepSeek R1,
                    and AI Horde image generation.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Are there any usage limits?</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Free tier users have unlimited text conversations but are limited to 10 image generations per day.
                    Premium users will have higher rate limits and unlimited image generations.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">When will Premium be available?</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    We're working hard to launch Premium soon. Sign up for our newsletter to be notified when it's
                    available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">© 2024 dot.ai. All rights reserved.</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Developed by Kunj Kariya</span>
              <div className="flex gap-2">
                <a
                  href="https://github.com/heyyykk3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/kunj-kariya-a6643525b/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Linkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a
                  href="https://kunjkariya.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Portfolio</span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              About
            </Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Pricing
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
