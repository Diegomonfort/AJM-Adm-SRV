import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Auth header missing or invalid' });
        }

        const token = authHeader.split(' ')[1];

        // Verificar el token con Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Add user info to request object
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
