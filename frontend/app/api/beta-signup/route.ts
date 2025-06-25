import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('beta_signups')
      .insert([
        { email, name }
      ]);

    if (error) {
      if (error.code === '23505') { // Unique violation code
        return NextResponse.json({ error: 'This email is already signed up for beta access.' }, { status: 409 });
      }
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to sign up for beta access' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully signed up for beta access!', data }, { status: 200 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 