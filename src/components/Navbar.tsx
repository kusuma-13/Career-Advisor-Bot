"use client";

import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Briefcase, BookOpen, LayoutDashboard, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session, refetch } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");

    await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    localStorage.removeItem("bearer_token");
    refetch();
    router.push("/");
  };

  return (
    <nav className="border-b bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-primary">
              CareerHub
            </Link>

            {session?.user && (
              <div className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/jobs"
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  <Briefcase className="h-4 w-4" />
                  Jobs
                </Link>
                <Link
                  href="/courses"
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Courses
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {session.user.name}
                </span>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}