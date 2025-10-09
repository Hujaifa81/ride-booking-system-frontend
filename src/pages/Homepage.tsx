import Hero from "@/components/modules/home/Hero";
import HowItWorks from "@/components/modules/home/HowItWorks";
import Stats from "@/components/modules/home/Stats";
import Services from "@/components/modules/home/Services";
import CallToAction from "@/components/modules/home/CallToAction";
import Promotions from "@/components/modules/home/Promotions";




const Homepage = () => {
    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <Hero/>
            <Stats/>
            <HowItWorks/>
            <Services/>
            <Promotions/>
            <CallToAction/>
            
        </div>
    );
};

export default Homepage;