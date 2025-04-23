"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { motion } from "framer-motion"
import { Github, Linkedin, ExternalLink, MessageSquare, Code, Search, ImageIcon, Sparkles } from "lucide-react"
import { BackgroundPath } from "@/components/background-path"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      <BackgroundPath />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <span className="text-2xl font-bold">dot.ai</span>
          </motion.div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium">
              Pricing
            </Link>
            <ModeToggle />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/signin">
                <Button className="rounded-full bg-sky-400 hover:bg-sky-500 text-white">Sign In</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              {/* Simple circular animation */}
              <motion.div
                className="mb-6 relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative w-16 h-16 mx-auto">
                  {/* Main circle */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-sky-400/20"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Inner circle */}
                  <motion.div
                    className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-sky-400/40"
                    animate={{
                      scale: [1, 0.8, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />

                  {/* Center dot */}
                  <motion.div
                    className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-sky-400"
                    animate={{
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="space-y-2"
              >
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Welcome to <span className="text-sky-400">dot.ai</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  Your all-in-one AI assistant powered by state-of-the-art models
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="space-y-2"
              >
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400">
                  Access powerful AI capabilities without any cost. Generate images, write code, conduct research, and
                  get personal assistance - all in one place.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/signin">
                  <Button size="lg" className="mt-6 rounded-full bg-sky-400 hover:bg-sky-500 text-white">
                    Start for Free
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted relative">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="inline-block rounded-full bg-sky-100 dark:bg-sky-900/20 px-4 py-1 text-sm">
                  <Sparkles className="inline-block mr-2 h-4 w-4 text-sky-500" />
                  Friendly AI Companions
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Simple & Intuitive</h2>
                <p className="max-w-[600px] text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Enjoy a seamless experience with helpful AI models like Gemini and DeepSeek, all available at no cost.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <ul className="grid gap-4">
                  <motion.li whileHover={{ x: 5 }} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-sky-50 dark:bg-sky-900/10 dark:border-sky-800/30">
                      <MessageSquare className="h-4 w-4 text-sky-500" />
                    </div>
                    <span>Personal Assistant (Gemini 2.5 Pro)</span>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-sky-50 dark:bg-sky-900/10 dark:border-sky-800/30">
                      <Code className="h-4 w-4 text-sky-500" />
                    </div>
                    <span>Code Generation (DeepSeek v3)</span>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-sky-50 dark:bg-sky-900/10 dark:border-sky-800/30">
                      <Search className="h-4 w-4 text-sky-500" />
                    </div>
                    <span>Research Assistant (DeepSeek R1)</span>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-sky-50 dark:bg-sky-900/10 dark:border-sky-800/30">
                      <ImageIcon className="h-4 w-4 text-sky-500" />
                    </div>
                    <span>Image Generation (AI Horde)</span>
                  </motion.li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section with Animation */}
        <section className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Powerful Features</h2>
              <p className="mx-auto mt-4 max-w-[700px] text-gray-500 dark:text-gray-400">
                Everything you need in one place
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Smart Conversations",
                  description: "Chat with advanced AI models that understand context and provide helpful responses.",
                  icon: <MessageSquare className="h-10 w-10" />,
                },
                {
                  title: "Code Assistance",
                  description: "Get help with programming, debugging, and learning new technologies.",
                  icon: <Code className="h-10 w-10" />,
                },
                {
                  title: "Research & Learning",
                  description: "Find information, summarize content, and explore complex topics with ease.",
                  icon: <Search className="h-10 w-10" />,
                },
                {
                  title: "Image Generation",
                  description: "Create beautiful images from text descriptions using AI.",
                  icon: <ImageIcon className="h-10 w-10" />,
                },
                {
                  title: "Multi-Modal",
                  description: "Interact with both text and images for a richer experience.",
                  icon: <Sparkles className="h-10 w-10" />,
                },
                {
                  title: "Free to Use",
                  description: "Access powerful AI capabilities without any cost.",
                  icon: <Sparkles className="h-10 w-10" />,
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center text-center p-6 bg-card rounded-xl border shadow-sm"
                >
                  <div className="p-3 rounded-full bg-sky-100 dark:bg-sky-900/20 text-sky-500 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        {/* Developer Spotlight */}
        <section className="w-full py-8 bg-muted/50">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center gap-6 max-w-3xl mx-auto"
            >
              <motion.div
                whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
                className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-sky-400/20"
              >
                <img
                  src="https://github.com/heyyykk3.png"
                  alt="Kunj Kariya"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=96&width=96"
                  }}
                />
              </motion.div>
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold">Meet the Developer</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Hi! I'm Kunj Kariya, the developer behind dot.ai. I'm passionate about creating accessible AI tools
                  that help people in their daily lives.
                </p>
                <div className="flex justify-center md:justify-start gap-3 mt-2">
                  <motion.a
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    href="https://github.com/heyyykk3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-sky-500 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.2, rotate: -5 }}
                    href="https://www.linkedin.com/in/kunj-kariya-a6643525b/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-sky-500 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    href="https://kunjkariya.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-sky-500 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </motion.a>
                </div>
              </div>
            </motion.div>
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
                <motion.a
                  whileHover={{ scale: 1.2 }}
                  href="https://github.com/heyyykk3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400"
                >
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.2 }}
                  href="https://www.linkedin.com/in/kunj-kariya-a6643525b/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400"
                >
                  <Linkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.2 }}
                  href="https://kunjkariya.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Portfolio</span>
                </motion.a>
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
