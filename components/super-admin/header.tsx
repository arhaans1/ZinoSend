"use client"

import { useRouter } from "next/navigation"
import { LogOut, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface SuperAdminHeaderProps {
  superAdmin: {
    id: string
    email: string
    name: string
  }
}

export function SuperAdminHeader({ superAdmin }: SuperAdminHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await fetch("/api/super-admin/logout", { method: "POST" })
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
        variant: "success",
      })
      router.push("/super-admin/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "error",
      })
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-700 bg-gray-800/95 backdrop-blur px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <h1 className="text-lg font-semibold text-white">Platform Administration</h1>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="hidden sm:block">{superAdmin.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
              <DropdownMenuLabel className="text-gray-300">
                <div>
                  <p className="text-sm font-medium text-white">{superAdmin.name}</p>
                  <p className="text-xs text-gray-400">{superAdmin.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 hover:bg-gray-700 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
