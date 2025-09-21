import { Smile, Car, Star, MapPin } from "lucide-react";

export default function StatsSection() {
  const stats = [
    { value: "50K+", label: "Happy Riders", icon: Smile },
    { value: "10K+", label: "Drivers Available", icon: Car },
    { value: "4.9★", label: "Avg. Rating", icon: Star },
    { value: "120+", label: "Cities Covered", icon: MapPin },
  ];

  return (
    <section
      className="relative py-16 
        bg-gradient-to-br from-[#8E58FC] via-[#7A3FF5] to-[#5B2ECC] 
        dark:bg-gray-900 
        text-white overflow-hidden"
    >
      {/* Decorative curved shape */}
      <div className="absolute -top-10 left-0 w-full h-20 bg-white dark:bg-gray-800 rounded-b-[50%]"></div>

      <div className="container mx-auto px-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="backdrop-blur-md 
                  bg-white/10 dark:bg-gray-800/40 
                  border border-white/20 dark:border-gray-700 
                  rounded-2xl p-6 flex flex-col items-center justify-center gap-3
                  shadow-lg transition-transform transform hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="bg-white/20 dark:bg-gray-700/50 p-3 rounded-full">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
                <p className="text-sm md:text-base text-blue-100 dark:text-gray-300">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
