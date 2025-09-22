"use client";

import { Truck, MapPin, CreditCard, Clock, Users, Headphones } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  {
    title: "Instant Ride Booking",
    description: "Book a ride in seconds with standard, premium, or shared options.",
    icon: Truck,
    gradient: "from-purple-500 via-pink-500 to-indigo-500",
  },
  {
    title: "Real-time Ride Tracking",
    description: "Track your driver’s location in real-time on the map.",
    icon: MapPin,
    gradient: "from-green-400 via-teal-500 to-cyan-500",
  },
  {
    title: "Safe & Secure Payments",
    description: "Pay securely using multiple payment methods, all cashless.",
    icon: CreditCard,
    gradient: "from-yellow-400 via-orange-500 to-red-500",
  },
  {
    title: "Ride Scheduling",
    description: "Schedule rides for later, perfect for airport trips or appointments.",
    icon: Clock,
    gradient: "from-pink-400 via-purple-500 to-indigo-500",
  },
  {
    title: "Ride History & Receipts",
    description: "Access past rides and download invoices anytime.",
    icon: Users,
    gradient: "from-blue-400 via-cyan-500 to-teal-500",
  },
  {
    title: "24/7 Customer Support",
    description: "Get instant assistance anytime via app or call.",
    icon: Headphones,
    gradient: "from-red-400 via-pink-500 to-purple-500",
  },
];

export default function Services() {
  return (
    <section className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden px-12">
      <div className="container mx-auto ">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Our Services
        </h2>

        <div className="flex flex-col gap-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            const isLeft = index % 2 === 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isLeft ? -80 : 80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className={`relative flex flex-col md:flex-row items-center gap-6 ${
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Gradient Icon */}
                <div
                  className={`flex-shrink-0 w-20 h-20 rounded-full p-5 bg-gradient-to-br ${service.gradient} shadow-lg flex items-center justify-center transition-transform transform hover:scale-110`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Glassmorphism Card (dark mode supported) */}
                <div className="flex-1 p-8 rounded-3xl 
                  bg-gradient-to-br from-[#8E58FC] via-[#7A3FF5] to-[#5B2ECC] dark:bg-white/10 
                  backdrop-blur-xl 
                  border border-purple-400/30 
                  shadow-xl relative overflow-hidden">
                  
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 bg-[length:200%_200%] animate-shimmer opacity-20 rounded-3xl"></div>

                  <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">{service.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          animation: shimmer 6s ease infinite;
        }
      `}</style>
    </section>
  );
}
