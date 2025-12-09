"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TemplatePreview } from "./template-preview"
import { templateSchema, type TemplateInput } from "@/lib/validators"
import { useToast } from "@/hooks/use-toast"
import type { Template } from "@/types"

interface TemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: Template | null
}

async function createTemplate(data: TemplateInput) {
  const res = await fetch("/api/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || "Failed to create template")
  }
  return res.json()
}

async function updateTemplate(id: string, data: TemplateInput) {
  const res = await fetch(`/api/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || "Failed to update template")
  }
  return res.json()
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
}: TemplateFormDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = !!template
  const [step, setStep] = useState(1)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TemplateInput>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      templateName: "",
      category: "MARKETING",
      language: "en",
      body: "",
      footer: "",
    },
  })

  const watchedValues = watch()

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        templateName: template.templateName,
        category: template.category,
        language: template.language,
        headerType: template.headerType || undefined,
        headerContent: template.headerContent || "",
        body: template.body,
        footer: template.footer || "",
      })
    } else {
      reset({
        name: "",
        templateName: "",
        category: "MARKETING",
        language: "en",
        body: "",
        footer: "",
      })
    }
    setStep(1)
  }, [template, reset])

  const mutation = useMutation({
    mutationFn: (data: TemplateInput) =>
      isEditing ? updateTemplate(template.id, data) : createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      toast({
        title: isEditing ? "Template updated" : "Template created",
        variant: "success",
      })
      onOpenChange(false)
      reset()
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "error",
      })
    },
  })

  const onSubmit = (data: TemplateInput) => {
    mutation.mutate(data)
  }

  const insertVariable = (varNum: number) => {
    const currentBody = watchedValues.body || ""
    setValue("body", currentBody + `{{${varNum}}}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Enter template details"
              : step === 2
              ? "Compose your message"
              : "Preview and submit"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name (Internal)</Label>
                  <Input
                    id="name"
                    placeholder="Welcome Message"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name (Meta)</Label>
                  <Input
                    id="templateName"
                    placeholder="welcome_message"
                    {...register("templateName")}
                    disabled={isEditing && template?.status !== "DRAFT"}
                  />
                  <p className="text-xs text-gray-500">
                    Lowercase with underscores only
                  </p>
                  {errors.templateName && (
                    <p className="text-sm text-red-500">
                      {errors.templateName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={watchedValues.category}
                    onValueChange={(v) => setValue("category", v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="AUTHENTICATION">
                        Authentication
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={watchedValues.language}
                    onValueChange={(v) => setValue("language", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Header (Optional)</Label>
                <Select
                  value={watchedValues.headerType || ""}
                  onValueChange={(v) =>
                    setValue("headerType", v as any || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No header" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No header</SelectItem>
                    <SelectItem value="TEXT">Text</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                  </SelectContent>
                </Select>
                {watchedValues.headerType && (
                  <Input
                    placeholder={
                      watchedValues.headerType === "TEXT"
                        ? "Header text"
                        : "Media URL"
                    }
                    {...register("headerContent")}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Message Body *</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(n)}
                      >
                        {`{{${n}}}`}
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  id="body"
                  placeholder="Hello {{1}}, thank you for choosing us!"
                  rows={5}
                  {...register("body")}
                />
                <p className="text-xs text-gray-500">
                  Use {`{{1}}`}, {`{{2}}`}, etc. for dynamic variables
                </p>
                {errors.body && (
                  <p className="text-sm text-red-500">{errors.body.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer">Footer (Optional)</Label>
                <Input
                  id="footer"
                  placeholder="Reply STOP to opt out"
                  {...register("footer")}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-4">
              <TemplatePreview
                headerType={watchedValues.headerType}
                headerContent={watchedValues.headerContent}
                body={watchedValues.body}
                footer={watchedValues.footer}
              />
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2 w-full">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={() => setStep(step + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending
                    ? "Saving..."
                    : isEditing
                    ? "Update Template"
                    : "Create Template"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
