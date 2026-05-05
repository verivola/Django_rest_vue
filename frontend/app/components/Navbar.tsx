"use client";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`navbar fixed top-0 w-full z-50 transition-all duration-300 
      ${scrolled ? "bg-green-500 shadow-lg" : "bg-yellow-400"}`}
    >
      <div className="flex-1">
        <a className="btn btn-ghost text-xl font-bold text-black">
          daisyUI
        </a>
      </div>

      <div className="flex-none">
        <ul className="menu menu-horizontal px-1 text-black font-bold">
          <li><a>Link</a></li>
          <li><a>Link 2</a></li>
          
        </ul>
      </div>
    </div>
  );
}