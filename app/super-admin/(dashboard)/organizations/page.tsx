"use client"

import { useEffect, useState } from "react"
import { Search, Building2, Users, MessageSquare, Contact2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"

interface Organization {
  id: string
  name: string
  slug: string
  subscriptionPlan: string
  walletBalance: number
  owner: { name: string; email: string } | null
  stats: {
    users: number
    contacts: number
    messages: number
    broadcasts: number
  }
  totalTopUps: number
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const planColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
  FREE: "secondary",
  STARTER: "default",
  GROWTH: "success",
  ENTERPRISE: "warning",
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchOrganizations = async (currentPage: number, searchQuery: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        search: searchQuery,
      })
      const res = await fetch(`/api/super-admin/organizations?${params}`)
      const data = await res.json()
      if (data.success) {
        setOrganizations(data.data.organizations)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations(page, search)
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrganizations(1, search)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Organizations</h2>
        <p className="text-gray-400">Manage all registered organizations</p>
      </div>

      {/* Search */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Organizations
          </CardTitle>
          <CardDescription className="text-gray-400">
            {pagination ? `Showing ${organizations.length} of ${pagination.total} organizations` : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-700/50">
                      <TableHead className="text-gray-400">Organization</TableHead>
                      <TableHead className="text-gray-400">Owner</TableHead>
                      <TableHead className="text-gray-400">Plan</TableHead>
                      <TableHead className="text-gray-400 text-center">
                        <Users className="h-4 w-4 inline mr-1" />
                        Users
                      </TableHead>
                      <TableHead className="text-gray-400 text-center">
                        <Contact2 className="h-4 w-4 inline mr-1" />
                        Contacts
                      </TableHead>
                      <TableHead className="text-gray-400 text-center">
                        <MessageSquare className="h-4 w-4 inline mr-1" />
                        Messages
                      </TableHead>
                      <TableHead className="text-gray-400 text-right">Top-ups</TableHead>
                      <TableHead className="text-gray-400 text-right">Balance</TableHead>
                      <TableHead className="text-gray-400">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow
                        key={org.id}
                        className="border-gray-700 hover:bg-gray-700/50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{org.name}</p>
                            <p className="text-sm text-gray-500">{org.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {org.owner ? (
                            <div>
                              <p className="text-sm text-white">{org.owner.name}</p>
                              <p className="text-xs text-gray-500">{org.owner.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={planColors[org.subscriptionPlan] || "default"}>
                            {org.subscriptionPlan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-white">
                          {org.stats.users}
                        </TableCell>
                        <TableCell className="text-center text-white">
                          {org.stats.contacts.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center text-white">
                          {org.stats.messages.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-amber-400">
                          ₹{org.totalTopUps.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-green-400">
                          ₹{org.walletBalance.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.totalPages}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
