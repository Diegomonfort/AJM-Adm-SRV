import { supabase } from '../config/supabase.js';

export const getCategories = async (req, res) => {
    try {
        const { shop } = req.query;
        let query = supabase.from('categorias').select('*').order('index', { ascending: true });

        if (shop) {
            query = query.ilike('shop', shop);
        }

        const { data: categorias, error } = await query;

        if (error) {
            console.error('Error al obtener categorías:', error.message);
            return res.status(500).json({ success: false, message: 'Error en BD' });
        }

        return res.status(200).json({
            success: true,
            data: categorias
        });
    } catch (error) {
        console.error('Error endpoint categorías:', error);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { Nombre, active = "true", index = "1", shop } = req.body;
        let imagenUrl = req.body.imagen || '';

        if (!Nombre || !shop) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        if (req.file) {
            const fileName = `categorias/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('categoriesFotos')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Error al subir imagen:', uploadError);
                return res.status(500).json({ success: false, message: 'Error al subir la imagen' });
            }

            const { data: { publicUrl } } = supabase.storage
                .from('categoriesFotos')
                .getPublicUrl(fileName);

            imagenUrl = publicUrl;
        }

        const { data, error } = await supabase
            .from('categorias')
            .insert([{
                Nombre,
                imagen: imagenUrl,
                active: active === 'true' || active === true,
                index: parseInt(index, 10),
                shop
            }])
            .select();

        if (error) throw error;

        return res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { Nombre, active, index, shop } = req.body;
        let imagenUrl = req.body.imagen; // Si llega como text (no cambió) o es vacío

        if (req.file) {
            const fileName = `categorias/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('categoriesFotos')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Error al subir imagen:', uploadError);
                return res.status(500).json({ success: false, message: 'Error al subir la imagen' });
            }

            const { data: { publicUrl } } = supabase.storage
                .from('categoriesFotos')
                .getPublicUrl(fileName);

            imagenUrl = publicUrl;
        }

        const updatePayload = {
            Nombre,
            active: active === 'true' || active === true,
            index: parseInt(index, 10),
            shop
        };
        if (imagenUrl !== undefined) {
            updatePayload.imagen = imagenUrl;
        }

        const { data, error } = await supabase
            .from('categorias')
            .update(updatePayload)
            .eq('id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });

        return res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return res.status(200).json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
