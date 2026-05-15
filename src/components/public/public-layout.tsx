"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Menu,
  X,
  Bell,
  LogOut,
  User,
  LayoutDashboard,
  Sun,
  Moon,
  Heart,
  Instagram,
  Twitter,
  Youtube,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/artworks", label: "Artworks" },
  { href: "/community", label: "Community" },
  { href: "/about", label: "About" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (session) {
      fetch("/api/v1/notifications?limit=1&unreadOnly=true")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setUnreadCount(data.data.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [session]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-lg border-b shadow-sm"
            : "bg-background/50 backdrop-blur-sm border-b border-border/50"
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Palette className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Ali<span className="text-primary">Arts</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />

            {session ? (
              <>
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-0">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 px-2 gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={session.user?.image || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {session.user?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden lg:inline">
                        {session.user?.name || "User"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/notifications">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                        {unreadCount > 0 && (
                          <Badge className="ml-auto h-5 px-1.5 text-[10px] bg-red-500 text-white border-0">
                            {unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            {session && (
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-0">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="flex items-center gap-2 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <Palette className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-xl">
                    Ali<span className="text-primary">Arts</span>
                  </span>
                </SheetTitle>

                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                          isActive(link.href)
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <div className="mt-6 pt-6 border-t">
                  {session ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={session.user?.image || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {session.user?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{session.user?.name || "User"}</p>
                          <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                        </div>
                      </div>
                      <SheetClose asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent">
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent">
                          <User className="h-4 w-4" /> Profile
                        </Link>
                      </SheetClose>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-accent w-full"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <SheetClose asChild>
                        <Link href="/login" className="block">
                          <Button variant="outline" className="w-full">Log In</Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/signup" className="block">
                          <Button className="w-full">Sign Up</Button>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">
                  Ali<span className="text-primary">Arts</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Unleash your creative potential. Discover courses, explore stunning artworks,
                and join a vibrant community of artists and learners.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Youtube className="h-4 w-4" />
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2">
                {["Painting", "Digital Art", "Sculpture", "Photography", "Illustration", "Mixed Media"].map((cat) => (
                  <li key={cat}>
                    <Link href={`/artworks?category=${cat}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                {["Help Center", "Privacy Policy", "Terms of Service", "Contact Us", "FAQ"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} AliArts. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made with <Heart className="h-3 w-3 inline text-red-500 fill-red-500" /> for artists everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
