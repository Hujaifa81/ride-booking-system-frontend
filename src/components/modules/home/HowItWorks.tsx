"use client";

import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { CheckCircle, Truck, CreditCard, MapPin } from "lucide-react";

const steps = [
  { title: "Select Your Ride", description: "Choose from standard, premium, or shared rides.", icon: Truck },
  { title: "Make Payment", description: "Secure and seamless payment options available.", icon: CreditCard },
  { title: "Track Your Ride", description: "See real-time location and estimated arrival.", icon: MapPin },
  { title: "Enjoy Your Journey", description: "Sit back, relax, and reach safely.", icon: CheckCircle },
];

function StepCard({ step}: { step: typeof steps[0]; index: number }) {
  return (
    <div className="relative flex flex-col items-center text-center md:text-left md:flex-1">
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-4 rounded-full mb-4 shadow-lg">
        <step.icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{step.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mt-1">{step.description}</p>
    </div>
  );
}

export default function HowItWorks() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  if (inView) controls.start({ width: "100%" });

  return (
    <section className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden px-12">
  <div className="container mx-auto ">
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
      How It Works
    </h2>

    {/* Desktop Layout */}
    <div className="hidden md:flex relative items-center justify-between gap-16">
      {/* Animated gradient horizontal line */}
      <div className="absolute top-10 left-0 w-full h-1 z-0">
        <div className="w-full h-full bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            ref={ref}
            initial={{ width: 0 }}
            animate={controls}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-green-400"
          />
        </div>
      </div>

      {steps.map((step, index) => (
        <StepCard key={index} step={step} index={index} />
      ))}
    </div>

    {/* Mobile Layout */}
    <div className="md:hidden mt-12">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-4 mb-12 relative">
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-4 rounded-full shadow-lg">
              <step.icon className="w-6 h-6 text-white" />
            </div>
            {index !== steps.length - 1 && (
              <div className="w-1 h-24 bg-gradient-to-b from-purple-500 via-pink-500 to-green-400 rounded-full mt-2" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{step.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

  );
}
