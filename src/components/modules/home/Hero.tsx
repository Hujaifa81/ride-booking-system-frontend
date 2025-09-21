import { Link } from "react-router";
import heroImg from "@/assets/icons/hero.png"; 
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-12">
      <div className="container mx-auto  py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-2 items-center">
        {/* Left Side - Text */}
        <div className="text-center lg:text-left space-y-6 -mt-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
            Your Ride, <span className="text-blue-600 dark:text-blue-400">Your Way</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0">
            Book a ride instantly, travel with comfort, and enjoy a seamless journey with RideBook. 
            Choose from standard, premium, or shared rides – all at your fingertips.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/book">Book a Ride</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link to="/learn-more">Learn More</Link>
            </Button>
          </div>

          
        </div>

        {/* Right Side - Image */}
        <div className="relative flex justify-center">
          <img
            src={heroImg}
            alt="RideBook Hero"
            className="w-full max-w-lg drop-shadow-2xl rounded-md max-h-96 object-cover"
          />
          {/* Background blob */}
          {/* <div className="absolute -z-10 w-72 h-72 bg-blue-300 dark:bg-blue-800 rounded-full blur-3xl opacity-30 top-10 left-10"></div> */}
        </div>
      </div>
    </section>
  );
}
