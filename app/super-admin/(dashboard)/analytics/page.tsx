"use client"

import { BarChart3, TrendingUp, Users, MessageSquare, Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-400">Platform-wide analytics and insights</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Growth Overview
            </CardTitle>
            <CardDescription className="text-gray-400">
              Platform growth metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Detailed analytics charts coming soon</p>
              <p className="text-sm mt-2">View the Dashboard for current stats</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              User Activity
            </CardTitle>
            <CardDescription className="text-gray-400">
              User engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>User activity tracking coming soon</p>
              <p className="text-sm mt-2">View the Users page for user list</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
              Message Analytics
            </CardTitle>
            <CardDescription className="text-gray-400">
              Message delivery and engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Message analytics coming soon</p>
              <p className="text-sm mt-2">View the Messages page for message list</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-400" />
              Organization Performance
            </CardTitle>
            <CardDescription className="text-gray-400">
              Per-organization metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Organization analytics coming soon</p>
              <p className="text-sm mt-2">View the Organizations page for details</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
