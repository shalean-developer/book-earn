import { motion } from "framer-motion";
import ServiceCard from "./ServiceCard";
import { 
  Sparkles, 
  Wrench, 
  Zap, 
  Bug, 
  PaintBucket, 
  Car, 
  Scissors, 
  Truck 
} from "lucide-react";

const services = [
  {
    title: "Home Cleaning",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    title: "Plumbing & Repairs",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    title: "Electrical Work",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    title: "Pest Control",
    image: "https://images.unsplash.com/photo-1632935190508-e6a0f5b8e2fc?w=400&h=300&fit=crop",
    icon: <Bug className="w-5 h-5" />,
  },
  {
    title: "Painting & Decor",
    image: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=300&fit=crop",
    icon: <PaintBucket className="w-5 h-5" />,
  },
  {
    title: "Car Services",
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop",
    icon: <Car className="w-5 h-5" />,
  },
  {
    title: "Salon & Spa",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    icon: <Scissors className="w-5 h-5" />,
  },
  {
    title: "Moving & Delivery",
    image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop",
    icon: <Truck className="w-5 h-5" />,
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Popular Services
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From everyday essentials to specialized services — find the right professionals for any job.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ServiceCard {...service} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
