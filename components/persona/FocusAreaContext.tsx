'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface FocusAreaContextProps {
  focusArea: string
  context: Record<string, any>
  onUpdate: (context: Record<string, any>) => void
}

const CONTEXT_QUESTIONS = {
  relationships: {
    title: 'Dating & Relationships',
    questions: [
      {
        id: 'status',
        label: 'Current relationship status',
        type: 'select' as const,
        options: ['Single', 'Dating', 'In a relationship', 'Married', 'It\'s complicated']
      },
      {
        id: 'goal',
        label: 'Primary relationship goal',
        type: 'select' as const,
        options: [
          'Meeting new people',
          'Building confidence',
          'Improving current relationship',
          'Finding a serious partner',
          'Exploring casual dating'
        ]
      }
    ]
  },
  health: {
    title: 'Mental Health',
    questions: [
      {
        id: 'areas',
        label: 'Main areas of focus',
        type: 'select' as const,
        options: [
          'Anxiety management',
          'Depression support',
          'Stress management',
          'Self-esteem',
          'Life transitions',
          'General wellbeing'
        ]
      },
      {
        id: 'approach',
        label: 'Current approach',
        type: 'select' as const,
        options: [
          'Self-help and reading',
          'Working with a therapist',
          'Community support groups',
          'Exploring my options',
          'Meditation and mindfulness'
        ]
      }
    ]
  },
  fitness: {
    title: 'Health & Fitness',
    questions: [
      {
        id: 'level',
        label: 'Current fitness level',
        type: 'select' as const,
        options: [
          'Beginner (just starting)',
          'Intermediate (regular activity)',
          'Advanced (training regularly)',
          'Coming back from a break'
        ]
      },
      {
        id: 'goal',
        label: 'Primary fitness goal',
        type: 'select' as const,
        options: [
          'Weight loss',
          'Muscle gain',
          'General fitness',
          'Sports performance',
          'Flexibility and mobility',
          'Endurance training'
        ]
      }
    ]
  },
  programming: {
    title: 'Technical & Programming',
    questions: [
      {
        id: 'level',
        label: 'Experience level',
        type: 'select' as const,
        options: [
          'Beginner (learning to code)',
          'Intermediate (building projects)',
          'Advanced (professional experience)',
          'Expert (senior/lead level)'
        ]
      },
      {
        id: 'goal',
        label: 'Primary technical goal',
        type: 'select' as const,
        options: [
          'Learning new technologies',
          'Career advancement',
          'Building side projects',
          'Job searching',
          'Interview preparation',
          'Contributing to open source'
        ]
      }
    ]
  }
}

export function FocusAreaContext({ focusArea, context, onUpdate }: FocusAreaContextProps) {
  const config = CONTEXT_QUESTIONS[focusArea as keyof typeof CONTEXT_QUESTIONS]

  if (!config) return null

  const handleChange = (questionId: string, value: string) => {
    onUpdate({
      ...context,
      [questionId]: value
    })
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">{config.title}</CardTitle>
        <CardDescription>
          Help us understand your specific situation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {config.questions.map((question) => (
          <div key={question.id}>
            <Label htmlFor={`${focusArea}-${question.id}`}>
              {question.label}
            </Label>
            {question.type === 'select' ? (
              <select
                id={`${focusArea}-${question.id}`}
                value={context[question.id] || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background mt-1"
              >
                <option value="">Select an option...</option>
                {question.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={`${focusArea}-${question.id}`}
                value={context[question.id] || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
                placeholder="Enter your answer..."
                className="mt-1"
              />
            )}
          </div>
        ))}

        {/* Optional custom notes */}
        <div>
          <Label htmlFor={`${focusArea}-notes`}>
            Additional context (optional)
          </Label>
          <Input
            id={`${focusArea}-notes`}
            value={context.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any specific details you'd like to share..."
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  )
}
