'use client'

import { motion } from 'framer-motion'

interface ConsentModalProps {
  onConsent: () => void
}

export default function ConsentModal({ onConsent }: ConsentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🎙️</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to AI Usability Testing
          </h2>
          <p className="text-gray-600">
            I'm Ava, your UX assistant. I'll ask a few short questions while you explore this app—just speak normally.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>What we'll record:</strong>
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Your interactions with the app</li>
            <li>Your voice responses to questions</li>
            <li>Timestamps of your actions</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            <strong>Your privacy:</strong> Your voice is never shared with third parties. This data is used solely to understand usability.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConsent}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            I understand, let's begin
          </button>
        </div>
      </motion.div>
    </div>
  )
}

