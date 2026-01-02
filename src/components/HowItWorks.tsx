import { motion } from "framer-motion";
import { Search, Calendar, CreditCard, Star } from "lucide-react";

const steps = [
  {
    icon: <Search className="w-8 h-8" />,
    title: "Search & Compare",
    description: "Browse verified professionals and compare prices, ratings, and availability.",
  },
  {
    icon: <Calendar className="w-8 h-8" />,
    title: "Book Instantly",
    description: "Select your preferred time slot and book with just a few clicks.",
  },
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: "Pay Securely",
    description: "Pay safely online or on completion. Your payment is protected.",
  },
  {
    icon: <Star className="w-8 h-8" />,
    title: "Rate & Review",
    description: "Share your experience to help others find great service providers.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-muted">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Getting started is easy. Just follow these simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              <div className="text-center">
                {/* Step Number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm flex items-center justify-center">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-background shadow-card flex items-center justify-center text-primary">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
