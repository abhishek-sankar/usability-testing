'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface Question {
  id: string
  text: string
}

const questions: Question[] = [
  { id: '1', text: 'How likely are you to recommend this website to a friend?' },
  { id: '2', text: 'How easy was it to find what you were looking for?' },
  { id: '3', text: 'How likely are you to return to this website?' },
  { id: '4', text: 'How satisfied were you with the overall experience?' },
  { id: '5', text: 'How likely are you to complete a purchase or sign up?' },
]

interface PostTestSurveyProps {
  onComplete: (answers: Record<string, number>) => void
}

export default function PostTestSurvey({ onComplete }: PostTestSurveyProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const handleRating = (rating: number) => {
    const questionId = questions[currentIndex].id
    setAnswers({ ...answers, [questionId]: rating })

    // Move to next question after a brief delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        onComplete({ ...answers, [questionId]: rating })
      }
    }, 300)
  }

  const currentQuestion = questions[currentIndex]
  const currentRating = answers[currentQuestion.id] || 0

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background p-8">
      <Card className="w-full max-w-2xl p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-8"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <h2 className="text-2xl font-semibold">{currentQuestion.text}</h2>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 transition-colors ${
                      rating <= currentRating
                        ? 'fill-foreground stroke-foreground'
                        : 'fill-none stroke-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>

            {currentRating > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground"
              >
                Selected: {currentRating} out of 5
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  )
}

