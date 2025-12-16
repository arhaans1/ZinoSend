"use client"

import { useEffect, useState } from "react"
import { CreditCard, Plus, Building2, IndianRupee, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Transaction {
  id: string
  type: string
  amount: number
  balanceAfter: number
  description: string
  organization: {
    id: string
    name: string
  }
  createdAt: string
}

interface Organization {
  id: string
  name: string
  walletBalance: number
}

interface RevenueStats {
  totalRevenue: number
  totalTopUps: number
  totalDeductions: number
  organizationCount: number
}

const typeColors: Record<string, "default" | "success" | "error" | "warning"> = {
  TOPUP: "success",
  DEDUCTION: "error",
  REFUND: "warning",
  SUBSCRIPTION: "default",
}

export default function RevenuePage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false)
  const [addingTopUp, setAddingTopUp] = useState(false)
  const [topUpData, setTopUpData] = useState({
    organizationId: "",
    amount: "",
    description: "Manual top-up by admin",
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [transRes, orgRes, statsRes] = await Promise.all([
        fetch("/api/super-admin/transactions?limit=50"),
        fetch("/api/super-admin/organizations?limit=100"),
        fetch("/api/super-admin/revenue-stats"),
      ])

      const transData = await transRes.json()
      const orgData = await orgRes.json()
      const statsData = await statsRes.json()

      if (transData.success) setTransactions(transData.data.transactions)
      if (orgData.success) {
        setOrganizations(orgData.data.organizations.map((o: Organization & { walletBalance: number }) => ({
          id: o.id,
          name: o.name,
          walletBalance: o.walletBalance,
        })))
      }
      if (statsData.success) setStats(statsData.data)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddTopUp = async () => {
    if (!topUpData.organizationId || !topUpData.amount) {
      toast({
        title: "Error",
        description: "Please select an organization and enter an amount",
        variant: "error",
      })
      return
    }

    const amount = parseFloat(topUpData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "error",
      })
      return
    }

    setAddingTopUp(true)
    try {
      const res = await fetch("/api/super-admin/wallet-topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: topUpData.organizationId,
          amount,
          description: topUpData.description,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast({
          title: "Top-up successful",
          description: `₹${amount.toLocaleString("en-IN")} added to wallet`,
          variant: "success",
        })
        setTopUpDialogOpen(false)
        setTopUpData({ organizationId: "", amount: "", description: "Manual top-up by admin" })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.error?.message || "Failed to add top-up",
          variant: "error",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add top-up",
        variant: "error",
      })
    } finally {
      setAddingTopUp(false)
    }
  }

  const selectedOrg = organizations.find((o) => o.id === topUpData.organizationId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Revenue & Billing</h2>
          <p className="text-gray-400">Manage wallet top-ups and view transactions</p>
        </div>
        <Button
          onClick={() => setTopUpDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Wallet Top-up
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-amber-400">
                    ₹{stats.totalRevenue.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-amber-400/10 flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Top-ups</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{stats.totalTopUps.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-400/10 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-400">
                    ₹{stats.totalDeductions.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-400/10 flex items-center justify-center">
                  <ArrowDownRight className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Organizations</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {stats.organizationCount}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-400/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription className="text-gray-400">
            All wallet transactions across organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableHead className="text-gray-400">Organization</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Description</TableHead>
                    <TableHead className="text-gray-400 text-right">Amount</TableHead>
                    <TableHead className="text-gray-400 text-right">Balance After</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-300">{tx.organization.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeColors[tx.type] || "default"}>
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{tx.description}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'TOPUP' || tx.type === 'REFUND' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'TOPUP' || tx.type === 'REFUND' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-gray-300">
                        ₹{tx.balanceAfter.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Top-up Dialog */}
      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Add Wallet Top-up</DialogTitle>
            <DialogDescription className="text-gray-400">
              Manually add balance to an organization's wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Organization</Label>
              <Select
                value={topUpData.organizationId}
                onValueChange={(value) => setTopUpData({ ...topUpData, organizationId: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="text-white">
                      {org.name} (Balance: ₹{org.walletBalance.toLocaleString("en-IN")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrg && (
              <div className="p-3 rounded-lg bg-gray-700/50">
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="text-lg font-bold text-amber-400">
                  ₹{selectedOrg.walletBalance.toLocaleString("en-IN")}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-300">Amount (₹)</Label>
              <Input
                type="number"
                value={topUpData.amount}
                onChange={(e) => setTopUpData({ ...topUpData, amount: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter amount"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={topUpData.description}
                onChange={(e) => setTopUpData({ ...topUpData, description: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Reason for top-up"
              />
            </div>

            {selectedOrg && topUpData.amount && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-gray-400">New Balance After Top-up</p>
                <p className="text-lg font-bold text-green-400">
                  ₹{(selectedOrg.walletBalance + parseFloat(topUpData.amount || "0")).toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTopUpDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTopUp}
              disabled={addingTopUp}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {addingTopUp ? "Adding..." : "Add Top-up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
