import { ChatDemoSection } from "@/components/landing/chat-demo-section"
import { CtaSection } from "@/components/landing/cta-section"
import { FaqSection } from "@/components/landing/faq-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { Footer } from "@/components/landing/footer"
import { Header } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { ProblemSection } from "@/components/landing/problem-section"
import { ProcessSection } from "@/components/landing/process-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"

export default function HomePage() {
  return (
    <main className="landing-page min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection />
      <ProblemSection />
      <ProcessSection />
      <FeaturesSection />
      <ChatDemoSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
