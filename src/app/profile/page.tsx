"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Camera, Save, Mail, AtSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/public/public-layout";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    username: "",
    bio: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        username: "",
        bio: "",
        email: session.user.email || "",
      });
    }
  }, [session, status, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, this would update the user profile via API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({ title: "Profile updated successfully!" });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-32 w-32 bg-muted rounded-full mx-auto" />
            <div className="h-8 w-48 bg-muted rounded mx-auto" />
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="h-12 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!session) return null;

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24">
                <AvatarImage src={session.user?.image || ""} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {session.user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <h1 className="text-2xl font-bold mt-4">{session.user?.name || "User"}</h1>
            <p className="text-muted-foreground">{session.user?.email}</p>
            <Badge variant="secondary" className="mt-2">
              {session.user?.role || "USER"}
            </Badge>
          </div>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    className="pl-10"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="pl-10"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="pl-10 min-h-[100px] resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">Last changed: Unknown</p>
                </div>
                <Button variant="outline" size="sm">Change Password</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Danger Zone</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account</p>
                </div>
                <Button variant="destructive" size="sm">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
