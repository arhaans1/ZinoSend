"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Upload, Search, MoreHorizontal, Trash2, Edit, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { Pagination } from "@/components/shared/pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog"
import { ImportDialog } from "@/components/contacts/import-dialog"
import { useToast } from "@/hooks/use-toast"
import { formatPhone, formatDate } from "@/lib/utils"
import type { Contact } from "@/types"

// Helper to parse tags JSON string
const parseTags = (tags: string): string[] => {
  try {
    return JSON.parse(tags) || []
  } catch {
    return []
  }
}

async function fetchContacts(page: number, search: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
  })
  const res = await fetch(`/api/contacts?${params}`)
  if (!res.ok) throw new Error("Failed to fetch contacts")
  return res.json()
}

async function deleteContact(id: string) {
  const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete contact")
  return res.json()
}

export default function ContactsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", page, search],
    queryFn: () => fetchContacts(page, search),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      toast({ title: "Contact deleted", variant: "success" })
      setDeleteDialogOpen(false)
      setDeletingContact(null)
    },
    onError: () => {
      toast({ title: "Failed to delete contact", variant: "error" })
    },
  })

  const contacts: Contact[] = data?.data || []
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? contacts.map((c: Contact) => c.id) : [])
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev: string[]) =>
      checked ? [...prev, id] : prev.filter((i: string) => i !== id)
    )
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setContactFormOpen(true)
  }

  const handleDelete = (contact: Contact) => {
    setDeletingContact(contact)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500">Manage your WhatsApp contacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => setContactFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg">
          <span className="text-sm text-primary-700">
            {selectedIds.length} contact(s) selected
          </span>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
            Clear selection
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete selected
          </Button>
        </div>
      )}

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : contacts.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No contacts yet"
              description="Add your first contact to start sending WhatsApp messages"
              action={{
                label: "Add Contact",
                onClick: () => setContactFormOpen(true),
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        contacts.length > 0 &&
                        selectedIds.length === contacts.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact: Contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(contact.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(contact.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {contact.name || "-"}
                    </TableCell>
                    <TableCell>{formatPhone(contact.phone)}</TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {parseTags(contact.tags).slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                        {parseTags(contact.tags).length > 3 && (
                          <Badge variant="secondary">
                            +{parseTags(contact.tags).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{contact.source}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(contact.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(contact)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(contact)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Dialogs */}
      <ContactFormDialog
        open={contactFormOpen}
        onOpenChange={(open) => {
          setContactFormOpen(open)
          if (!open) setEditingContact(null)
        }}
        contact={editingContact}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contact"
        description={`Are you sure you want to delete ${deletingContact?.name || deletingContact?.phone}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deletingContact && deleteMutation.mutate(deletingContact.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
