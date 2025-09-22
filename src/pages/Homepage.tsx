import Hero from "@/components/modules/home/Hero";
import HowItWorks from "@/components/modules/home/HowItWorks";
import Stats from "@/components/modules/home/Stats";
import Services from "@/components/modules/home/Services";


const Homepage = () => {
    return (
        <div>
            <Hero/>
            <Stats/>
            <HowItWorks/>
            <Services/>
        </div>
    );
};

export default Homepage;