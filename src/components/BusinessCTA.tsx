"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, DollarSign } from "lucide-react";

const stats = [
  { icon: <Users className="w-5 h-5" />, value: "50K+", label: "Active Customers" },
  { icon: <TrendingUp className="w-5 h-5" />, value: "2M+", label: "Bookings Made" },
  { icon: <DollarSign className="w-5 h-5" />, value: "$10M+", label: "Paid to Providers" },
];

const BusinessCTA = () => {
  return (
    <section id="business" className="py-20 bg-muted">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              For Service Providers
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Grow Your Business with BookPro
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of service professionals who use BookPro to find new customers, 
              manage bookings, and get paid on time. List your business today and start growing.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2 text-primary mb-1">
                    {stat.icon}
                    <span className="font-display text-2xl font-bold text-foreground">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group">
                List Your Business
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=450&fit=crop"
                alt="Business team working"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-xl border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Growth</p>
                  <p className="font-display text-xl font-bold text-foreground">+340%</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BusinessCTA;
