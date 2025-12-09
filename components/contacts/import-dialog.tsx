"use client"

import { useState, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Upload, FileSpreadsheet, X, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ParsedCSV {
  headers: string[]
  rows: string[][]
}

async function importContacts(data: {
  contacts: Array<{ phone: string; name?: string; email?: string }>
  tags?: string[]
}) {
  const res = await fetch("/api/contacts/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || "Failed to import contacts")
  }
  return res.json()
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null)
  const [columnMapping, setColumnMapping] = useState({
    phone: "",
    name: "",
    email: "",
  })
  const [step, setStep] = useState<"upload" | "map" | "success">("upload")
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      toast({ title: "Please upload a CSV file", variant: "error" })
      return
    }

    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())
      if (lines.length < 2) {
        toast({ title: "CSV file is empty or has no data rows", variant: "error" })
        return
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      const rows = lines.slice(1).map((line) =>
        line.split(",").map((cell) => cell.trim().replace(/"/g, ""))
      )

      setParsedData({ headers, rows })
      setStep("map")

      // Auto-detect columns
      const phoneIndex = headers.findIndex((h) =>
        /phone|mobile|cell|number/i.test(h)
      )
      const nameIndex = headers.findIndex((h) =>
        /name|full.?name|contact/i.test(h)
      )
      const emailIndex = headers.findIndex((h) => /email|e-mail/i.test(h))

      setColumnMapping({
        phone: phoneIndex >= 0 ? headers[phoneIndex] : "",
        name: nameIndex >= 0 ? headers[nameIndex] : "",
        email: emailIndex >= 0 ? headers[emailIndex] : "",
      })
    }
    reader.readAsText(selectedFile)
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileChange(fakeEvent)
    }
  }, [handleFileChange])

  const mutation = useMutation({
    mutationFn: importContacts,
    onSuccess: (data) => {
      setImportResult({ imported: data.data.imported, failed: data.data.failed })
      setStep("success")
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
    },
    onError: (error: Error) => {
      toast({ title: "Import failed", description: error.message, variant: "error" })
    },
  })

  const handleImport = () => {
    if (!parsedData || !columnMapping.phone) return

    const phoneIndex = parsedData.headers.indexOf(columnMapping.phone)
    const nameIndex = columnMapping.name
      ? parsedData.headers.indexOf(columnMapping.name)
      : -1
    const emailIndex = columnMapping.email
      ? parsedData.headers.indexOf(columnMapping.email)
      : -1

    const contacts = parsedData.rows
      .map((row) => ({
        phone: row[phoneIndex]?.replace(/[^+\d]/g, ""),
        name: nameIndex >= 0 ? row[nameIndex] : undefined,
        email: emailIndex >= 0 ? row[emailIndex] : undefined,
      }))
      .filter((c) => c.phone)

    mutation.mutate({ contacts })
  }

  const handleClose = () => {
    setFile(null)
    setParsedData(null)
    setColumnMapping({ phone: "", name: "", email: "" })
    setStep("upload")
    setImportResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import contacts in bulk
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("csv-upload")?.click()}
          >
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">
              Drag and drop your CSV file here
            </p>
            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
          </div>
        )}

        {step === "map" && parsedData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">{file?.name}</span>
              <span className="text-xs text-gray-500">
                ({parsedData.rows.length} rows)
              </span>
              <button
                onClick={() => {
                  setFile(null)
                  setParsedData(null)
                  setStep("upload")
                }}
                className="ml-auto"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Phone Number Column *</Label>
                <Select
                  value={columnMapping.phone}
                  onValueChange={(v) =>
                    setColumnMapping({ ...columnMapping, phone: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedData.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Name Column</Label>
                <Select
                  value={columnMapping.name}
                  onValueChange={(v) =>
                    setColumnMapping({ ...columnMapping, name: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {parsedData.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Email Column</Label>
                <Select
                  value={columnMapping.email}
                  onValueChange={(v) =>
                    setColumnMapping({ ...columnMapping, email: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {parsedData.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === "success" && importResult && (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
            <p className="text-sm text-gray-500">
              {importResult.imported} contacts imported successfully
              {importResult.failed > 0 && `, ${importResult.failed} failed`}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {step === "success" ? "Close" : "Cancel"}
          </Button>
          {step === "map" && (
            <Button
              onClick={handleImport}
              disabled={!columnMapping.phone || mutation.isPending}
            >
              {mutation.isPending ? "Importing..." : "Import Contacts"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
