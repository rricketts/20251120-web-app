import { supabase } from './supabase';

export type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
};

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

export async function getUserDataByEmail(email: string): Promise<UserData | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}
