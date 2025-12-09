"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { TemplateCard } from "@/components/templates/template-card"
import { TemplateFormDialog } from "@/components/templates/template-form-dialog"
import type { Template } from "@/types"

async function fetchTemplates(status?: string) {
  const params = new URLSearchParams()
  if (status && status !== "all") {
    params.set("status", status)
  }
  const res = await fetch(`/api/templates?${params}`)
  if (!res.ok) throw new Error("Failed to fetch templates")
  return res.json()
}

export default function TemplatesPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["templates", statusFilter],
    queryFn: () => fetchTemplates(statusFilter),
  })

  const templates: Template[] = data?.data || []
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.body.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-500">Create and manage WhatsApp message templates</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
                <TabsTrigger value="DRAFT">Draft</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates yet"
          description="Create your first template to start sending WhatsApp messages"
          action={{
            label: "Create Template",
            onClick: () => setFormOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <TemplateFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingTemplate(null)
        }}
        template={editingTemplate}
      />
    </div>
  )
}
