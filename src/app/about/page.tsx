"use client";

import { motion } from "framer-motion";
import { Palette, Heart, Eye, Lightbulb, Users, Award, Globe, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/public/public-layout";

const values = [
  {
    icon: Heart,
    title: "Passion-Driven",
    description: "Every course and artwork on AliArts stems from genuine passion for the creative arts.",
  },
  {
    icon: Eye,
    title: "Inclusive Vision",
    description: "We believe art is for everyone. Our platform welcomes creators of all skill levels and backgrounds.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "We blend traditional techniques with modern technology to push creative boundaries.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "Growth happens together. Our community supports, critiques, and celebrates each other.",
  },
];

const skills = [
  { name: "Digital Painting", level: 95 },
  { name: "Illustration", level: 90 },
  { name: "Watercolor", level: 85 },
  { name: "Sculpture", level: 75 },
  { name: "Photography", level: 80 },
  { name: "Mixed Media", level: 70 },
];

const milestones = [
  { year: "2020", title: "The Beginning", description: "AliArts was born from a simple idea: make art education accessible to everyone." },
  { year: "2021", title: "Growing Community", description: "Reached 1,000 community members and launched our first 20 courses." },
  { year: "2022", title: "Artwork Marketplace", description: "Introduced the artwork marketplace, connecting artists with collectors worldwide." },
  { year: "2023", title: "Global Reach", description: "Expanded to serve artists in 50+ countries with multilingual support." },
  { year: "2024", title: "Innovation & Growth", description: "Launched AI-assisted tools and reached 2,500+ active community members." },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
        <div className="absolute top-10 right-20 w-64 h-64 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 py-16 sm:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="mb-4">
                <Palette className="h-3 w-3 mr-1" />
                Our Story
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                About <span className="text-primary">AliArts</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
                Born from a love of art and a belief that creativity lives in everyone,
                AliArts is more than a platform — it&apos;s a movement.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Creator Story */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 via-amber-100/30 to-primary/10 flex items-center justify-center overflow-hidden">
                <div className="text-center p-8">
                  <Palette className="h-20 w-20 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-bold text-primary">AliArts</p>
                  <p className="text-muted-foreground mt-1">Since 2020</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">The Creator&apos;s Journey</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  AliArts began as a personal project — a space where one artist&apos;s passion for teaching
                  could reach beyond the walls of a traditional classroom. What started as a handful of
                  online courses quickly grew into something much bigger.
                </p>
                <p>
                  The realization that countless aspiring artists lacked access to quality instruction,
                  supportive communities, and platforms to showcase their work became the driving force
                  behind building AliArts into what it is today.
                </p>
                <p>
                  Today, AliArts serves thousands of artists and learners across the globe, offering
                  curated courses, a thriving marketplace for original artworks, and a community that
                  celebrates creativity in all its forms.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-2">
              <Sparkles className="h-3 w-3 mr-1" />
              What We Stand For
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Our Mission & Values</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              To democratize art education and create a world where every creative spirit has
              the tools, knowledge, and community to flourish.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full text-center hover:shadow-lg transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills / Expertise */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <Badge variant="secondary" className="mb-2">
                <Award className="h-3 w-3 mr-1" />
                Expertise
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">Skills & Expertise</h2>
              <div className="space-y-5">
                {skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className="text-sm text-muted-foreground">{skill.level}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Badge variant="secondary" className="mb-2">
                <Globe className="h-3 w-3 mr-1" />
                Our Impact
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">By the Numbers</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: "2,500+", label: "Community Members" },
                  { number: "85+", label: "Expert Courses" },
                  { number: "3,200+", label: "Artworks Shared" },
                  { number: "50+", label: "Countries Reached" },
                ].map((stat) => (
                  <Card key={stat.label} className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{stat.number}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline / Milestones */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-2">Our Journey</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Milestones</h2>
          </div>

          <div className="max-w-2xl mx-auto">
            {milestones.map((milestone, i) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-4 mb-8 last:mb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {milestone.year.slice(2)}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <p className="text-sm text-primary font-medium">{milestone.year}</p>
                  <h3 className="font-semibold mt-0.5">{milestone.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
