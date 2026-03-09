"use client";

import { motion } from "framer-motion";

interface ServiceCardProps {
  title: string;
  image: string;
  icon?: React.ReactNode;
}

const ServiceCard = ({ title, image, icon }: ServiceCardProps) => {
  return (
    <motion.a
      href="#"
      whileHover={{ y: -5 }}
      className="group block bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
      </div>
    </motion.a>
  );
};

export default ServiceCard;
