"use client"

import { useState } from "react"
import { Settings, Key, Bell, Shield, Database } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast({
        title: "Settings saved",
        description: "Your settings have been updated",
        variant: "success",
      })
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400">Platform configuration and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* API Configuration */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-400" />
              API Configuration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure third-party API integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">GupShup API Key</Label>
              <Input
                type="password"
                placeholder="••••••••••••••••"
                className="bg-gray-700 border-gray-600 text-white"
                defaultValue="configured"
                disabled
              />
              <p className="text-xs text-gray-500">
                Configure in Vercel environment variables as GUPSHUP_API_KEY
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">GupShup Partner Secret</Label>
              <Input
                type="password"
                placeholder="••••••••••••••••"
                className="bg-gray-700 border-gray-600 text-white"
                defaultValue="configured"
                disabled
              />
              <p className="text-xs text-gray-500">
                Configure in Vercel environment variables as GUPSHUP_PARTNER_SECRET
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Razorpay Key ID</Label>
              <Input
                type="password"
                placeholder="••••••••••••••••"
                className="bg-gray-700 border-gray-600 text-white"
                defaultValue="configured"
                disabled
              />
              <p className="text-xs text-gray-500">
                Configure in Vercel environment variables as RAZORPAY_KEY_ID
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-400" />
              Notifications
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">New Organization Alerts</Label>
                <p className="text-xs text-gray-500">Get notified when a new organization signs up</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Low Balance Alerts</Label>
                <p className="text-xs text-gray-500">Get notified when an organization's balance is low</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">High Volume Alerts</Label>
                <p className="text-xs text-gray-500">Get notified for unusual message volume</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              Security
            </CardTitle>
            <CardDescription className="text-gray-400">
              Security settings and access control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Two-Factor Authentication</Label>
                <p className="text-xs text-gray-500">Require 2FA for super admin login</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Session Timeout</Label>
                <p className="text-xs text-gray-500">Auto-logout after inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Platform Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-400" />
              Platform Information
            </CardTitle>
            <CardDescription className="text-gray-400">
              System information and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500 text-xs">Version</Label>
                <p className="text-white">1.0.0</p>
              </div>
              <div>
                <Label className="text-gray-500 text-xs">Environment</Label>
                <p className="text-white">Production</p>
              </div>
              <div>
                <Label className="text-gray-500 text-xs">Database</Label>
                <p className="text-green-400">Connected</p>
              </div>
              <div>
                <Label className="text-gray-500 text-xs">API Status</Label>
                <p className="text-green-400">Operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
