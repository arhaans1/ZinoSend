"use client"

import { useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { contactSchema, type ContactInput } from "@/lib/validators"
import { useToast } from "@/hooks/use-toast"
import type { Contact } from "@/types"

interface ContactFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact | null
}

async function createContact(data: ContactInput) {
  const res = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || "Failed to create contact")
  }
  return res.json()
}

async function updateContact(id: string, data: ContactInput) {
  const res = await fetch(`/api/contacts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || "Failed to update contact")
  }
  return res.json()
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
}: ContactFormDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = !!contact

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      phone: "",
      name: "",
      email: "",
      tags: [],
      optedIn: true,
    },
  })

  useEffect(() => {
    if (contact) {
      let parsedTags: string[] = []
      try {
        parsedTags = typeof contact.tags === 'string' ? JSON.parse(contact.tags) : (contact.tags || [])
      } catch {
        parsedTags = []
      }
      reset({
        phone: contact.phone,
        name: contact.name || "",
        email: contact.email || "",
        tags: parsedTags,
        optedIn: contact.optedIn,
      })
    } else {
      reset({
        phone: "",
        name: "",
        email: "",
        tags: [],
        optedIn: true,
      })
    }
  }, [contact, reset])

  const mutation = useMutation({
    mutationFn: (data: ContactInput) =>
      isEditing ? updateContact(contact.id, data) : createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      toast({
        title: isEditing ? "Contact updated" : "Contact created",
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

  const onSubmit = (data: ContactInput) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the contact information below"
              : "Add a new contact to your list"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              placeholder="+919876543210"
              {...register("phone")}
              disabled={isEditing}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="optedIn" {...register("optedIn")} defaultChecked />
            <label htmlFor="optedIn" className="text-sm text-gray-600">
              Contact has opted in to receive messages
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving..."
                : isEditing
                ? "Update"
                : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
