"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Wallet, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"

async function fetchBillingData() {
  const res = await fetch("/api/billing/wallet")
  if (!res.ok) throw new Error("Failed to fetch billing data")
  return res.json()
}

async function fetchTransactions() {
  const res = await fetch("/api/billing/transactions")
  if (!res.ok) throw new Error("Failed to fetch transactions")
  return res.json()
}

async function createTopUp(amount: number) {
  const res = await fetch("/api/billing/topup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  })
  if (!res.ok) throw new Error("Failed to create top-up")
  return res.json()
}

const presetAmounts = [500, 1000, 2000, 5000]

export default function BillingPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState("")

  const { data: billingData } = useQuery({
    queryKey: ["billing", "wallet"],
    queryFn: fetchBillingData,
  })

  const { data: transactionsData } = useQuery({
    queryKey: ["billing", "transactions"],
    queryFn: fetchTransactions,
  })

  const topUpMutation = useMutation({
    mutationFn: createTopUp,
    onSuccess: (data) => {
      // In production, this would redirect to Razorpay checkout
      toast({
        title: "Top-up initiated",
        description: `Order created. In production, you would be redirected to payment.`,
        variant: "success",
      })
      setTopUpOpen(false)
      queryClient.invalidateQueries({ queryKey: ["billing"] })
    },
    onError: () => {
      toast({ title: "Failed to create top-up", variant: "error" })
    },
  })

  const wallet = billingData?.data || { balance: 0, plan: "FREE" }
  const transactions = transactionsData?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500">Manage your wallet and subscriptions</p>
      </div>

      {/* Wallet and Plan Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Card */}
        <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white/90">Wallet Balance</CardTitle>
              <Wallet className="h-5 w-5 text-white/70" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">
              {formatCurrency(wallet.balance)}
            </div>
            {wallet.balance < 500 && (
              <p className="text-yellow-200 text-sm mb-4">
                Low balance! Top up to continue sending messages.
              </p>
            )}
            <Button
              variant="secondary"
              onClick={() => setTopUpOpen(true)}
              className="bg-white text-primary-700 hover:bg-gray-100"
            >
              Top Up Wallet
            </Button>
          </CardContent>
        </Card>

        {/* Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold">{wallet.plan}</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>Unlimited contacts</li>
              <li>Template management</li>
              <li>Broadcast messaging</li>
              <li>Basic analytics</li>
            </ul>
            <Button variant="outline">Upgrade Plan</Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-gray-500">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={tx.type === "TOPUP" ? "success" : "secondary"}
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`flex items-center justify-end ${
                        tx.type === "TOPUP" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.type === "TOPUP" ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      {formatCurrency(Math.abs(Number(tx.amount)))}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(tx.balanceAfter))}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Up Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
            <DialogDescription>
              Add funds to your ZinoSend wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map((amount: number) => (
                <Button
                  key={amount}
                  variant={topUpAmount === String(amount) ? "default" : "outline"}
                  onClick={() => setTopUpAmount(String(amount))}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Custom Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min={100}
                max={100000}
              />
              <p className="text-xs text-gray-500">
                Min: ₹100, Max: ₹1,00,000
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTopUpOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => topUpMutation.mutate(Number(topUpAmount))}
              disabled={
                !topUpAmount ||
                Number(topUpAmount) < 100 ||
                topUpMutation.isPending
              }
            >
              {topUpMutation.isPending ? "Processing..." : "Proceed to Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
