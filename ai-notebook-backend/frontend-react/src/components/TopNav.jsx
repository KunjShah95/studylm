import React from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpenIcon, 
  CommandLineIcon, 
  MoonIcon, 
  SunIcon, 
  Cog6ToothIcon,
  UserCircleIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Button from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { cn } from '../lib/utils'

export default function TopNav({ 
  nbTitle, 
  useNotebook, 
  setPaletteOpen, 
  theme, 
  setTheme,
  className 
}) {
  const [notifications] = React.useState(3) // Mock notifications

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80",
        className
      )}
    >
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section - Logo & Title */}
          <div className="flex items-center gap-4">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
                <BookOpenIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">StudyLM</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI Research Assistant</p>
              </div>
            </motion.div>

            {/* Current Context */}
            {useNotebook && nbTitle && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:flex items-center gap-2"
              >
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <Badge variant="outline" className="gap-1">
                  <BookOpenIcon className="h-3 w-3" />
                  {nbTitle}
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Center Section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-gray-500 dark:text-gray-400"
              onClick={() => setPaletteOpen(true)}
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Search or run command...</span>
              <div className="ml-auto flex gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  ⌘K
                </kbd>
              </div>
            </Button>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setPaletteOpen(true)}
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </Button>

            {/* Command Palette */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex"
            >
              <CommandLineIcon className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5" />
              {notifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="transition-transform hover:scale-110"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Cog6ToothIcon className="h-5 w-5" />
            </Button>

            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/api/placeholder/32/32" alt="User" />
                <AvatarFallback>
                  <UserCircleIcon className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}