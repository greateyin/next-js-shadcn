/**
 * @fileoverview Dashboard Help Content Component
 * @module components/dashboard/dashboard-help-content
 * @description Help and support information for dashboard users
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Mail, MessageSquare, BookOpen, Video, HelpCircle } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * Dashboard Help Content Component
 * @component
 * @description Displays help, FAQ, documentation, and support information
 */
export function DashboardHelpContent() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs: FAQItem[] = [
    {
      id: "1",
      question: "How do I access my profile?",
      answer: "You can access your profile by clicking on your avatar in the top-right corner of the dashboard and selecting 'Profile', or by navigating to /dashboard/profile directly."
    },
    {
      id: "2",
      question: "How do I change my dashboard settings?",
      answer: "Go to Dashboard Settings from the Quick Actions in your profile, or navigate to /dashboard/settings. There you can customize notifications, privacy, display, and security settings."
    },
    {
      id: "3",
      question: "How do I search for items in the dashboard?",
      answer: "Use the search bar in the top navigation. Start typing to search for menu items, roles, and applications. Results will appear in real-time as you type."
    },
    {
      id: "4",
      question: "How do I manage my notifications?",
      answer: "Click the bell icon in the top navigation to view your notifications. You can mark them as read or delete them. Configure notification preferences in Dashboard Settings."
    },
    {
      id: "5",
      question: "How do I enable two-factor authentication?",
      answer: "Go to your profile settings and look for the Security section. You can enable 2FA there. You'll need to verify with your authenticator app."
    },
    {
      id: "6",
      question: "What should I do if I forget my password?",
      answer: "Click 'Forgot password?' on the login page. You'll receive an email with instructions to reset your password. Follow the link and create a new password."
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
          Help & Support
        </h1>
        <p className="text-gray-600">
          Find answers to common questions and get support
        </p>
      </div>

      {/* Help Tabs */}
      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Tutorials</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          <Card className="border-gray-200/50 shadow-sm">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Find answers to common questions about the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-6">
                <Input
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-gray-900">{faq.question}</p>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-600 flex-shrink-0 transition-transform ${
                            expandedFAQ === faq.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {expandedFAQ === faq.id && (
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No FAQs found matching your search
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-4">
          <Card className="border-gray-200/50 shadow-sm">
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Comprehensive guides and documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="#" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-medium text-gray-900">Getting Started Guide</h3>
                <p className="text-sm text-gray-600 mt-1">Learn the basics of using the dashboard</p>
              </a>
              <a href="#" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-medium text-gray-900">User Profile Management</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your profile and account settings</p>
              </a>
              <a href="#" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-medium text-gray-900">Security Best Practices</h3>
                <p className="text-sm text-gray-600 mt-1">Keep your account secure with these tips</p>
              </a>
              <a href="#" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-medium text-gray-900">Notification Settings</h3>
                <p className="text-sm text-gray-600 mt-1">Configure how you receive notifications</p>
              </a>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="space-y-4">
          <Card className="border-gray-200/50 shadow-sm">
            <CardHeader>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>
                Learn by watching video tutorials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <Video className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Dashboard Overview</h3>
                    <p className="text-sm text-gray-600 mt-1">5 minutes</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <Video className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Managing Your Profile</h3>
                    <p className="text-sm text-gray-600 mt-1">3 minutes</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <Video className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Security Settings</h3>
                    <p className="text-sm text-gray-600 mt-1">4 minutes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4">
          <Card className="border-gray-200/50 shadow-sm">
            <CardHeader>
              <CardTitle>Get Support</CardTitle>
              <CardDescription>
                Contact our support team for help
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">Email Support</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Send us an email and we'll respond within 24 hours
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <a href="mailto:support@example.com">Send Email</a>
                  </Button>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-gray-900">Live Chat</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Chat with our support team in real-time
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <a href="#">Start Chat</a>
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">System Status</h3>
                <p className="text-sm text-blue-800">
                  All systems are operational. Last updated: 2 minutes ago
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

