"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const role = (session?.user as { role?: string } | undefined)?.role;
  const dashboardHref =
    role === "admin"
      ? "/admin"
      : role === "customer"
        ? "/customer"
        : role === "cleaner"
          ? "/cleaner"
          : null;

  const navLinks = [
    { name: "Services", href: "#services" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Reviews", href: "#reviews" },
    { name: "For Business", href: "#business" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Shalean Cleaning Services"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="font-display font-bold text-xl text-foreground">
              Shalean Cleaning Services
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="tel:+1234567890"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Contact Us</span>
            </a>
            {!isAuthenticated ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/quote">Get a quote</Link>
                </Button>
              </>
            ) : (
              dashboardHref && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={dashboardHref}>My dashboard</Link>
                </Button>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border"
          >
            <div className="container py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-foreground font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}

              {isAuthenticated && dashboardHref && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href={dashboardHref}>My dashboard</Link>
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {!isAuthenticated ? (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        Log In
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        Sign up
                      </Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link href="/quote" onClick={() => setIsOpen(false)}>
                        Get a quote
                      </Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
