
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, Settings, UserPlus } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { useSupabase } from "@/components/supabase-provider";
import { toast } from "sonner";

interface DashboardHeaderProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export default function DashboardHeader({ sidebarCollapsed, setSidebarCollapsed }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { supabase, user, profile } = useSupabase();
  const [pageTitle, setPageTitle] = useState("");

  useEffect(() => {
    const path = pathname.split("/").filter(Boolean);
    if (path.length === 1) {
      setPageTitle("Dashboard");
    } else {
      const title = path[1] ? path[1].charAt(0).toUpperCase() + path[1].slice(1) : "";
      setPageTitle(title);
    }
  }, [pathname]);

  console.log("profile data: ", profile);
  console.log("user data: ", user);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error("Error logging out: " + error.message);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="p-2 w-8 h-8 hidden md:block"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="secondary">{profile?.credits || "0"} Credits</Badge>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="p-0 w-8 h-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url || ""}
                  alt="User avatar"
                  onError={(e) => console.error("Avatar image failed to load:", user?.user_metadata?.avatar_url)}
                />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-black dark:text-white">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ||
                    user?.email?.charAt(0)?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40" align="end" sideOffset={10}>
            <div className="flex flex-col gap-1">
              <Link href="/dashboard/settings">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Link href="/dashboard/referrals">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <UserPlus className="h-4 w-4" />
                  Referrals
                </Button>
              </Link>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}