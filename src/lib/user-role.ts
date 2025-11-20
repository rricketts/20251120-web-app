import { supabase } from './supabase';

export async function getUserRole(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    return data?.role || 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user';
  }
}

export async function getUserRoleByEmail(email: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    return data?.role || 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user';
  }
}
