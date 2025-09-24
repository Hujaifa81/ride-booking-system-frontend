"use client";

import { motion } from "framer-motion";
import { Car, Smartphone } from "lucide-react";
import background from "@/assets/icons/cta.png";

export default function CallToAction() {
  return (
    <section className="relative py-24 text-white overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${background})`,
        }}
      ></div>

      {/* Overlay (light & dark mode) */}
      <div className="absolute inset-0 
        bg-gradient-to-br from-purple-600/80 via-purple-700/80 to-indigo-800/80 
        dark:from-black/90 dark:via-purple-950/80 dark:to-black/95">
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 text-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-6"
        >
          <Car className="w-16 h-16 text-white drop-shadow-lg" />
        </motion.div>

        {/* Heading */}
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Your Ride, Anytime, Anywhere 🚖
        </h2>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
          Whether it’s a quick city ride or a late-night airport trip, our
          trusted drivers are ready to take you there. Book instantly, pay
          securely, and ride worry-free.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="#book"
            className="px-8 py-4 rounded-full bg-white text-purple-700 font-semibold shadow-lg hover:bg-gray-100 transition"
          >
            🚖 Book a Ride
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="#driver"
            className="px-8 py-4 rounded-full border border-white/30 font-semibold shadow-lg hover:bg-white/10 transition"
          >
            Become a Driver
          </motion.a>
        </div>

        {/* App download badges */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <a
            href="#appstore"
            className="flex items-center gap-2 bg-black/80 rounded-lg px-5 py-3 text-white hover:opacity-80 transition"
          >
            <Smartphone className="w-5 h-5" />
            <div className="text-left">
              <p className="text-xs">Download on</p>
              <p className="text-sm font-semibold">App Store</p>
            </div>
          </a>
          <a
            href="#playstore"
            className="flex items-center gap-2 bg-black/80 rounded-lg px-5 py-3 text-white hover:opacity-80 transition"
          >
            <Smartphone className="w-5 h-5" />
            <div className="text-left">
              <p className="text-xs">Get it on</p>
              <p className="text-sm font-semibold">Google Play</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
