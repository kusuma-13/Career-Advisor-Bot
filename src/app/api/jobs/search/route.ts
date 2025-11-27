import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { like, and, gte, lte, or, desc } from 'drizzle-orm';

const SERPAPI_KEY = process.env.SERPAPI_KEY || '8c63a018277928d225e5883b3e294b2adb4600af754ac2f838887ec255f5138d';

// Convert description to bullet points
function formatDescriptionToPoints(description: string): string {
  if (!description) return '';
  
  // Remove existing bullets if any
  let cleaned = description.replace(/^[•\-\*]\s*/gm, '');
  
  // Split by common sentence endings and newlines
  let sentences = cleaned.split(/\n+|\.(?=\s+[A-Z])|;/);
  
  // Clean up and filter sentences
  sentences = sentences
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short fragments
  
  // Convert to bullet points
  if (sentences.length > 1) {
    return sentences.map(s => `• ${s.replace(/\.$/, '')}`).join('\n');
  }
  
  return description;
}

async function fetchJobsFromSerpAPI(searchTerm: string, location: string) {
  try {
    const params = new URLSearchParams({
      engine: 'google_jobs',
      q: searchTerm || 'software developer',
      location: location || 'India',
      hl: 'en',
      api_key: SERPAPI_KEY,
    });

    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    
    if (!response.ok) {
      console.error('SerpAPI error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.jobs_results || data.jobs_results.length === 0) {
      return [];
    }

    // Transform SerpAPI jobs to our format with bullet-point descriptions
    return data.jobs_results.map((job: any) => {
      // Extract salary in INR
      let salary = 0;
      if (job.detected_extensions?.salary) {
        const salaryText = job.detected_extensions.salary.toLowerCase();
        const matches = salaryText.match(/[\d,]+/g);
        if (matches) {
          const value = parseInt(matches[0].replace(/,/g, ''));
          if (salaryText.includes('lakh') || salaryText.includes('lpa')) {
            salary = value * 100000;
          } else if (salaryText.includes('month')) {
            salary = value * 12;
          } else if (salaryText.includes('year') || salaryText.includes('annual')) {
            salary = value;
          } else {
            salary = value * 100000;
          }
        }
      }
      
      if (salary === 0) {
        const title = job.title.toLowerCase();
        if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
          salary = 1500000;
        } else if (title.includes('junior') || title.includes('fresher') || title.includes('entry')) {
          salary = 400000;
        } else if (title.includes('manager')) {
          salary = 2000000;
        } else {
          salary = 800000;
        }
      }

      // Build comprehensive description with bullet points
      let descriptionParts = [];
      
      if (job.description) {
        descriptionParts.push(job.description);
      }
      
      // Add job highlights with bullet points
      if (job.job_highlights) {
        if (job.job_highlights.Qualifications && job.job_highlights.Qualifications.length > 0) {
          descriptionParts.push('\n**Required Qualifications:**');
          job.job_highlights.Qualifications.forEach((q: any) => {
            descriptionParts.push(`• ${q.title || q}`);
          });
        }
        
        if (job.job_highlights.Responsibilities && job.job_highlights.Responsibilities.length > 0) {
          descriptionParts.push('\n**Key Responsibilities:**');
          job.job_highlights.Responsibilities.forEach((r: any) => {
            descriptionParts.push(`• ${r.title || r}`);
          });
        }
        
        if (job.job_highlights.Benefits && job.job_highlights.Benefits.length > 0) {
          descriptionParts.push('\n**Benefits:**');
          job.job_highlights.Benefits.forEach((b: any) => {
            descriptionParts.push(`• ${b.title || b}`);
          });
        }
      }
      
      // Add extensions
      if (job.detected_extensions) {
        if (job.detected_extensions.work_from_home) {
          descriptionParts.push('\n• 🏠 Remote/Work from home available');
        }
      }
      
      const description = descriptionParts.join('\n');

      return {
        id: job.job_id || `serp-${Math.random()}`,
        title: job.title,
        company: job.company_name,
        location: job.location || location || 'India',
        salary: salary,
        description: description || formatDescriptionToPoints(job.snippet || 'No description available'),
        type: job.detected_extensions?.schedule_type || 'Full-time',
        postedDate: job.detected_extensions?.posted_at || new Date().toISOString(),
        source: 'serpapi',
        applyLink: job.share_link || job.apply_options?.[0]?.link,
        thumbnail: job.thumbnail,
        extensions: job.extensions || [],
      };
    });
  } catch (error) {
    console.error('SerpAPI fetch error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || '';
    const searchTerm = searchParams.get('search') || '';
    const minSalary = searchParams.get('minSalary') || '0';
    const maxSalary = searchParams.get('maxSalary') || '10000000';

    // Build query conditions
    const conditions = [];

    if (location) {
      conditions.push(like(jobs.location, `%${location}%`));
    }

    if (searchTerm) {
      conditions.push(
        or(
          like(jobs.title, `%${searchTerm}%`),
          like(jobs.company, `%${searchTerm}%`),
          like(jobs.description, `%${searchTerm}%`)
        )!
      );
    }

    const minSal = parseInt(minSalary);
    const maxSal = parseInt(maxSalary);
    conditions.push(gte(jobs.salary, minSal));
    conditions.push(lte(jobs.salary, maxSal));

    // Query jobs from database
    let query = db.select().from(jobs);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    let filteredJobs = await query.orderBy(desc(jobs.postedDate));
    
    // Format database job descriptions to bullet points
    filteredJobs = filteredJobs.map(job => ({
      ...job,
      description: formatDescriptionToPoints(job.description)
    }));

    // Always fetch from SerpAPI for real-time job listings
    console.log('Fetching jobs from SerpAPI...');
    const serpApiJobs = await fetchJobsFromSerpAPI(searchTerm, location);
    
    // Filter SerpAPI jobs by salary range
    const filteredSerpJobs = serpApiJobs.filter((job: any) => 
      job.salary >= minSal && job.salary <= maxSal
    );
    
    // Combine and prioritize SerpAPI results
    filteredJobs = [...filteredSerpJobs, ...filteredJobs];

    return NextResponse.json({
      jobs: filteredJobs,
      totalJobs: filteredJobs.length
    });

  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}