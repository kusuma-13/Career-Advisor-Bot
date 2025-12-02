"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { Loader2, Search, MapPin, IndianRupee, Briefcase, Building2, ExternalLink, Filter, ChevronDown, ChevronUp, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: number;
  description: string;
  type: string;
  postedDate: string;
  source?: string;
  applyLink?: string;
}

export default function JobsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false); // Changed initial state to false
  const [searching, setSearching] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [minSalary, setMinSalary] = useState("0");
  const [maxSalary, setMaxSalary] = useState("10000000");

  const locations = ["All Locations", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"];
  const salaryRanges = [
    { label: "Any Salary", min: "0", max: "10000000" },
    { label: "₹3-5 LPA", min: "300000", max: "500000" },
    { label: "₹5-8 LPA", min: "500000", max: "800000" },
    { label: "₹8-12 LPA", min: "800000", max: "1200000" },
    { label: "₹12+ LPA", min: "1200000", max: "10000000" },
  ];

  // Load jobs on component mount
  useEffect(() => {
    searchJobs();
  }, []);

  const searchJobs = async () => {
    if (searching) return;
    
    setSearching(true);
    setLoading(true);

    try {
      const token = localStorage.getItem("bearer_token");
      
      const params = new URLSearchParams({
        search: searchTerm,
        location: location === "All Locations" ? "" : location,
        minSalary,
        maxSalary,
      });

      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/jobs/search?${params}`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        // Filter out jobs without an apply link or application method
        const jobsWithApplyOption = data.jobs.filter((job: Job) => 
          job.applyLink || job.source !== 'serpapi'
        );
        // Format descriptions to ensure proper line breaks
        const formattedJobs = jobsWithApplyOption.map((job: Job) => ({
          ...job,
          description: job.description
            .replace(/•/g, '\n•')  // Ensure bullet points are on new lines
            .replace(/\n\s*\n/g, '\n')  // Clean up double newlines
            .trim()
        }));
        setJobs(formattedJobs);
      } else {
        toast.error("Failed to search jobs");
      }
    } catch (error) {
      console.error("Error searching jobs:", error);
      toast.error("Error searching jobs");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const toggleJobExpansion = (jobId: number) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const openApplyDialog = (job: Job) => {
    setSelectedJob(job);
    setConfirmDialogOpen(true);
  };

  const handleApplyJob = async () => {
    if (!selectedJob) return;

    // If it's an external job (from SerpAPI), open the apply link
    if (selectedJob.source === 'serpapi' && selectedJob.applyLink) {
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage({ 
          type: "OPEN_EXTERNAL_URL", 
          data: { url: selectedJob.applyLink } 
        }, "*");
      } else {
        window.open(selectedJob.applyLink, "_blank", "noopener,noreferrer");
      }
      setConfirmDialogOpen(false);
      setSelectedJob(null);
      toast.success("Opening application page...");
      return;
    }

    // Otherwise, track application in database
    setApplyingJobId(selectedJob.id);
    setConfirmDialogOpen(false);

    try {
      const token = localStorage.getItem("bearer_token");
      
      // Create job application
      const res = await fetch("/api/job-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobTitle: selectedJob.title,
          company: selectedJob.company,
          location: selectedJob.location,
          salary: selectedJob.salary,
          jobDescription: selectedJob.description,
          status: "Applied",
        }),
      });

      if (res.ok) {
        toast.success("Application submitted successfully!");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error applying to job:", error);
      toast.error("Error applying to job");
    } finally {
      setApplyingJobId(null);
      setSelectedJob(null);
    }
  };

  const formatSalary = (salary: number) => {
    if (salary >= 100000) {
      return `₹${(salary / 100000).toFixed(1)} LPA`;
    }
    return `₹${salary.toLocaleString("en-IN")}`;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Only show loading state if we're actually loading jobs
  if ((!initialized && (isPending || loading)) || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Discover Your Dream Job
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Browse thousands of job opportunities from top companies across India
          </p>
        </div>

        {/* Search and Filters Card */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">Search Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Job title, company, or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-11 border-gray-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Select Location" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={`${minSalary}-${maxSalary}`}
                onValueChange={(value) => {
                  const [min, max] = value.split("-");
                  setMinSalary(min);
                  setMaxSalary(max);
                }}
              >
                <SelectTrigger className="h-11 border-gray-300">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Salary Range" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {salaryRanges.map((range) => (
                    <SelectItem key={range.label} value={`${range.min}-${range.max}`}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={searchJobs} 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium" 
              disabled={searching}
            >
              {searching ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Search Jobs
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {jobs.length > 0 ? (
              <>
                Showing <span className="text-blue-600 font-semibold">{jobs.length}</span> job{jobs.length !== 1 ? "s" : ""}
              </>
            ) : (
              "No jobs found"
            )}
          </p>
        </div>

        {/* Jobs List */}
        <div className="space-y-5">
          {jobs.map((job) => {
            const isExpanded = expandedJobs.has(job.id);
            const shouldShowReadMore = job.description.length > 200;
            
            return (
              <Card key={job.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Briefcase className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <CardTitle className="text-2xl text-gray-900 dark:text-white font-bold">
                              {job.title}
                            </CardTitle>
                            {job.source === 'serpapi' && (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Live
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="text-gray-900 dark:text-white">{job.company}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span>{getRelativeTime(job.postedDate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge className="text-lg px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 whitespace-nowrap shadow-lg font-semibold">
                      <IndianRupee className="h-5 w-5 mr-1" />
                      {formatSalary(job.salary)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Type and Posted Date */}
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 px-3 py-1">
                      <Briefcase className="h-3 w-3 mr-1.5" />
                      {job.type}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Posted {getRelativeTime(job.postedDate)}</span>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      Job Description
                    </h4>
                    <div className="mt-4 text-gray-700 dark:text-gray-300 text-sm space-y-2">
                      {shouldShowReadMore ? (
                        <>
                          <div className="space-y-1.5">
                            {job.description
                              .split('\n')
                              .slice(0, isExpanded ? undefined : 6)
                              .map((line, i) => (
                                <div key={i} className={line.trim() ? '' : 'h-3'}>{line || ' '}</div>
                              ))}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleJobExpansion(job.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1 -ml-1"
                          >
                            {isExpanded ? '...Show less' : '...Read more'}
                          </button>
                        </>
                      ) : (
                        <div className="space-y-1.5">
                          {job.description.split('\n').map((line, i) => (
                            <div key={i} className={line.trim() ? '' : 'h-3'}>{line || ' '}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Job ID: #{job.id}
                    </div>
                    <Button
                      onClick={() => openApplyDialog(job)}
                      disabled={applyingJobId === job.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      {applyingJobId === job.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          Apply Now
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {jobs.length === 0 && !searching && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                No Jobs Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                We couldn't find any jobs matching your criteria. Try adjusting your filters or search terms.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Apply Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Application</DialogTitle>
            <DialogDescription className="text-base">
              {selectedJob?.source === 'serpapi' 
                ? "This will open the job application page in a new window."
                : "Are you sure you want to apply for this position?"
              }
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-3 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedJob.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedJob.company}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedJob.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Salary</p>
                <p className="font-semibold text-green-600 dark:text-green-400">{formatSalary(selectedJob.salary)}</p>
              </div>
              {selectedJob.source === 'serpapi' && (
                <Badge variant="outline" className="mt-2 border-green-500 text-green-700 dark:text-green-400">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  External Application
                </Badge>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApplyJob}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {selectedJob?.source === 'serpapi' ? 'Open Application' : 'Confirm Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}