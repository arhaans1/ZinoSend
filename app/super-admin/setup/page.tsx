"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Shield, Eye, EyeOff, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const setupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SetupInput = z.infer<typeof setupSchema>

export default function SuperAdminSetupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(true)
  const [setupRequired, setSetupRequired] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupInput>({
    resolver: zodResolver(setupSchema),
  })

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/super-admin/setup")
        const data = await res.json()
        if (data.success) {
          setSetupRequired(data.data.setupRequired)
          if (!data.data.setupRequired) {
            router.push("/super-admin/login")
          }
        }
      } catch (error) {
        console.error("Failed to check setup status:", error)
      } finally {
        setCheckingSetup(false)
      }
    }
    checkSetup()
  }, [router])

  const onSubmit = async (data: SetupInput) => {
    setIsLoading(true)

    try {
      const res = await fetch("/api/super-admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast({
          title: "Setup failed",
          description: result.error?.message || "Failed to create super admin",
          variant: "error",
        })
      } else {
        toast({
          title: "Super Admin Created!",
          description: "You can now login with your credentials",
          variant: "success",
        })
        router.push("/super-admin/login")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!setupRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-gray-700 bg-gray-800/50 backdrop-blur">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Setup Complete</h2>
            <p className="text-gray-400 mb-4">Super admin already exists. Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-gray-700 bg-gray-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Setup Super Admin</CardTitle>
          <CardDescription className="text-gray-400">
            Create your platform administrator account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@zinosend.com"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                  {...register("password")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>

          <CardContent className="pt-0">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Super Admin Account"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
