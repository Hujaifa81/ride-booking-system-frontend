"use client";

import { motion } from "framer-motion";
import { Link } from "react-router";
import {
  Facebook,
  Twitter,
  Instagram,
  Github,
  Phone,
  Mail,
  MapPin,
  Smartphone,
} from "lucide-react";
import Logo from "@/assets/icons/Logo"; // adjust your logo path


export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-white to-white/0 dark:from-gray-950 dark:to-gray-950/60">
      {/* Animated accent line */}
      <div className="absolute inset-x-0 -top-6 flex justify-center pointer-events-none">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="origin-left w-40 h-1 rounded-full bg-gradient-to-r from-[#8E58FC] via-[#7A3FF5] to-[#5B2ECC] shadow-xl"
        />
      </div>

      <div className="container mx-auto px-12 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Brand + short */}
          <div className="flex flex-col gap-4">
            <Link to="/" aria-label="RideBook home" className="inline-flex items-center gap-2">
              <Logo />
              <span className="font-semibold text-lg text-gray-900 dark:text-white">RideBook</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm">
              Quick, secure rides — anytime, anywhere. Trusted drivers, transparent fares, and 24/7 support.
            </p>

            <div className="flex items-center gap-3 mt-2">
              <a href="#appstore" aria-label="App Store" className="inline-block">
                <Smartphone className="w-5 h-5"/>
              </a>
              <a href="#playstore" aria-label="Google Play" className="inline-block">
                <Smartphone className="w-5 h-5"/>
              </a>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <a href="https://facebook.com" aria-label="Facebook" className="p-2 rounded-md bg-white/90 dark:bg-white/5 hover:bg-white/100 dark:hover:bg-white/10 transition">
                <Facebook className="w-4 h-4 text-[#4267B2]" />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="p-2 rounded-md bg-white/90 dark:bg-white/5 hover:bg-white/100 dark:hover:bg-white/10 transition">
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="p-2 rounded-md bg-white/90 dark:bg-white/5 hover:bg-white/100 dark:hover:bg-white/10 transition">
                <Instagram className="w-4 h-4 text-pink-500" />
              </a>
              <a href="https://github.com" aria-label="Github" className="p-2 rounded-md bg-white/90 dark:bg-white/5 hover:bg-white/100 dark:hover:bg-white/10 transition">
                <Github className="w-4 h-4 text-gray-800 dark:text-white" />
              </a>
            </div>
          </div>

          {/* Services / Products */}
          <nav aria-label="Services" className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Rider</h4>
              <ul className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
                <li><Link to="/rides/standard" className="hover:text-[#8E58FC]">Standard Rides</Link></li>
                <li><Link to="/rides/premium" className="hover:text-[#8E58FC]">Premium Rides</Link></li>
                <li><Link to="/rides/shared" className="hover:text-[#8E58FC]">Shared Rides</Link></li>
                <li><Link to="/fares" className="hover:text-[#8E58FC]">Fare Estimates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Driver</h4>
              <ul className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
                <li><Link to="/driver/signup" className="hover:text-[#8E58FC]">Become a Driver</Link></li>
                <li><Link to="/driver/earnings" className="hover:text-[#8E58FC]">Earnings</Link></li>
                <li><Link to="/driver/support" className="hover:text-[#8E58FC]">Driver Support</Link></li>
                <li><Link to="/safety" className="hover:text-[#8E58FC]">Safety Guidelines</Link></li>
              </ul>
            </div>
          </nav>

          {/* Support & Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Support</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                <a href="tel:+18001234567" className="hover:text-[#8E58FC]">+1 (800) 123-4567</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                <a href="mailto:support@ridebook.com" className="hover:text-[#8E58FC]">support@ridebook.com</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                <span className="text-gray-600 dark:text-gray-300">Headquarters: 123 Mobility Ave, City</span>
              </li>
            </ul>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Help</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li><Link to="/faq" className="hover:text-[#8E58FC]">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-[#8E58FC]">Contact Us</Link></li>
                <li><Link to="/safety" className="hover:text-[#8E58FC]">Safety</Link></li>
                <li><Link to="/terms" className="hover:text-[#8E58FC]">Terms & Privacy</Link></li>
              </ul>
            </div>
          </div>

          {/* Newsletter CTA */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Stay in the loop</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Get promos, new features & city launches — delivered monthly.</p>

            <form
              // simulated submission - replace with your handler
              onSubmit={(e) => {
                e.preventDefault();
                // show toast / call API
                // TODO: integrate subscription API
                alert("Thanks — subscription simulated ✅");
              }}
              className="flex flex-col sm:flex-row gap-1"
            >
              <label htmlFor="footer-email" className="sr-only">Email</label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder="Your email address"
                className=" px-1 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8E58FC]"
                aria-label="Email for newsletter"
              />
              <button
                type="submit"
                className=" px-2 py-2 rounded-lg bg-[#8E58FC] hover:bg-[#7A3FF5] text-white font-base shadow-md transition"
              >
                Subscribe
              </button>
            </form>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 max-w-sm">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* bottom row */}
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} RideBook. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#8E58FC]">Privacy</Link>
            <Link to="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#8E58FC]">Terms</Link>
            <Link to="/status" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#8E58FC]">System Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
