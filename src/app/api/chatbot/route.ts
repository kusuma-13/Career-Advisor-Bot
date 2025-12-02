import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build conversation messages for Groq
    const messages = [
      {
        role: 'system',
        content: `You are Career Advisor AI for CareerHub - a comprehensive career development and job search platform in India.

**About CareerHub Platform:**
- A career advisor platform connecting job seekers with top companies in India
- Features include: job search, personalized courses, AI-powered recommendations, resume analysis
- Users can browse 15K+ active jobs from 50+ top companies (Google, Amazon, Microsoft, Flipkart, Swiggy, TCS, Infosys, Wipro, etc.)
- Job listings show salaries in Indian Rupees (₹)
- Supports students from BCA, BCom, BBA, BDA and other courses

**Platform Features:**
1. **Smart Job Search**: AI-powered job matching, location-based filtering, salary information in INR, one-click applications
2. **Personalized Courses**: Curated courses from Udemy and other platforms based on education (BCA→Computer courses, BCom→Accounting courses) and skills
3. **Profile Builder**: Resume upload and analysis, AI skill recommendations, experience level tracking (No Experience, 1 Year, 2 Years, etc.)
4. **Dashboard**: Track job applications, monitor course views, view activity timeline
5. **Career Advisor AI**: 24/7 career guidance (that's you!)

**Your Role:**
- Help users navigate the CareerHub platform
- Answer questions about features, job search, courses, profile setup
- Provide career guidance, resume tips, interview advice
- Suggest relevant courses based on user background
- Explain how to use platform features effectively
- Give salary negotiation and work-life balance advice

Be friendly, professional, and provide actionable advice. Keep responses concise but informative. When users ask about platform features, explain them clearly.`,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    // Call Groq API with updated model
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Updated to current Groq model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save to database
    await db.insert(chatMessages).values({
      userId: user.id,
      message: message.trim(),
      response: aiMessage,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: aiMessage,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: aiMessage },
      ],
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}