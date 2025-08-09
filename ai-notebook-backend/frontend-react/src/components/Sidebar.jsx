import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  FolderIcon,
  CloudArrowUpIcon,
  BookOpenIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Button from './ui/button'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'

const navigationItems = [
  {
    id: 'chat',
    label: 'Chat',
    icon: ChatBubbleLeftRightIcon,
    description: 'Ask questions about your documents'
  },
  {
    id: 'upload',
    label: 'Upload',
    icon: CloudArrowUpIcon,
    description: 'Add new documents'
  },
  {
    id: 'files',
    label: 'Files',
    icon: DocumentTextIcon,
    description: 'Manage your documents'
  },
  {
    id: 'notebooks',
    label: 'Notebooks',
    icon: BookOpenIcon,
    description: 'Organize your research'
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: DocumentTextIcon,
    description: 'Your saved notes'
  },
  {
    id: 'facts',
    label: 'Facts',
    icon: LightBulbIcon,
    description: 'Key insights and facts'
  },
  {
    id: 'study',
    label: 'Study Tools',
    icon: AcademicCapIcon,
    description: 'Flashcards, quizzes & more'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: ChartBarIcon,
    description: 'Usage insights',
    badge: 'Pro'
  }
]

export default function Sidebar({ 
  tab, 
  setTab, 
  useNotebook, 
  nbTitle,
  isOpen = true,
  onClose,
  className 
}) {
  const [hoveredItem, setHoveredItem] = React.useState(null)

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: -320,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isOpen ? "open" : "closed"}
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-80 border-r border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 md:relative md:top-0 md:h-screen md:translate-x-0",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Navigation
              </h2>
              {useNotebook && nbTitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {nbTitle}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="md:hidden"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-6">
            <div className="space-y-1">
              {navigationItems.map((item, index) => {
                const Icon = item.icon
                const isActive = tab === item.id
                const isDisabled = item.badge === 'Pro' // Mock pro feature

                return (
                  <motion.div
                    key={item.id}
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    onHoverStart={() => setHoveredItem(item.id)}
                    onHoverEnd={() => setHoveredItem(null)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-12 px-3 text-left",
                        isActive && "bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300",
                        isDisabled && "opacity-60 cursor-not-allowed"
                      )}
                      onClick={() => !isDisabled && setTab(item.id)}
                      disabled={isDisabled}
                    >
                      <Icon className={cn(
                        "h-5 w-5 shrink-0",
                        isActive && "text-primary-600 dark:text-primary-400"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge variant="secondary" size="sm">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      </div>
                    </Button>

                    {/* Hover tooltip for disabled items */}
                    <AnimatePresence>
                      {hoveredItem === item.id && isDisabled && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute left-full ml-2 z-50 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg dark:bg-gray-700"
                        >
                          Upgrade to Pro to access this feature
                          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <CloudArrowUpIcon className="h-4 w-4" />
                  Upload Document
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <BookOpenIcon className="h-4 w-4" />
                  New Notebook
                </Button>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Cog6ToothIcon className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}