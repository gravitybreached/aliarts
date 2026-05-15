"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Palette,
  Users,
  Sparkles,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Quote,
  Mail,
  Star,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PublicLayout } from "@/components/public/public-layout";
import { CourseCard } from "@/components/public/course-card";
import { ArtworkCard } from "@/components/public/artwork-card";
import { PostCard } from "@/components/public/post-card";
import {
  CourseCardSkeleton,
  ArtworkCardSkeleton,
  BannerSkeleton,
} from "@/components/public/loading-skeleton";

// Fetch helpers
async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

// Animated counter component
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-3xl sm:text-4xl font-bold text-primary">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

// Banner carousel
function BannerCarousel() {
  const { data, isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: () => fetchJSON("/api/v1/banners"),
  });

  const [current, setCurrent] = useState(0);
  const banners = data?.data || [];

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (isLoading) return <BannerSkeleton />;
  if (banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <motion.div
        className="flex"
        animate={{ x: `-${current * 100}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {banners.map((banner: any) => (
          <div
            key={banner.id}
            className="w-full flex-shrink-0 relative aspect-[21/9] sm:aspect-[3/1]"
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center p-6 sm:p-10">
              <div className="max-w-lg">
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-sm sm:text-base text-white/80 mb-4">
                    {banner.subtitle}
                  </p>
                )}
                {banner.link && (
                  <Link href={banner.link}>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      {banner.linkText || "Learn More"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
            onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
            onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Featured courses section
function FeaturedCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-courses"],
    queryFn: () => fetchJSON("/api/v1/courses?featured=true&limit=6"),
  });

  const courses = data?.data?.items || [];

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge variant="secondary" className="mb-2">
              <BookOpen className="h-3 w-3 mr-1" />
              Featured Courses
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Learn from the Best</h2>
            <p className="text-muted-foreground mt-1">
              Handpicked courses to kickstart your creative journey
            </p>
          </div>
          <Link href="/courses" className="hidden sm:flex">
            <Button variant="outline">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No courses yet</h3>
            <p className="text-muted-foreground">Check back soon for exciting new courses!</p>
          </Card>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link href="/courses">
            <Button variant="outline">
              View All Courses <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Featured artworks section
function FeaturedArtworks() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-artworks"],
    queryFn: () => fetchJSON("/api/v1/artworks?featured=true&limit=8"),
  });

  const artworks = data?.data?.items || [];

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge variant="secondary" className="mb-2">
              <Palette className="h-3 w-3 mr-1" />
              Featured Artworks
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Discover Stunning Art</h2>
            <p className="text-muted-foreground mt-1">
              Explore curated works from talented artists worldwide
            </p>
          </div>
          <Link href="/artworks" className="hidden sm:flex">
            <Button variant="outline">
              Explore <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="masonry-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArtworkCardSkeleton key={i} />
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <div className="masonry-grid">
            {artworks.map((artwork: any) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No artworks yet</h3>
            <p className="text-muted-foreground">Amazing artworks are on their way!</p>
          </Card>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link href="/artworks">
            <Button variant="outline">
              Explore Artworks <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Community stats
function CommunityStats() {
  const stats = [
    { icon: Users, label: "Community Members", value: 2500, suffix: "+" },
    { icon: BookOpen, label: "Courses Available", value: 85, suffix: "+" },
    { icon: Palette, label: "Artworks Shared", value: 3200, suffix: "+" },
    { icon: Sparkles, label: "Creative Challenges", value: 120, suffix: "+" },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-2">
            <Users className="h-3 w-3 mr-1" />
            Community
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">Join a Thriving Community</h2>
          <p className="text-muted-foreground mt-1">Connect, create, and grow together</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Announcements
function Announcements() {
  const { data, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => fetchJSON("/api/v1/announcements"),
  });

  const announcements = data?.data || [];

  if (isLoading || announcements.length === 0) return null;

  const typeIcons: Record<string, string> = {
    INFO: "📢",
    SUCCESS: "✅",
    WARNING: "⚠️",
    ERROR: "❌",
    ENROLLMENT: "🎓",
    ORDER: "🛒",
    COMMENT: "💬",
    LIKE: "❤️",
  };

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-2">
            <Megaphone className="h-3 w-3 mr-1" />
            Latest News
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">Announcements</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.slice(0, 3).map((item: any) => (
            <motion.div key={item.id} whileHover={{ y: -2 }}>
              <Card className="p-5 hover:shadow-md transition-shadow h-full">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{typeIcons[item.type] || "📢"}</span>
                  <div className="min-w-0">
                    {item.pinned && (
                      <Badge variant="secondary" className="mb-1 text-xs">Pinned</Badge>
                    )}
                    <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {item.content}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials
function Testimonials() {
  const testimonials = [
    {
      quote: "AliArts transformed my artistic journey. The courses are insightful and the community is incredibly supportive.",
      name: "Sarah Chen",
      role: "Digital Artist",
      avatar: null,
    },
    {
      quote: "I found my style through the challenges here. The feedback from fellow artists helped me grow in ways I never imagined.",
      name: "Marcus Rivera",
      role: "Illustrator",
      avatar: null,
    },
    {
      quote: "The variety of courses and the quality of instruction is outstanding. Best investment in my creative education.",
      name: "Aisha Patel",
      role: "Painter",
      avatar: null,
    },
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-2">
            <Quote className="h-3 w-3 mr-1" />
            Testimonials
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">What Our Community Says</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-sm leading-relaxed mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {t.name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Newsletter signup
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary),0.1),transparent_70%)]" />
          <div className="relative">
            <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Stay Inspired</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Get weekly creative inspiration, new course announcements, and community highlights
              delivered to your inbox.
            </p>
            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400"
              >
                <Star className="h-5 w-5 fill-current" />
                <span className="font-medium">You&apos;re subscribed! Check your inbox.</span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit">Subscribe</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Latest community posts
function LatestPosts() {
  const { data, isLoading } = useQuery({
    queryKey: ["latest-posts"],
    queryFn: () => fetchJSON("/api/v1/posts?limit=3"),
  });

  const posts = data?.data?.items || [];
  if (isLoading || posts.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge variant="secondary" className="mb-2">
              <Users className="h-3 w-3 mr-1" />
              Community
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">Latest Discussions</h2>
            <p className="text-muted-foreground mt-1">See what the community is talking about</p>
          </div>
          <Link href="/community" className="hidden sm:flex">
            <Button variant="outline">
              Join Community <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/community">
            <Button variant="outline">
              Join Community <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Main Homepage
export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                Welcome to AliArts
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Unleash Your{" "}
                <span className="text-primary bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
                  Creative Potential
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
                Discover courses taught by master artists, explore breathtaking artworks,
                and join a vibrant community where creativity knows no bounds.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
            >
              <Link href="/courses">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Browse Courses
                </Button>
              </Link>
              <Link href="/artworks">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                  <Palette className="mr-2 h-5 w-5" />
                  Explore Artworks
                </Button>
              </Link>
            </motion.div>

            {/* Quick stats under hero */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Play className="h-4 w-4 text-primary" />
                85+ Courses
              </span>
              <span className="flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-primary" />
                3200+ Artworks
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                2500+ Members
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Banner Carousel */}
      <section className="container mx-auto px-4 -mt-4 mb-4">
        <BannerCarousel />
      </section>

      {/* Featured Courses */}
      <FeaturedCourses />

      {/* Featured Artworks */}
      <FeaturedArtworks />

      {/* Community Stats */}
      <CommunityStats />

      {/* Latest Posts */}
      <LatestPosts />

      {/* Announcements */}
      <Announcements />

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter */}
      <NewsletterSection />
    </PublicLayout>
  );
}
