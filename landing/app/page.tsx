import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Stats from "@/components/Stats";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between max-w-7xl mx-auto my-0">
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <CTA />
    </main>
  );
}
