import { supabase } from './supabase';

export const apiFetch = async (url, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { ...options.headers };

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return fetch(url, { ...options, headers });
};
