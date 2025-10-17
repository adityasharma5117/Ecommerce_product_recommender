import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, product_id, action_type } = body;

    if (!user_id || !product_id || !action_type) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, product_id, action_type' },
        { status: 400 }
      );
    }

    if (!['view', 'add_to_cart', 'purchase'].includes(action_type)) {
      return NextResponse.json(
        { error: 'Invalid action_type. Must be: view, add_to_cart, or purchase' },
        { status: 400 }
      );
    }

    // Create a server-side Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, ensure the user exists in the users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    // If user doesn't exist in users table, create them
    if (userCheckError || !existingUser) {
      // Get user info from auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
      
      if (authError || !authUser.user) {
        console.error('User not found in auth system:', authError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Create user in users table
      const { error: insertUserError } = await supabase
        .from('users')
        .insert({
          id: user_id,
          name: authUser.user.user_metadata?.full_name || authUser.user.email || 'Unknown User',
          email: authUser.user.email || '',
        });

      if (insertUserError) {
        console.error('Error creating user:', insertUserError);
        // Continue anyway, the interaction might still work
      }
    }

    // Now insert the interaction
    const { data, error } = await supabase
      .from('user_interactions')
      .insert({
        user_id,
        product_id,
        action_type,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
    }

    return NextResponse.json({ success: true, interaction: data }, { status: 201 });
  } catch (error) {
    console.error('Error recording interaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
