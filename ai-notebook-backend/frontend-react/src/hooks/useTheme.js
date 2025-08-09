import { useState, useEffect, useCallback } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('studylm-theme') || 'dark'
    }
    return 'dark'
  })

  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setAndPersistTheme = useCallback((newTheme) => {
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('studylm-theme', newTheme)
      
      // Apply theme to document
      const root = document.documentElement
      if (newTheme === 'dark' || (newTheme === 'system' && systemTheme === 'dark')) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [systemTheme])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setAndPersistTheme(newTheme)
  }, [theme, setAndPersistTheme])

  const currentTheme = theme === 'system' ? systemTheme : theme

  // Apply theme on mount
  useEffect(() => {
    setAndPersistTheme(theme)
  }, []) // Only on mount

  return {
    theme,
    currentTheme,
    systemTheme,
    setTheme: setAndPersistTheme,
    toggleTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
    isSystem: theme === 'system'
  }
}