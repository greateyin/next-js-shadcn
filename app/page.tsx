import Link from "next/link";
import { ArrowRight, CheckCircle2, Quote, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Home component - Apple-style landing page
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-gradient-to-b from-blue-50 via-white to-gray-50" />

        {/* Hero - Apple Style */}
        <section className="border-b border-gray-100">
          <div className="container mx-auto grid gap-12 px-6 py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <Badge className="bg-blue-50 text-blue-600 border-0">New live masterclass</Badge>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-900 md:text-6xl">
                Turn Your Expertise Into An Irresistible Movement
              </h1>
              <p className="mt-6 text-lg text-gray-600">
                Discover the conversion framework inspired by Expert Secrets that empowers coaches, creators, and consultants to craft a captivating message, build loyal communities, and launch offers people can&apos;t ignore.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-8 text-white shadow-lg shadow-blue-500/30"
                  asChild
                >
                  <Link href="#reserve">
                    Reserve my seat
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 bg-white px-8 text-gray-700 hover:bg-gray-50"
                  asChild
                >
                  <Link href="#curriculum">View the curriculum</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex -space-x-4">
                  {[
                    { initials: "AC", gradient: "from-blue-400 to-blue-500" },
                    { initials: "DR", gradient: "from-blue-500 to-blue-600" },
                    { initials: "MA", gradient: "from-gray-400 to-gray-500" }
                  ].map((member) => (
                    <div
                      key={member.initials}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br ${member.gradient} text-sm font-semibold text-white shadow-md`}
                    >
                      {member.initials}
                    </div>
                  ))}
                </div>
                <p>
                  <span className="font-semibold text-gray-900">227,000+</span> experts have implemented this blueprint
                </p>
              </div>
            </div>

            <Card className="border-gray-200/50 bg-white/80 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Sparkles className="h-5 w-5 text-blue-500" /> Inside this free training
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                {[
                  "Engineer a story-driven hook that attracts your dream audience",
                  "Stack irresistible offers the Expert Secrets way",
                  "Design a follow-up engine that turns curious visitors into high-ticket clients"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Social proof - Apple Style */}
        <section className="border-b border-gray-100 bg-gray-50">
          <div className="container mx-auto px-6 py-12">
            <p className="text-center text-xs uppercase tracking-[0.4em] text-gray-500">
              Trusted by leaders from
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-14 gap-y-6 text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">
              {['foundr', 'clickfunnels', 'impact theory', 'gohighlevel', 'kajabi'].map((brand) => (
                <span key={brand} className="whitespace-nowrap">{brand}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Curriculum preview - Apple Style */}
        <section id="curriculum" className="border-b border-gray-100 bg-white">
          <div className="container mx-auto px-6 py-20">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="bg-blue-50 text-blue-600 border-0">What you&apos;ll master</Badge>
              <h2 className="mt-4 text-3xl font-semibold text-gray-900 md:text-4xl">
                A proven 3-phase roadmap to launch, scale, and amplify your movement
              </h2>
              <p className="mt-4 text-gray-600">
                Walk through messaging foundations, high-converting offer architecture, and launch campaigns designed to create unstoppable momentum.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Phase 1 · Clarify",
                  description: "Craft your origin story, define your attractive character, and structure value ladders that resonate.",
                },
                {
                  title: "Phase 2 · Create",
                  description: "Engineer irresistible offers, stack bonuses, and build a webinar that sells before you ever pitch.",
                },
                {
                  title: "Phase 3 · Convert",
                  description: "Deploy follow-up funnels, automate nurture, and move prospects seamlessly into premium programs.",
                }
              ].map((item) => (
                <Card key={item.title} className="border-gray-200/50 bg-white/80 backdrop-blur-sm shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">{item.description}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials - Apple Style */}
        <section className="border-b border-gray-100 bg-gradient-to-b from-gray-50 via-white to-gray-50">
          <div className="container mx-auto px-6 py-20">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="bg-green-50 text-green-600 border-0">Proof of impact</Badge>
              <h2 className="mt-4 text-3xl font-semibold text-gray-900 md:text-4xl">
                Creators who trusted the framework
              </h2>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  name: "Alex Carter",
                  role: "Sales Coach",
                  quote: "Within 30 days I rebuilt my pitch and closed $180k in new coaching contracts. The storytelling process is gold.",
                },
                {
                  name: "Danielle Rivers",
                  role: "Brand Strategist",
                  quote: "Their funnel blueprint gave me the confidence to launch my first group program and enroll 47 members on day one.",
                },
                {
                  name: "Marcus Allen",
                  role: "Agency Founder",
                  quote: "Expert Secrets always felt abstract. This broke it down into actionable modules and done-for-you templates.",
                }
              ].map((testimonial) => (
                <Card key={testimonial.name} className="border-gray-200/50 bg-white/80 backdrop-blur-sm shadow-sm p-6">
                  <Quote className="h-8 w-8 text-blue-500" />
                  <p className="mt-6 text-sm text-gray-700">{testimonial.quote}</p>
                  <div className="mt-6 text-sm">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-yellow-400">
                    {[...Array(5)].map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Bonus stack - Apple Style */}
        <section className="border-b border-gray-100 bg-white">
          <div className="container mx-auto grid gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <Badge className="bg-blue-50 text-blue-600 border-0">Bonus vault</Badge>
              <h2 className="mt-4 text-3xl font-semibold text-gray-900 md:text-4xl">
                Secure instant access to funnels, scripts, and launch templates
              </h2>
              <p className="mt-4 text-gray-600">
                We condensed years of high-ticket campaigns into plug-and-play assets. Download funnels, story frameworks, and launch calendars so you never stare at a blank page again.
              </p>
            </div>

            <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50 to-white shadow-lg p-8">
              <CardTitle className="text-xl font-semibold text-gray-900">Included bonuses</CardTitle>
              <div className="mt-6 space-y-4 text-sm text-gray-700">
                {[
                  "10-part email follow-up sequence with fill-in-the-blank prompts",
                  "High-converting webinar slide deck and presenter notes",
                  "Launch scorecard to track daily metrics and momentum"
                ].map((bonus) => (
                  <div key={bonus} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                    <span>{bonus}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Final CTA - Apple Style */}
        <section id="reserve" className="relative overflow-hidden border-y border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_55%)]" />
          <div className="container mx-auto flex flex-col items-center gap-6 px-6 py-20 text-center">
            <h2 className="text-3xl font-semibold text-gray-900 md:text-4xl">
              Claim your free seat before enrollment closes
            </h2>
            <p className="max-w-2xl text-base text-gray-600">
              This live experience only happens once per quarter. Get the storytelling, offer creation, and launch frameworks that power the world&apos;s most successful experts.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-10 text-white shadow-lg shadow-blue-500/30">
              Save my spot now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 text-sm text-gray-600 md:flex-row">
          <p>© {new Date().getFullYear()} Expert Launch Lab. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
            <Link href="/support" className="hover:text-blue-600 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
