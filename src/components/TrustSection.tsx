import { motion } from "framer-motion";
import { Shield, Clock, BadgeCheck, Headphones } from "lucide-react";

const features = [
  {
    icon: <BadgeCheck className="w-7 h-7" />,
    title: "Verified Professionals",
    description: "All service providers are background-checked and vetted for quality.",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: "Secure Payments",
    description: "Your payments are protected with bank-level security encryption.",
  },
  {
    icon: <Clock className="w-7 h-7" />,
    title: "On-Time Guarantee",
    description: "Professionals arrive on time or your booking is free.",
  },
  {
    icon: <Headphones className="w-7 h-7" />,
    title: "24/7 Support",
    description: "Our support team is always here to help you with any issues.",
  },
];

const TrustSection = () => {
  return (
    <section className="py-20 bg-hero-gradient">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Why Choose BookPro?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            We're committed to making your service experience seamless and worry-free.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-primary-foreground/20"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-foreground/20 flex items-center justify-center text-primary-foreground">
                {feature.icon}
              </div>
              <h3 className="font-display text-lg font-semibold text-primary-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-primary-foreground/70 text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
