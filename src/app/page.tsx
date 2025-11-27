"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { useSession } from "@/lib/auth-client";
import { Briefcase, BookOpen, User, TrendingUp, Target, CheckCircle, ArrowRight, Building2, GraduationCap, MessageSquare, ExternalLink, Clock, Star, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Course {
  name: string;
  category: string;
  duration: string;
  level: string;
  description: string;
  platform?: string;
  url?: string;
  instructor?: string;
  rating?: number;
  students?: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchCourses();
    }
  }, [session]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    setCoursesError(false);
    try {
      const token = localStorage.getItem("bearer_token");
      
      // Fetch user profile first
      const profileRes = await fetch("/api/profiles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let education = "";
      let skills: string[] = [];
      let interests: string[] = [];

      if (profileRes.ok) {
        const profiles = await profileRes.json();
        if (profiles.length > 0) {
          const profile = profiles[0];
          education = profile.education || "";
          skills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills || [];
          interests = typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests || [];
        }
      }

      // Get course recommendations from API - now with all courses
      const res = await fetch("/api/courses/udemy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ education, skills, interests }),
      });

      if (res.ok) {
        const data = await res.json();
        // Show courses even if profile is empty - show general courses
        setCourses(data.courses.slice(0, 6)); // Show first 6 courses
      } else {
        setCoursesError(true);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCoursesError(true);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCourseView = async (course: Course) => {
    try {
      const token = localStorage.getItem("bearer_token");
      await fetch("/api/course-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseName: course.name,
          courseCategory: course.category,
        }),
      });

      // Open course link
      if (course.url) {
        const isInIframe = window.self !== window.top;
        if (isInIframe) {
          window.parent.postMessage({ 
            type: "OPEN_EXTERNAL_URL", 
            data: { url: course.url } 
          }, "*");
        } else {
          window.open(course.url, "_blank", "noopener,noreferrer");
        }
        toast.success("Opening course page...");
      }
    } catch (error) {
      console.error("Error tracking course view:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Find Your Dream Job Today
            </h1>
            <p className="text-xl md:text-2xl text-blue-50">
              Connecting talented professionals with top companies across India
            </p>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Get AI-powered job recommendations, personalized courses from top platforms, and career guidance
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center pt-6">
              {session?.user ? (
                <>
                  <Link href="/jobs">
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 h-14">
                      <Briefcase className="mr-2 h-5 w-5" />
                      Browse Jobs
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 h-14">
                      Go to Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 h-14">
                      Register Now - It's Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 h-14">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold">15K+</div>
                <div className="text-blue-100 mt-1">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">50+</div>
                <div className="text-blue-100 mt-1">Top Companies</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">40+</div>
                <div className="text-blue-100 mt-1">Free Courses</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Courses Section - Always show for logged-in users */}
      {session?.user && (
        <section className="bg-slate-50 dark:bg-slate-800 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Recommended Courses for You
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Free & Premium courses from Udemy, Coursera, edX, freeCodeCamp & YouTube
              </p>
            </div>

            {loadingCourses ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                  <p className="text-slate-600 dark:text-slate-400">Loading personalized courses...</p>
                </div>
              </div>
            ) : coursesError ? (
              <Card className="shadow-lg">
                <CardContent className="text-center py-16">
                  <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                    Unable to Load Courses
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                    There was an error loading your recommended courses. Please try again later.
                  </p>
                  <Button onClick={fetchCourses} className="bg-blue-600 hover:bg-blue-700 mr-2">
                    Try Again
                  </Button>
                  <Link href="/courses">
                    <Button variant="outline">
                      Browse All Courses
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {courses.map((course, index) => (
                    <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <Badge 
                            variant={course.level === "Beginner" ? "secondary" : course.level === "Intermediate" ? "default" : "destructive"}
                          >
                            {course.level}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl leading-tight line-clamp-2">{course.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {course.category}
                          </Badge>
                          {course.platform?.includes('FREE') && (
                            <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                              FREE
                            </Badge>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 flex-1 flex flex-col">
                        <p className="text-sm text-slate-700 dark:text-slate-300 flex-1 line-clamp-3">
                          {course.description}
                        </p>
                        
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration}</span>
                          </div>
                          
                          {course.platform && (
                            <Badge variant="outline" className="text-xs font-semibold">
                              {course.platform}
                            </Badge>
                          )}
                          
                          {course.instructor && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <User className="h-3 w-3" />
                              <span className="line-clamp-1">{course.instructor}</span>
                            </div>
                          )}

                          {course.rating && (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="h-3 w-3 fill-current" />
                                <span className="font-semibold">{course.rating}</span>
                              </div>
                              {course.students && (
                                <span className="text-slate-500 dark:text-slate-400">
                                  ({course.students} students)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <Button
                          className="w-full mt-auto bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleCourseView(course)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Course
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center">
                  <Link href="/courses">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      View All Courses
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="text-center py-16">
                  <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                    Loading Your Personalized Courses
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                    Complete your profile to get better course recommendations, or browse all available courses
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/profile">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <User className="mr-2 h-4 w-4" />
                        Complete Profile
                      </Button>
                    </Link>
                    <Link href="/courses">
                      <Button variant="outline">
                        Browse All Courses
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            How CareerHub Works
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Get started in 3 simple steps and unlock your career potential
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">1. Create Your Profile</CardTitle>
              <CardDescription className="text-base">
                Sign up and build your professional profile with your skills, education, and experience
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">2. Explore Opportunities</CardTitle>
              <CardDescription className="text-base">
                Browse AI-matched jobs and personalized course recommendations tailored to your goals
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">3. Achieve Your Goals</CardTitle>
              <CardDescription className="text-base">
                Apply to jobs, take courses, and get career guidance from our AI Career Advisor
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 dark:bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need for Career Success
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Powerful tools and resources at your fingertips
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Briefcase className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">Smart Job Search</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">AI-powered job matching based on your profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Real-time job listings from top companies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Salary information in INR with point-wise job descriptions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">One-click application tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">Personalized Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Free courses from Coursera, edX, freeCodeCamp, YouTube</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Premium courses from Udemy and other platforms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Tailored for BCA, BCom, BDA, BBA students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Skill-based recommendations with ratings</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle className="text-xl">AI Career Advisor</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">24/7 career guidance and support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Resume and interview tips</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Personalized career advice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Powered by advanced AI (Groq)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <User className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle className="text-xl">Smart Profile Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Resume upload and analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">AI skill recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Experience level tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Profile completeness insights</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Building2 className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle className="text-xl">Top Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Google, Amazon, Microsoft & more</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Indian startups: Flipkart, Swiggy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">IT giants: TCS, Infosys, Wipro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Verified job postings</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle className="text-xl">Career Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Track all your applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Monitor course progress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">View activity timeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Get personalized insights</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session?.user && (
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Join thousands of professionals finding their dream jobs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-10 h-14">
                  <User className="mr-2 h-5 w-5" />
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/jobs">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 h-14">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Browse Jobs
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-blue-100 text-sm">
              No credit card required • Free forever • Join in 60 seconds
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">CareerHub</h3>
              <p className="text-sm text-slate-400">
                Your trusted partner for career growth and job search in India.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link href="/courses" className="hover:text-white transition-colors">Free Courses</Link></li>
                <li><Link href="/profile" className="hover:text-white transition-colors">Build Profile</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Career Advisor AI</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Resume Tips</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Interview Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Salary Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-400">
            <p>© 2024 CareerHub. All rights reserved. Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}