import { supabaseAdmin } from '../lib/supabase-admin';

async function createInitialUsers() {
  console.log('🚀 Starting User Creation Flow...');

  const users = [
    {
      email: 'pdektest@gmail.com',
      password: 'pdektest',
      full_name: 'Pdek Test User',
      is_admin: false
    },
    {
      email: 'pdek1991@gmail.com',
      password: 'Pdek%1991',
      full_name: 'Prashant Kadam',
      is_admin: true
    }
  ];

  for (const userData of users) {
    console.log(`\nCreating: ${userData.email}...`);
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { 
        full_name: userData.full_name,
        is_admin: userData.is_admin 
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`ℹ️ User ${userData.email} already exists.`);
        // Try to update admin flag if needed
        if (userData.is_admin) {
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            const user = existingUser.users.find(u => u.email === userData.email);
            if (user) {
                await supabaseAdmin.from('users').update({ is_admin: true }).eq('id', user.id);
                console.log(`✅ Ensured admin flag for existing user.`);
            }
        }
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    } else {
      console.log(`✅ User created: ${data.user?.id}`);
      
      // Sync to public.users table if trigger didn't handle it
      if (data.user) {
        await supabaseAdmin.from('users').upsert({
          id: data.user.id,
          email: userData.email,
          full_name: userData.full_name,
          is_admin: userData.is_admin,
          last_login: new Date().toISOString()
        });
        console.log(`✅ Synced to database table.`);
      }
    }
  }
  
  console.log('\n✨ Finished User Creation Script.');
}

createInitialUsers();
