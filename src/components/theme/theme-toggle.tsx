"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    // Toggle between light and dark only (no system)
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white hover:bg-gray-100 transition-all duration-200 rounded-lg"
      aria-label="Toggle theme"
    >
      <Sun 
        className={`h-4 w-4 transition-all duration-200 ${
          theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        } text-gray-600`} 
      />
      <Moon 
        className={`absolute h-4 w-4 transition-all duration-200 ${
          theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        } text-gray-400`} 
      />
    </button>
  )
}
