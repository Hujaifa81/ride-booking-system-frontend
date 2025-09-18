import type { ReactNode } from "react";
import Footer from "../shared/Footer";
import Navbar from "../shared/Navbar";

interface IProps {
  children: ReactNode;
}

const CommonLayout = ({children}:IProps) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar/>
            <div className="grow-1">
                {children}
            </div>
            <Footer/>
        </div>
    );
};

export default CommonLayout;