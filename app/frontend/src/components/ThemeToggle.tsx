"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";

const themes = [
  { name: "light", icon: <FiSun size={20} />, label: "Light" },
  { name: "dark", icon: <FiMoon size={20} />, label: "Dark" },
  { name: "system", icon: <FiMonitor size={20} />, label: "System" },
];

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  // Resolve actual theme for icon display
  const currentTheme = theme === "system" ? systemTheme : theme;

  // Get icon for current theme (fallback to system)
  const currentIcon =
    themes.find((t) => t.name === currentTheme)?.icon || <FiMonitor size={20} />;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        aria-label="Toggle theme"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {currentIcon}
      </button>

      {dropdownOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="theme-toggle-menu"
        >
          <div className="py-1">
            {themes.map(({ name, icon, label }) => (
              <button
                key={name}
                role="menuitem"
                onClick={() => {
                  setTheme(name);
                  setDropdownOpen(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 ${
                  currentTheme === name ? "font-semibold bg-indigo-100 dark:bg-indigo-700" : ""
                }`}
              >
                <span className="mr-2">{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
