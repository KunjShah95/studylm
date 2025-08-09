import React from 'react'
import { motion } from 'framer-motion'
import Card from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/button.jsx'
import { ArrowRightIcon, DocumentTextIcon, ChatBubbleLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline'

export default function Dashboard({ 
  files = [], 
  nbId, 
  nbTitle, 
  onNavigate,
  stats = {}
}) {
  const { filesCount = 0, notebooksCount = 0, chatMessages = 0 } = stats

  const quickActions = [
    {
      title: 'Upload PDF',
      description: 'Add new documents to your knowledge base',
      icon: DocumentTextIcon,
      action: () => document.querySelector('input[type=file]')?.click(),
      color: 'bg-blue-500'
    },
    {
      title: 'Start Chatting',
      description: 'Ask questions about your documents',
      icon: ChatBubbleLeftIcon,
      action: () => onNavigate?.('chat'),
      color: 'bg-green-500'
    },
    {
      title: 'Create Notebook',
      description: 'Organize your sources and settings',
      icon: BookOpenIcon,
      action: () => onNavigate?.('notebooks'),
      color: 'bg-purple-500'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <motion.h1 
          className="text-4xl font-bold gradient-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Welcome to StudyLM
        </motion.h1>
        <motion.p 
          className="text-slate-400 text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Upload PDFs, create notebooks, ask questions with citations, and generate study aids.
        </motion.p>
      </div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Documents</p>
              <p className="text-2xl font-bold">{filesCount}</p>
            </div>
            <Badge variant="outline">{filesCount > 0 ? 'Active' : 'Empty'}</Badge>
          </div>
        </Card>

        <Card className="hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Current Notebook</p>
              <p className="text-lg font-semibold truncate">
                {nbTitle || (nbId ? nbId.slice(0, 8) + '…' : 'None selected')}
              </p>
            </div>
            <Badge variant={nbId ? 'default' : 'outline'}>
              {nbId ? 'Selected' : 'None'}
            </Badge>
          </div>
        </Card>

        <Card className="hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Chat Messages</p>
              <p className="text-2xl font-bold">{chatMessages}</p>
            </div>
            <Badge variant="secondary">Today</Badge>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className="hover-lift cursor-pointer" onClick={action.action}>
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${action.color} bg-opacity-20`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{action.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{action.description}</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-slate-400" />
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
          <Card>
            <div className="space-y-3">
              {files.slice(0, 5).map((file, index) => (
                <div key={file.id || index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm truncate">{file.name || `Document ${index + 1}`}</span>
                  </div>
                  <Badge variant="outline" size="sm">PDF</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <DocumentTextIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Get Started</h3>
          <p className="text-slate-400 mb-6">Upload your first PDF to begin your learning journey</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => document.querySelector('input[type=file]')?.click()}>
              Upload PDF
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('notebooks')}>
              Create Notebook
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}