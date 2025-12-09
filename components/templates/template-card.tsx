"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit, Trash2, MoreHorizontal, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { truncate } from "@/lib/utils"
import type { Template } from "@/types"
import { useState } from "react"

interface TemplateCardProps {
  template: Template
  onEdit: (template: Template) => void
}

async function deleteTemplate(id: string) {
  const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete template")
  return res.json()
}

const statusColors = {
  DRAFT: "secondary",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
} as const

const categoryLabels = {
  MARKETING: "Marketing",
  UTILITY: "Utility",
  AUTHENTICATION: "Authentication",
} as const

export function TemplateCard({ template, onEdit }: TemplateCardProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      toast({ title: "Template deleted", variant: "success" })
      setDeleteDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "error" })
    },
  })

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{template.name}</CardTitle>
              <div className="flex gap-2">
                <Badge variant={statusColors[template.status]}>
                  {template.status}
                </Badge>
                <Badge variant="outline">{categoryLabels[template.category]}</Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(template.body)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy body
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {truncate(template.body, 150)}
          </p>
          {template.rejectionReason && (
            <p className="text-xs text-red-500 mt-2">
              Rejection reason: {template.rejectionReason}
            </p>
          )}
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
            <span>Language: {template.language.toUpperCase()}</span>
            <span>Used {template.timesUsed} times</span>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Template"
        description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate(template.id)}
        loading={deleteMutation.isPending}
      />
    </>
  )
}
