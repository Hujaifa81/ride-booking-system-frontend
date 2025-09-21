import Hero from "@/components/modules/home/Hero";
import HowItWorks from "@/components/modules/home/HowItWorks";
import Stats from "@/components/modules/home/Stats";

const Homepage = () => {
    return (
        <div>
            <Hero/>
            <Stats/>
            <HowItWorks/>
        </div>
    );
};

export default Homepage;