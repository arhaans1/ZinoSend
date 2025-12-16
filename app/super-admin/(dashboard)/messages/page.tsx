"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Building2, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  direction: string
  type: string
  status: string
  cost: number
  organization: {
    id: string
    name: string
  }
  contact: {
    phone: string
    name: string | null
  }
  createdAt: string
}

interface MessageStats {
  totalMessages: number
  inboundMessages: number
  outboundMessages: number
  totalCost: number
}

const statusColors: Record<string, "default" | "success" | "error" | "warning" | "secondary"> = {
  QUEUED: "secondary",
  SENT: "default",
  DELIVERED: "success",
  READ: "success",
  FAILED: "error",
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [messagesRes, statsRes] = await Promise.all([
          fetch("/api/super-admin/messages?limit=100"),
          fetch("/api/super-admin/message-stats"),
        ])

        const messagesData = await messagesRes.json()
        const statsData = await statsRes.json()

        if (messagesData.success) setMessages(messagesData.data.messages)
        if (statsData.success) setStats(statsData.data)
      } catch (error) {
        console.error("Failed to fetch messages:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Messages</h2>
        <p className="text-gray-400">View all messages across organizations</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Messages</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalMessages.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-400/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Outbound</p>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.outboundMessages.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-400/10 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Inbound</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {stats.inboundMessages.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                  <ArrowDownLeft className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold text-amber-400">
                    ₹{stats.totalCost.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-amber-400/10 flex items-center justify-center">
                  <span className="text-amber-400 font-bold">₹</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Messages
          </CardTitle>
          <CardDescription className="text-gray-400">
            Latest messages across all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableHead className="text-gray-400">Organization</TableHead>
                    <TableHead className="text-gray-400">Contact</TableHead>
                    <TableHead className="text-gray-400">Direction</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Cost</TableHead>
                    <TableHead className="text-gray-400">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-300">{msg.organization.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white">{msg.contact.name || "Unknown"}</p>
                          <p className="text-sm text-gray-500">{msg.contact.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {msg.direction === "OUTBOUND" ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <ArrowUpRight className="h-4 w-4" /> Out
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-cyan-400">
                            <ArrowDownLeft className="h-4 w-4" /> In
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">{msg.type}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[msg.status] || "default"}>
                          {msg.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-amber-400">
                        ₹{msg.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
