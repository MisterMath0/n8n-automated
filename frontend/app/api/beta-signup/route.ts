import { NextRequest, NextResponse } from 'next/server';

// TODO: Replace with your actual database connection
// This is a placeholder API endpoint for collecting beta signups

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    // Basic validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // TODO: Add your database logic here
    // Example:
    // const result = await db.betaSignups.create({
    //   data: {
    //     email,
    //     name,
    //     signupDate: new Date(),
    //     source: 'landing-page'
    //   }
    // });

    // For now, just log the signup (remove this in production)
    console.log('Beta Signup:', { email, name, timestamp: new Date() });

    // TODO: Add email notification logic
    // Example:
    // await sendWelcomeEmail(email, name);
    // await notifyTeam(email, name);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully added to beta waitlist' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Beta signup error:', error);
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
