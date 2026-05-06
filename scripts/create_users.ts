import { supabaseAdmin } from '../lib/supabase-admin';

async function createInitialUsers() {
  console.log('🚀 Creating initial users...');

  // 1. Create pdektest user
  const { data: user1, error: error1 } = await supabaseAdmin.auth.admin.createUser({
    email: 'pdektest@example.com',
    password: 'pdektest',
    email_confirm: true
  });

  if (error1) {
    console.error('Error creating pdektest:', error1.message);
  } else {
    console.log('✅ pdektest user created:', user1.user?.id);
  }

  // 2. Create admin user
  const { data: user2, error: error2 } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@example.com',
    password: 'Pdek%1991',
    email_confirm: true,
    user_metadata: { is_admin: true }
  });

  if (error2) {
    console.error('Error creating admin:', error2.message);
  } else {
    console.log('✅ admin user created:', user2.user?.id);
    
    // Explicitly set is_admin in the users table
    if (user2.user) {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({ is_admin: true })
        .eq('id', user2.user.id);
      
      if (dbError) console.error('Error setting is_admin flag:', dbError.message);
      else console.log('✅ is_admin flag set for admin user');
    }
  }
}

createInitialUsers();
