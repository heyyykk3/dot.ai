import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { MessageSquare, Code, Search, Image, Github, Linkedin, ExternalLink } from "lucide-react"
import { ProfileImage } from "@/components/profile-image"

export default function AboutPage() {
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
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">About dot.ai</h1>
                <p className="text-gray-500 dark:text-gray-400 md:text-xl">
                  Your all-in-one AI assistant powered by free AI models
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Our Story</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  dot.ai was born from a simple idea: make powerful AI accessible to everyone. We believe that the
                  benefits of artificial intelligence should not be limited by technical barriers or high costs.
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Our team of AI enthusiasts and developers came together to create a platform that harnesses the power
                  of open-source and free AI models, making them available through a simple, intuitive interface.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Our Mission</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  At dot.ai, our mission is to democratize access to advanced AI capabilities. We're committed to:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-gray-500 dark:text-gray-400">
                  <li>Making AI accessible to everyone, regardless of technical expertise</li>
                  <li>Providing a free tier that offers genuine value and utility</li>
                  <li>Creating an ethical AI platform that respects user privacy and data</li>
                  <li>Continuously improving our service based on user feedback</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Our Features</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Personal Assistant</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get help with everyday tasks, questions, and information using Gemini 2.5 Pro.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Code Generation</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Write, debug, and explain code with DeepSeek v3, a specialized coding model.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Research Assistant</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Conduct in-depth research and analysis with DeepSeek R1, designed for complex reasoning.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Image className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Image Generation</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create beautiful images from text descriptions using AI Horde's stable diffusion models.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">The Technology Behind dot.ai</h2>
                <p className="text-gray-500 dark:text-gray-400">dot.ai leverages several cutting-edge technologies:</p>
                <ul className="list-disc space-y-2 pl-5 text-gray-500 dark:text-gray-400">
                  <li>
                    <strong>Advanced AI Models:</strong> Access to state-of-the-art AI models like Gemini 2.5 Pro,
                    DeepSeek v3, and DeepSeek R1
                  </li>
                  <li>
                    <strong>AI Horde:</strong> A distributed volunteer-driven image generation service
                  </li>
                  <li>
                    <strong>Firebase:</strong> Secure authentication and data storage
                  </li>
                  <li>
                    <strong>Next.js:</strong> A React framework for building fast, responsive web applications
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">The Developer</h2>
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    <ProfileImage
                      src="https://github.com/heyyykk3.png"
                      alt="Kunj Kariya"
                      className="w-full h-full object-cover"
                      fallbackSrc="/placeholder.svg?height=128&width=128"
                    />
                  </div>
                  <div className="space-y-3 text-center md:text-left">
                    <h3 className="text-xl font-bold">Kunj Kariya</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Full-stack developer with a passion for AI and creating accessible technology.
                    </p>
                    <div className="flex justify-center md:justify-start gap-4">
                      <a
                        href="https://github.com/heyyykk3"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary dark:text-gray-400"
                      >
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                      <a
                        href="https://www.linkedin.com/in/kunj-kariya-a6643525b/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary dark:text-gray-400"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                      <a
                        href="https://kunjkariya.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary dark:text-gray-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Portfolio
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Get Started</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Ready to experience the power of dot.ai? Click the button below to start chatting with our AI
                  assistant.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href="/chat">
                    <Button size="lg" className="w-full sm:w-auto">
                      Start Chatting
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      View Pricing
                    </Button>
                  </Link>
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
