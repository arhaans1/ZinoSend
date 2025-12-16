"use client"

import { useEffect, useState } from "react"
import { Search, Users, Plus, Building2, Mail } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  name: string
  email: string
  role: string
  organization: {
    id: string
    name: string
  }
  lastLoginAt: string | null
  createdAt: string
}

interface Organization {
  id: string
  name: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const roleColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
  OWNER: "warning",
  ADMIN: "success",
  AGENT: "default",
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "AGENT",
    organizationId: "",
  })

  const fetchUsers = async (currentPage: number, searchQuery: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        search: searchQuery,
      })
      const res = await fetch(`/api/super-admin/users?${params}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.data.users)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/super-admin/organizations?limit=100")
      const data = await res.json()
      if (data.success) {
        setOrganizations(data.data.organizations)
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    }
  }

  useEffect(() => {
    fetchUsers(page, search)
    fetchOrganizations()
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers(1, search)
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.organizationId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "error",
      })
      return
    }

    setAddingUser(true)
    try {
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })
      const data = await res.json()

      if (data.success) {
        toast({
          title: "User created",
          description: `User ${newUser.email} has been created successfully`,
          variant: "success",
        })
        setAddDialogOpen(false)
        setNewUser({ name: "", email: "", password: "", role: "AGENT", organizationId: "" })
        fetchUsers(page, search)
      } else {
        toast({
          title: "Error",
          description: data.error?.message || "Failed to create user",
          variant: "error",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "error",
      })
    } finally {
      setAddingUser(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">All Users</h2>
          <p className="text-gray-400">Manage users across all organizations</p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
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

      {/* Users Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription className="text-gray-400">
            {pagination ? `Showing ${users.length} of ${pagination.total} users` : "Loading..."}
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
                      <TableHead className="text-gray-400">User</TableHead>
                      <TableHead className="text-gray-400">Organization</TableHead>
                      <TableHead className="text-gray-400">Role</TableHead>
                      <TableHead className="text-gray-400">Last Login</TableHead>
                      <TableHead className="text-gray-400">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-gray-700 hover:bg-gray-700/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-300">{user.organization.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleColors[user.role] || "default"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {user.lastLoginAt
                            ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
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

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new user for an organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Organization</Label>
              <Select
                value={newUser.organizationId}
                onValueChange={(value) => setNewUser({ ...newUser, organizationId: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="text-white">
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Full Name</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="OWNER" className="text-white">Owner</SelectItem>
                  <SelectItem value="ADMIN" className="text-white">Admin</SelectItem>
                  <SelectItem value="AGENT" className="text-white">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={addingUser}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {addingUser ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
