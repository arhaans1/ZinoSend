"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Send, ArrowLeft, ArrowRight, Check, Users, FileText, Settings, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TemplatePreview } from "@/components/templates/template-preview"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Template, Contact } from "@/types"

async function fetchTemplates() {
  const res = await fetch("/api/templates?status=APPROVED")
  if (!res.ok) throw new Error("Failed to fetch templates")
  return res.json()
}

async function fetchContacts() {
  const res = await fetch("/api/contacts?limit=1000")
  if (!res.ok) throw new Error("Failed to fetch contacts")
  return res.json()
}

async function createBroadcast(data: any) {
  const res = await fetch("/api/broadcasts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || "Failed to create broadcast")
  }
  return res.json()
}

const steps = [
  { id: 1, name: "Recipients", icon: Users },
  { id: 2, name: "Template", icon: FileText },
  { id: 3, name: "Variables", icon: Settings },
  { id: 4, name: "Review", icon: Eye },
]

export default function BroadcastPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [campaignName, setCampaignName] = useState("")
  const [recipientType, setRecipientType] = useState<"all" | "tags" | "selected">("all")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({})

  const { data: templatesData } = useQuery({
    queryKey: ["templates", "approved"],
    queryFn: fetchTemplates,
  })

  const { data: contactsData } = useQuery({
    queryKey: ["contacts", "all"],
    queryFn: fetchContacts,
  })

  const templates: Template[] = templatesData?.data || []
  const contacts: Contact[] = contactsData?.data || []
  const selectedTemplate = templates.find((t: { id: string }) => t.id === selectedTemplateId)

  // Extract variables from template
  const variables: string[] = []
  if (selectedTemplate) {
    const matches = selectedTemplate.body.match(/\{\{(\d+)\}\}/g) || []
    matches.forEach((match: string) => {
      const num = match.replace(/[{}]/g, "")
      if (!variables.includes(num)) variables.push(num)
    })
  }

  // Get unique tags from contacts
  const allTags = Array.from(new Set(contacts.flatMap((c: { tags: string[] }) => c.tags)))

  // Calculate recipients count
  const getRecipientCount = () => {
    if (recipientType === "all") return contacts.length
    if (recipientType === "selected") return selectedContacts.length
    if (recipientType === "tags") {
      return contacts.filter((c: { tags: string[] }) =>
        c.tags.some((t: string) => selectedTags.includes(t))
      ).length
    }
    return 0
  }

  const mutation = useMutation({
    mutationFn: createBroadcast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] })
      toast({ title: "Broadcast created successfully!", variant: "success" })
      router.push("/dashboard")
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "error" })
    },
  })

  const handleSubmit = () => {
    mutation.mutate({
      name: campaignName,
      templateId: selectedTemplateId,
      recipientType,
      selectedContacts: recipientType === "selected" ? selectedContacts : undefined,
      tags: recipientType === "tags" ? selectedTags : undefined,
      variableMapping,
    })
  }

  const canProceed = () => {
    if (step === 1) return campaignName && getRecipientCount() > 0
    if (step === 2) return selectedTemplateId
    if (step === 3) return true
    return true
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Broadcast</h1>
        <p className="text-gray-500">Send a WhatsApp message to multiple contacts</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        {steps.map((s, index) => {
          const Icon = s.icon
          return (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step > s.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  step >= s.id ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {s.name}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-4 ${
                    step > s.id ? "bg-primary-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input
                  placeholder="e.g., Welcome Campaign - March 2024"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Recipients *</Label>
                <Select value={recipientType} onValueChange={(v) => setRecipientType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All contacts ({contacts.length})</SelectItem>
                    <SelectItem value="tags">By tags</SelectItem>
                    <SelectItem value="selected">Select manually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientType === "tags" && (
                <div className="space-y-2">
                  <Label>Select Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          setSelectedTags((prev: string[]) =>
                            prev.includes(tag)
                              ? prev.filter((t: string) => t !== tag)
                              : [...prev, tag]
                          )
                        }
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {recipientType === "selected" && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <Label>Select Contacts</Label>
                  {contacts.map((contact: Contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) =>
                          setSelectedContacts((prev: string[]) =>
                            checked
                              ? [...prev, contact.id]
                              : prev.filter((id: string) => id !== contact.id)
                          )
                        }
                      />
                      <span className="text-sm">
                        {contact.name || contact.phone}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{getRecipientCount()}</strong> contacts will receive this broadcast
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>Select Template *</Label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template: Template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplateId === template.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {template.body}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {template.category}
                    </Badge>
                  </div>
                ))}
              </div>
              {templates.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No approved templates available. Create and get a template approved first.
                </p>
              )}
            </div>
          )}

          {step === 3 && selectedTemplate && (
            <div className="space-y-4">
              <Label>Map Variables</Label>
              <p className="text-sm text-gray-500">
                Specify which contact field to use for each variable in the template
              </p>
              {variables.map((varNum) => (
                <div key={varNum} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium">{`{{${varNum}}}`}</span>
                  <Select
                    value={variableMapping[varNum] || ""}
                    onValueChange={(v) =>
                      setVariableMapping({ ...variableMapping, [varNum]: v })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Contact Name</SelectItem>
                      <SelectItem value="phone">Phone Number</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="static">Static Value</SelectItem>
                    </SelectContent>
                  </Select>
                  {variableMapping[varNum] === "static" && (
                    <Input
                      placeholder="Enter value"
                      className="flex-1"
                      onChange={(e) =>
                        setVariableMapping({
                          ...variableMapping,
                          [`${varNum}_value`]: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              ))}
              {variables.length === 0 && (
                <p className="text-gray-500">
                  This template has no variables to map.
                </p>
              )}
            </div>
          )}

          {step === 4 && selectedTemplate && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold">Broadcast Summary</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Campaign:</span>{" "}
                    <strong>{campaignName}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Template:</span>{" "}
                    <strong>{selectedTemplate.name}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Recipients:</span>{" "}
                    <strong>{getRecipientCount()} contacts</strong>
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Preview</h3>
                <TemplatePreview
                  headerType={selectedTemplate.headerType || undefined}
                  headerContent={selectedTemplate.headerContent || undefined}
                  body={selectedTemplate.body}
                  footer={selectedTemplate.footer || undefined}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            <Send className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Sending..." : "Send Broadcast"}
          </Button>
        )}
      </div>
    </div>
  )
}
