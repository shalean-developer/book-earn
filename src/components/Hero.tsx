"use client";

import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center pt-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg.src}
          alt="City skyline"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
      </div>

      {/* Content */}
      <div className="container relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            Sit back, we'll take it from here
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-xl mx-auto">
            Book trusted professionals for any service. From home cleaning to car repair — all in one place.
          </p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-background rounded-2xl p-3 shadow-2xl max-w-2xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="What service do you need?"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Your location"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button size="lg" className="h-12 px-8">
                Search
              </Button>
            </div>
          </motion.div>

          {/* Popular Services */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <span className="text-primary-foreground/70 text-sm">Popular:</span>
            {["Home Cleaning", "Plumbing", "AC Repair", "Handyman", "Car Wash"].map((service) => (
              <a
                key={service}
                href="#services"
                className="text-primary-foreground text-sm font-medium hover:underline"
              >
                {service}
              </a>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
