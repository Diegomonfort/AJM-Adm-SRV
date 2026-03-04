import { supabase } from '../config/supabase.js';

export const getTransactions = async (req, res) => {
    try {
        const { shop } = req.query;

        let query = supabase
            .from('transacciones')
            .select('*')
            .order('created_at', { ascending: false });

        if (shop) {
            query = query.ilike('shop', shop);
        }

        const { data: transacciones, error } = await query;

        if (error) {
            console.error('Error al obtener transacciones:', error);
            return res.status(500).json({ success: false, message: 'Error de base de datos.' });
        }

        return res.status(200).json({ success: true, data: transacciones });
    } catch (error) {
        console.error('Error en getTransactions:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
