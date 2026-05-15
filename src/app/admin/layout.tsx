"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  GraduationCap,
  Palette,
  Users,
  ShoppingCart,
  UserCheck,
  MessageSquare,
  Shield,
  Image,
  ImagePlus,
  Megaphone,
  Ticket,
  FolderTree,
  Tag,
  Flag,
  Settings,
  ScrollText,
  LogOut,
  Bell,
  PanelLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navSections = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Courses", href: "/admin/courses", icon: GraduationCap },
      { title: "Artworks", href: "/admin/artworks", icon: Palette },
    ],
  },
  {
    label: "Commerce",
    items: [
      { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { title: "Enrollments", href: "/admin/enrollments", icon: UserCheck },
      { title: "Coupons", href: "/admin/coupons", icon: Ticket },
    ],
  },
  {
    label: "Community",
    items: [
      { title: "Community", href: "/admin/moderation", icon: MessageSquare },
      { title: "Moderation", href: "/admin/moderation", icon: Shield },
    ],
  },
  {
    label: "Media & Display",
    items: [
      { title: "Media", href: "/admin/media", icon: Image },
      { title: "Banners", href: "/admin/banners", icon: ImagePlus },
      { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Categories", href: "/admin/categories", icon: FolderTree },
      { title: "Tags", href: "/admin/tags", icon: Tag },
    ],
  },
  {
    label: "Users & Safety",
    items: [
      { title: "Users", href: "/admin/users", icon: Users },
      { title: "Reports", href: "/admin/reports", icon: Flag },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/admin/settings", icon: Settings },
      { title: "Audit Logs", href: "/admin/logs", icon: ScrollText },
    ],
  },
];

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            A
          </div>
          <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">
            AliArts
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.title + item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Site">
              <Link href="/">
                <PanelLeft className="h-4 w-4" />
                <span>Back to Site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function AdminTopBar() {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "A";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1" />
      <Button variant="ghost" size="icon" className="relative" asChild>
        <Link href="/notifications">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
            3
          </Badge>
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm font-medium">
              {session?.user?.name || "Admin"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm">{session?.user?.name || "Admin"}</span>
              <span className="text-xs text-muted-foreground">
                {session?.user?.email}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <Users className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminTopBar />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
