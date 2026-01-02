import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import HowItWorks from "@/components/HowItWorks";
import TrustSection from "@/components/TrustSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BusinessCTA from "@/components/BusinessCTA";
import Footer from "@/components/Footer";

const Index = () => {
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
};

export default Index;
