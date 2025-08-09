import { useEffect, useCallback, useRef } from 'react'

export function useKeyboard(keys, callback, options = {}) {
  const {
    preventDefault = true,
    stopPropagation = false,
    eventType = 'keydown',
    target = null,
    enabled = true,
    deps = []
  } = options

  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const targetElement = target || window

    const handleKeyPress = (event) => {
      const pressedKey = event.key.toLowerCase()
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
      
      // Handle single keys
      if (typeof keys === 'string') {
        if (pressedKey === keys.toLowerCase()) {
          if (preventDefault) event.preventDefault()
          if (stopPropagation) event.stopPropagation()
          callbackRef.current(event)
        }
        return
      }

      // Handle key combinations
      if (Array.isArray(keys)) {
        const match = keys.some(keyCombo => {
          if (typeof keyCombo === 'string') {
            return pressedKey === keyCombo.toLowerCase()
          }
          
          if (typeof keyCombo === 'object') {
            const { key, ctrl, meta, alt, shift } = keyCombo
            return (
              pressedKey === key.toLowerCase() &&
              (ctrl === undefined || event.ctrlKey === ctrl) &&
              (meta === undefined || event.metaKey === meta) &&
              (alt === undefined || event.altKey === alt) &&
              (shift === undefined || event.shiftKey === shift)
            )
          }
          
          return false
        })

        if (match) {
          if (preventDefault) event.preventDefault()
          if (stopPropagation) event.stopPropagation()
          callbackRef.current(event)
        }
        return
      }

      // Handle object format
      if (typeof keys === 'object') {
        const { key, ctrl, meta, alt, shift } = keys
        if (
          pressedKey === key.toLowerCase() &&
          (ctrl === undefined || event.ctrlKey === ctrl) &&
          (meta === undefined || event.metaKey === meta) &&
          (alt === undefined || event.altKey === alt) &&
          (shift === undefined || event.shiftKey === shift)
        ) {
          if (preventDefault) event.preventDefault()
          if (stopPropagation) event.stopPropagation()
          callbackRef.current(event)
        }
      }
    }

    targetElement.addEventListener(eventType, handleKeyPress)
    return () => targetElement.removeEventListener(eventType, handleKeyPress)
  }, [keys, preventDefault, stopPropagation, eventType, target, enabled, ...deps])
}

// Hook for command palette style shortcuts
export function useCommandPalette(callback, options = {}) {
  const { enabled = true } = options
  
  return useKeyboard(
    { key: 'k', ctrl: true, meta: true },
    callback,
    { enabled, preventDefault: true }
  )
}

// Hook for escape key
export function useEscape(callback, options = {}) {
  const { enabled = true } = options
  
  return useKeyboard(
    'escape',
    callback,
    { enabled, preventDefault: true }
  )
}

// Hook for enter key
export function useEnter(callback, options = {}) {
  const { enabled = true } = options
  
  return useKeyboard(
    'enter',
    callback,
    { enabled, preventDefault: false }
  )
}

// Hook for arrow keys navigation
export function useArrowKeys(callbacks, options = {}) {
  const { enabled = true } = options
  const {
    onUp = () => {},
    onDown = () => {},
    onLeft = () => {},
    onRight = () => {}
  } = callbacks

  useKeyboard(['arrowup'], onUp, { enabled })
  useKeyboard(['arrowdown'], onDown, { enabled })
  useKeyboard(['arrowleft'], onLeft, { enabled })
  useKeyboard(['arrowright'], onRight, { enabled })
}

// Hook for tab navigation
export function useTabNavigation(callback, options = {}) {
  const { enabled = true, allowShift = true } = options
  
  if (allowShift) {
    return useKeyboard(
      [
        { key: 'tab', shift: false },
        { key: 'tab', shift: true }
      ],
      callback,
      { enabled, preventDefault: true }
    )
  }
  
  return useKeyboard(
    { key: 'tab', shift: false },
    callback,
    { enabled, preventDefault: true }
  )
}

// Global keyboard shortcuts hook
export function useGlobalShortcuts(shortcuts, options = {}) {
  const { enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (event) => {
      const pressedKey = event.key.toLowerCase()
      
      Object.entries(shortcuts).forEach(([shortcut, callback]) => {
        const [key, ...modifiers] = shortcut.toLowerCase().split('+').reverse()
        
        if (pressedKey === key) {
          const hasCorrectModifiers = modifiers.every(modifier => {
            switch (modifier) {
              case 'ctrl': return event.ctrlKey
              case 'cmd': 
              case 'meta': return event.metaKey
              case 'alt': return event.altKey
              case 'shift': return event.shiftKey
              default: return false
            }
          })
          
          if (hasCorrectModifiers) {
            event.preventDefault()
            callback(event)
          }
        }
      })
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [shortcuts, enabled])
}