import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export default function TermsPage() {
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
            <div className="mx-auto max-w-3xl space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Terms of Service</h1>
                <p className="text-gray-500 dark:text-gray-400 md:text-xl">Last updated: April 4, 2024</p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Introduction</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Welcome to dot.ai. By accessing or using our service, you agree to be bound by these Terms of Service.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Use of Service</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  You may use our service for lawful purposes only. You agree not to:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-gray-500 dark:text-gray-400">
                  <li>Use the service to violate any law or regulation</li>
                  <li>Attempt to gain unauthorized access to any part of the service</li>
                  <li>Use the service to generate harmful or malicious content</li>
                  <li>Interfere with the proper functioning of the service</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">User Accounts</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  When you create an account with us, you must provide accurate and complete information. You are
                  responsible for maintaining the security of your account.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Intellectual Property</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  The service and its original content, features, and functionality are owned by dot.ai and are
                  protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Limitation of Liability</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  In no event shall dot.ai be liable for any indirect, incidental, special, consequential, or punitive
                  damages, including without limitation, loss of profits, data, use, goodwill, or other intangible
                  losses.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Changes to Terms</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  We reserve the right to modify these terms at any time. We will provide notice of any significant
                  changes by updating the date at the top of these terms.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Contact Us</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  If you have any questions about these Terms, please contact us at terms@dot.ai.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">© 2024 dot.ai. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              About
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Privacy
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
