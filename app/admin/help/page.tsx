'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChevronDown,
  BookOpenIcon,
  HelpCircleIcon,
  MailIcon,
  FileTextIcon,
  VideoIcon
} from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I create a new user?',
    answer: 'Navigate to Users section, click "Add User" button, fill in the required information (email, name, password), and click Save. The user will receive an email to verify their account.'
  },
  {
    id: '2',
    question: 'How do I assign roles to users?',
    answer: 'Go to Users section, select a user, click "Edit", then in the Roles section, select the roles you want to assign. Click Save to apply the changes.'
  },
  {
    id: '3',
    question: 'What is the difference between roles and permissions?',
    answer: 'Roles are collections of permissions. A role groups multiple permissions together for easier management. For example, the "Admin" role includes permissions like "manage users", "manage roles", etc.'
  },
  {
    id: '4',
    question: 'How do I create a new application?',
    answer: 'Go to Applications section, click "Add Application", enter the application details (name, path, description), and click Save. You can then assign roles to control access.'
  },
  {
    id: '5',
    question: 'How do I manage menu items?',
    answer: 'Navigate to Menu section to view all menu items. You can create new items, edit existing ones, delete items, and configure which roles can access each menu item.'
  },
  {
    id: '6',
    question: 'How do I view system statistics?',
    answer: 'The Dashboard shows real-time statistics including total users, roles, applications, and recent activities. Charts display trends and key metrics.'
  }
]

export default function AdminHelpPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Help & Support</h1>
        <p className="mt-2 text-gray-600">
          Find answers to common questions and access documentation
        </p>
      </div>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <BookOpenIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="flex items-center gap-2">
            <VideoIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Tutorials</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MailIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Find answers to common questions about the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-6">
                <Input
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                {filteredFAQs.map((faq) => (
                  <div
                    key={faq.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 text-left">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform ${
                          expandedFAQ === faq.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Access comprehensive documentation and guides
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {[
                  { title: 'User Management Guide', icon: FileTextIcon },
                  { title: 'Role & Permission System', icon: FileTextIcon },
                  { title: 'Application Configuration', icon: FileTextIcon },
                  { title: 'Menu Management', icon: FileTextIcon },
                  { title: 'Security Best Practices', icon: FileTextIcon },
                  { title: 'API Documentation', icon: FileTextIcon }
                ].map((doc, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="justify-start h-auto py-3"
                  >
                    <doc.icon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-xs text-gray-500">Click to view documentation</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>
                Watch step-by-step tutorials to learn how to use the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {[
                  { title: 'Getting Started with Admin Panel', duration: '5:30' },
                  { title: 'Managing Users and Roles', duration: '8:15' },
                  { title: 'Configuring Applications', duration: '6:45' },
                  { title: 'Setting Up Menu Items', duration: '7:20' },
                  { title: 'Understanding Permissions', duration: '9:10' },
                  { title: 'Advanced Configuration', duration: '12:00' }
                ].map((tutorial, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="justify-start h-auto py-3"
                  >
                    <VideoIcon className="h-5 w-5 mr-3" />
                    <div className="text-left flex-1">
                      <p className="font-medium">{tutorial.title}</p>
                      <p className="text-xs text-gray-500">{tutorial.duration}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Get Support</CardTitle>
              <CardDescription>
                Contact our support team for assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Email Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Send us an email and we'll respond within 24 hours
                    </p>
                    <Button className="w-full">
                      <MailIcon className="h-4 w-4 mr-2" />
                      support@example.com
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Live Chat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Chat with our support team in real-time
                    </p>
                    <Button className="w-full" variant="default">
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">2025-10-26</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Operational</span>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

