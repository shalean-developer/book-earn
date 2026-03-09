import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import HowItWorks from "@/components/HowItWorks";
import TrustSection from "@/components/TrustSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BusinessCTA from "@/components/BusinessCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <ServicesSection />
        <HowItWorks />
        <TrustSection />
        <TestimonialsSection />
        <BusinessCTA />
      </main>
      <Footer />
    </div>
  );
}

