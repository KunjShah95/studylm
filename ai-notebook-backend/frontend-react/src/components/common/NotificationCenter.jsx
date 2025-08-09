import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

const NotificationCenter = React.forwardRef(function NotificationCenter({ 
  className = '',
  position = 'top-right',
  maxNotifications = 5,
  ...props 
}, ref) {
  const [notifications, setNotifications] = useState([])

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4', 
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  }

  const colors = {
    success: 'border-green-400 bg-green-900/50 text-green-100',
    error: 'border-red-400 bg-red-900/50 text-red-100',
    warning: 'border-yellow-400 bg-yellow-900/50 text-yellow-100',
    info: 'border-blue-400 bg-blue-900/50 text-blue-100'
  }

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev]
      return updated.slice(0, maxNotifications)
    })

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [maxNotifications])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    addNotification,
    removeNotification,
    clearAll,
    success: (message, options = {}) => addNotification({ type: 'success', message, ...options }),
    error: (message, options = {}) => addNotification({ type: 'error', message, ...options }),
    warning: (message, options = {}) => addNotification({ type: 'warning', message, ...options }),
    info: (message, options = {}) => addNotification({ type: 'info', message, ...options })
  }), [addNotification, removeNotification, clearAll])

  return (
    <div 
      className={`fixed z-50 pointer-events-none ${positions[position]} ${className}`}
      {...props}
    >
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type]
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`
                mb-3 w-80 max-w-sm glass rounded-lg border p-4 shadow-lg pointer-events-auto
                ${colors[notification.type]}
              `}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3 flex-1">
                  {notification.title && (
                    <h4 className="text-sm font-semibold mb-1">
                      {notification.title}
                    </h4>
                  )}
                  <p className="text-sm">
                    {notification.message}
                  </p>
                  {notification.description && (
                    <p className="text-xs mt-1 opacity-80">
                      {notification.description}
                    </p>
                  )}
                  {notification.action && (
                    <div className="mt-2">
                      <button
                        onClick={notification.action.onClick}
                        className="text-xs font-medium underline hover:no-underline"
                      >
                        {notification.action.label}
                      </button>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="inline-flex rounded-md p-1 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
})

export default NotificationCenter