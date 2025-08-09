import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const Modal = React.forwardRef(function Modal({ 
  isOpen = false,
  onClose,
  title,
  description,
  children,
  showClose = true,
  size = 'default',
  className = '',
  ...props 
}, ref) {
  const sizeClasses = {
    sm: 'max-w-md',
    default: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]'
  }

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={onClose}
        ref={ref}
        {...props}
      >
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={`w-full ${sizeClasses[size]} transform overflow-hidden glass rounded-2xl p-6 text-left align-middle shadow-2xl transition-all ${className}`}
              >
                {(title || showClose) && (
                  <div className="flex items-center justify-between mb-4">
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-white"
                      >
                        {title}
                      </Dialog.Title>
                    )}
                    {showClose && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={onClose}
                      >
                        <XMarkIcon className="w-5 h-5" />
                        <span className="sr-only">Close</span>
                      </button>
                    )}
                  </div>
                )}
                
                {description && (
                  <Dialog.Description className="text-sm text-slate-400 mb-4">
                    {description}
                  </Dialog.Description>
                )}

                <div className="modal-content">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
})

const ModalHeader = React.forwardRef(function ModalHeader({ 
  className = '', 
  children, 
  ...props 
}, ref) {
  return (
    <div 
      ref={ref} 
      className={`flex flex-col space-y-1.5 mb-4 ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
})

const ModalTitle = React.forwardRef(function ModalTitle({ 
  className = '', 
  children, 
  ...props 
}, ref) {
  return (
    <Dialog.Title
      ref={ref} 
      className={`text-lg font-semibold text-white ${className}`} 
      {...props}
    >
      {children}
    </Dialog.Title>
  )
})

const ModalDescription = React.forwardRef(function ModalDescription({ 
  className = '', 
  children, 
  ...props 
}, ref) {
  return (
    <Dialog.Description
      ref={ref} 
      className={`text-sm text-slate-400 ${className}`} 
      {...props}
    >
      {children}
    </Dialog.Description>
  )
})

const ModalFooter = React.forwardRef(function ModalFooter({ 
  className = '', 
  children, 
  ...props 
}, ref) {
  return (
    <div 
      ref={ref} 
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2 ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
})

Modal.Header = ModalHeader
Modal.Title = ModalTitle
Modal.Description = ModalDescription
Modal.Footer = ModalFooter

export default Modal