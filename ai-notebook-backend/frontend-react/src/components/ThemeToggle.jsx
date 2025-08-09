import React from 'react'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../hooks/useTheme.js'
import Button from './ui/button.jsx'

export default function ThemeToggle() {
  const { theme, setTheme, currentTheme, toggleTheme } = useTheme()

  const themes = [
    { value: 'light', icon: SunIcon, label: 'Light' },
    { value: 'dark', icon: MoonIcon, label: 'Dark' },
    { value: 'system', icon: ComputerDesktopIcon, label: 'System' }
  ]

  const currentThemeConfig = themes.find(t => t.value === theme)
  const CurrentIcon = currentThemeConfig?.icon || MoonIcon

  return (
    <div className="relative group">
      <Button
        variant="outline"
        size="default"
        onClick={toggleTheme}
        title={`Current theme: ${currentThemeConfig?.label || 'Dark'}`}
        className="w-auto px-3"
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Optional dropdown for more theme options */}
      <div className="absolute right-0 top-full mt-2 w-32 glass rounded-lg border border-white/20 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`
                w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2
                ${theme === themeOption.value ? 'text-sky-400 bg-white/5' : 'text-white'}
              `}
            >
              <Icon className="w-4 h-4" />
              {themeOption.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
