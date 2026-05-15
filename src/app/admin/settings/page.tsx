"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Globe,
  Share2,
  CreditCard,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface SettingsMap {
  general?: Record<string, string>;
  seo?: Record<string, string>;
  social?: Record<string, string>;
  payment?: Record<string, string>;
  public?: Record<string, string>;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState({ siteName: "", siteDescription: "", siteUrl: "" });
  const [seo, setSeo] = useState({ metaTitle: "", metaDescription: "", metaKeywords: "" });
  const [social, setSocial] = useState({ twitter: "", instagram: "", youtube: "", facebook: "" });
  const [payment, setPayment] = useState({ currency: "USD" });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/v1/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const s = data.data;
            setSettings(s);
            if (s.general) {
              setGeneral({
                siteName: s.general.siteName || "",
                siteDescription: s.general.siteDescription || "",
                siteUrl: s.general.siteUrl || "",
              });
            }
            if (s.seo) {
              setSeo({
                metaTitle: s.seo.metaTitle || "",
                metaDescription: s.seo.metaDescription || "",
                metaKeywords: s.seo.metaKeywords || "",
              });
            }
            if (s.social) {
              setSocial({
                twitter: s.social.twitter || "",
                instagram: s.social.instagram || "",
                youtube: s.social.youtube || "",
                facebook: s.social.facebook || "",
              });
            }
            if (s.payment) {
              setPayment({ currency: s.payment.currency || "USD" });
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave(group: string, values: Record<string, string>) {
    setSaving(true);
    try {
      const settingsArr = Object.entries(values)
        .filter(([_, v]) => v !== undefined)
        .map(([key, value]) => ({ key, value, group }));

      const res = await fetch("/api/v1/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsArr }),
      });

      if (res.ok) {
        toast({ title: "Settings saved", description: `${group} settings have been updated.` });
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <Skeleton className="h-10 w-96" />
        <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your platform settings</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic site configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" value={general.siteName} onChange={(e) => setGeneral({ ...general, siteName: e.target.value })} placeholder="AliArts" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea id="siteDescription" value={general.siteDescription} onChange={(e) => setGeneral({ ...general, siteDescription: e.target.value })} placeholder="A platform for art lovers" rows={3} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input id="siteUrl" value={general.siteUrl} onChange={(e) => setGeneral({ ...general, siteUrl: e.target.value })} placeholder="https://aliarts.com" />
              </div>
              <Separator />
              <Button onClick={() => handleSave("general", general)} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Search engine optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input id="metaTitle" value={seo.metaTitle} onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })} placeholder="AliArts - Online Art Platform" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea id="metaDescription" value={seo.metaDescription} onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })} placeholder="Discover and learn art..." rows={3} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input id="metaKeywords" value={seo.metaKeywords} onChange={(e) => setSeo({ ...seo, metaKeywords: e.target.value })} placeholder="art, courses, paintings, drawings" />
                <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
              </div>
              <Separator />
              <Button onClick={() => handleSave("seo", seo)} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save SEO Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social */}
        <TabsContent value="social" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Connect your social media accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="twitter">Twitter / X URL</Label>
                <Input id="twitter" value={social.twitter} onChange={(e) => setSocial({ ...social, twitter: e.target.value })} placeholder="https://twitter.com/aliarts" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input id="instagram" value={social.instagram} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} placeholder="https://instagram.com/aliarts" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input id="youtube" value={social.youtube} onChange={(e) => setSocial({ ...social, youtube: e.target.value })} placeholder="https://youtube.com/@aliarts" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input id="facebook" value={social.facebook} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} placeholder="https://facebook.com/aliarts" />
              </div>
              <Separator />
              <Button onClick={() => handleSave("social", social)} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Social Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment */}
        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value={payment.currency} onChange={(e) => setPayment({ ...payment, currency: e.target.value })} placeholder="USD" />
                <p className="text-xs text-muted-foreground">ISO 4217 currency code (e.g., USD, EUR, GBP)</p>
              </div>
              <Separator />
              <Button onClick={() => handleSave("payment", payment)} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
