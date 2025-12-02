"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { Loader2, Briefcase, BookOpen, User, TrendingUp, CheckCircle, Clock, Award, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalApplications: number;
  totalCourseViews: number;
  profileCompleteness: number;
  skillsCount: number;
}

interface Activity {
  type: string;
  title: string;
  company?: string;
  category?: string;
  date: string;
  status?: string;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    totalCourseViews: 0,
    profileCompleteness: 0,
    skillsCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session.user.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Here's your career journey overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Briefcase className="h-8 w-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stats.totalApplications}</div>
              <p className="text-blue-100 text-sm">Job Applications</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <BookOpen className="h-8 w-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">Learning</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stats.totalCourseViews}</div>
              <p className="text-purple-100 text-sm">Courses Explored</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Award className="h-8 w-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">Skills</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stats.skillsCount}</div>
              <p className="text-green-100 text-sm">Skills Added</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <User className="h-8 w-8 opacity-80" />
                <Badge className="bg-white/20 text-white border-0">Profile</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stats.profileCompleteness}%</div>
              <p className="text-orange-100 text-sm">Profile Complete</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Completion Alert */}
        {stats.profileCompleteness < 100 && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  A complete profile helps us provide better job and course recommendations
                </p>
                <Progress value={stats.profileCompleteness} className="h-2" />
              </div>
              <Link href="/profile">
                <Button className="ml-6">
                  Complete Profile
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Recent Activity</CardTitle>
                  <CardDescription>Your latest actions and updates</CardDescription>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        {activity.type === 'application' ? (
                          <Briefcase className="h-5 w-5 text-white" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        {activity.company && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.company}
                          </p>
                        )}
                        {activity.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {activity.category}
                          </Badge>
                        )}
                        {activity.status && (
                          <Badge
                            className={`mt-1 ${
                              activity.status === 'Applied'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(activity.date)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No recent activity. Start exploring jobs and courses!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Actions</CardTitle>
              <CardDescription>Navigate to key features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/jobs">
                <Button className="w-full justify-start h-auto p-4 bg-blue-600 hover:bg-blue-700">
                  <Briefcase className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Find Jobs</div>
                    <div className="text-xs opacity-90">Search & apply to jobs</div>
                  </div>
                </Button>
              </Link>

              <Link href="/courses">
                <Button className="w-full justify-start h-auto p-4 bg-purple-600 hover:bg-purple-700">
                  <BookOpen className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Explore Courses</div>
                    <div className="text-xs opacity-90">Learn new skills</div>
                  </div>
                </Button>
              </Link>

              <Link href="/profile">
                <Button className="w-full justify-start h-auto p-4 bg-green-600 hover:bg-green-700">
                  <User className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Update Profile</div>
                    <div className="text-xs opacity-90">Manage your info</div>
                  </div>
                </Button>
              </Link>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300">
                  Career Tips
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Update your resume regularly
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Keep learning new skills
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Network with professionals
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
