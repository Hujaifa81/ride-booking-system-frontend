"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import background from "@/assets/icons/map.jpg";

export default function Promotions() {
  const promos = [
    {
      id: 1,
      title: "20% Off Airport Rides ✈️",
      desc: "Save on trips to and from the airport today!",
      desktop: "top-25 left-[10%]",
      color: "from-blue-500 via-indigo-600 to-purple-600",
    },
    {
      id: 2,
      title: "Free Ride Downtown 🏙️",
      desc: "Your first downtown trip is on us!",
      desktop: "top-[20%] left-[60%]",
      color: "from-pink-500 via-red-500 to-orange-500",
    },
    {
      id: 3,
      title: "Night Discount 🌙",
      desc: "50% off rides after 10 PM in university area.",
      desktop: "bottom-[10%] right-[40%]",
      color: "from-green-500 via-emerald-600 to-teal-600",
    },
  ];

  return (
    <section className="relative p-12 md:pt-24 bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Map Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80 dark:opacity-60"
        style={{ backgroundImage: `url(${background})` }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />

      <div className="container mx-auto relative z-10 text-center px-4">
        <h2 className="text-2xl md:text-5xl font-bold text-white mb-4 md:mb-6">
          Location-Based Offers
        </h2>
        <p className="text-white max-w-2xl mx-auto mb-6 md:mb-12">
          Special deals available in specific areas of your city. Book fast before they expire!
        </p>

        {/* Map container (desktop only) */}
<div className="hidden md:block relative w-full h-[500px] rounded-2xl overflow-hidden">
  {promos.map((promo, i) => (
    <motion.div
      key={promo.id}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: i * 0.15 }}
      className={`absolute ${promo.desktop}`}
    >
      {/* Pulse effect */}
      <span className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-purple-500/40 animate-ping" />

      {/* Promo Card */}
      <div
        className={`relative p-4 w-56 rounded-xl bg-gradient-to-br ${promo.color} text-white shadow-lg backdrop-blur-md`}
      >
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5" />
          <h3 className="font-semibold">{promo.title}</h3>
        </div>
        <p className="text-sm text-white/90">{promo.desc}</p>
        <button className="mt-3 px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition">
          Claim Offer
        </button>
      </div>
    </motion.div>
  ))}
</div>


        {/* Mobile stacked version */}
        <div className="md:hidden mt-6 space-y-4">
          {promos.map((promo, i) => (
            <motion.div
              key={`mobile-${promo.id}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`p-4 rounded-xl bg-gradient-to-br ${promo.color} text-white shadow-lg backdrop-blur-md`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5" />
                <h3 className="font-semibold">{promo.title}</h3>
              </div>
              <p className="text-sm text-white/90">{promo.desc}</p>
              <button className="mt-3 px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition">
                Claim Offer
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
