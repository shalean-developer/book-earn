\"use client\";

import { useEffect, useState } from \"react\";
import { motion } from \"framer-motion\";
import { Star, Quote } from \"lucide-react\";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
};

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: \"fallback-1\",
    name: \"Sarah Johnson\",
    role: \"Homeowner\",
    rating: 5,
    text: \"BookPro made finding a reliable cleaner so easy! The booking process was seamless and the service was exceptional.\",
  },
  {
    id: \"fallback-2\",
    name: \"Michael Chen\",
    role: \"Business Owner\",
    rating: 5,
    text: \"As a business owner, I list my services here and get consistent bookings. The platform is fantastic for growing my client base.\",
  },
  {
    id: \"fallback-3\",
    name: \"Emily Rodriguez\",
    role: \"Property Manager\",
    rating: 5,
    text: \"I manage 15 properties and BookPro has been a lifesaver. Quick booking, verified professionals, and great support.\",
  },
];

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(\"/api/reviews\");
        if (!res.ok) return;

        const data = await res.json();
        if (!data?.reviews || !Array.isArray(data.reviews)) return;

        const mapped: Testimonial[] = data.reviews.map((r: any) => ({
          id: r.id ?? crypto.randomUUID(),
          name: r.name ?? \"Customer\",
          role: r.role ?? \"Homeowner\",
          rating: Number(r.rating ?? 5),
          text: r.text ?? \"\",
        }));

        if (!cancelled && mapped.length > 0) {
          setTestimonials(mapped);
        }
      } catch {
        // Swallow error and keep fallback testimonials
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id=\"reviews\" className=\"py-20 bg-background\">
      <div className=\"container\">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className=\"text-center mb-12\"
        >
          <h2 className=\"font-display text-3xl md:text-4xl font-bold text-foreground mb-4\">
            Trusted by Thousands
          </h2>
          <p className=\"text-muted-foreground text-lg max-w-2xl mx-auto\">
            See what our customers and service providers have to say.
          </p>
        </motion.div>

        <div className=\"grid grid-cols-1 md:grid-cols-3 gap-8\">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className=\"bg-card rounded-2xl p-6 shadow-card relative\"
            >
              {/* Quote Icon */}
              <Quote className=\"absolute top-6 right-6 w-8 h-8 text-primary/20\" />

              {/* Rating */}
              <div className=\"flex gap-1 mb-4\">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className=\"w-5 h-5 fill-accent text-accent\" />
                ))}
              </div>

              {/* Text */}
              <p className=\"text-foreground mb-6 leading-relaxed\">
                \"{testimonial.text}\"
              </p>

              {/* Author */}
              <div className=\"flex items-center gap-3\">
                <div className=\"w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center font-display font-semibold text-accent\">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className=\"font-display font-semibold text-foreground\">
                    {testimonial.name}
                  </p>
                  <p className=\"text-sm text-muted-foreground\">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
