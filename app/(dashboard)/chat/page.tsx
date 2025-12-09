"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, MessageSquare, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { formatRelativeTime } from "@/lib/utils"
import type { ConversationWithRelations } from "@/types"

async function fetchConversations() {
  const res = await fetch("/api/conversations")
  if (!res.ok) throw new Error("Failed to fetch conversations")
  return res.json()
}

export default function ChatPage() {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const { data } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  })

  const conversations: ConversationWithRelations[] = data?.data || []
  const filteredConversations = conversations.filter(
    (c) =>
      c.contact?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact?.phone.includes(search)
  )

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex h-full gap-4">
        {/* Conversation List */}
        <Card className="w-80 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No conversations yet
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const initials = conv.contact?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "?"

                return (
                  <div
                    key={conv.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedId === conv.id ? "bg-primary-50" : ""
                    }`}
                    onClick={() => setSelectedId(conv.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">
                            {conv.contact?.name || conv.contact?.phone}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {conv.lastMessagePreview || "No messages"}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary-600 text-white text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Chat Window */}
        <Card className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedConversation.contact?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {selectedConversation.contact?.name || selectedConversation.contact?.phone}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.contact?.phone}
                  </p>
                </div>
                {selectedConversation.sessionExpiresAt && (
                  <Badge variant="secondary" className="ml-auto">
                    Session: {new Date(selectedConversation.sessionExpiresAt) > new Date() ? "Active" : "Expired"}
                  </Badge>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <p className="text-center text-gray-500 text-sm">
                  Messages will appear here
                </p>
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        // Send message
                      }
                    }}
                  />
                  <Button>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation from the list to start chatting"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
