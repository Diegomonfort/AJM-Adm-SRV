import { supabase } from '../config/supabase.js';

export const getStoreProductos = async (req, res) => {
    try {
        const { shop } = req.query;

        // Validamos la tienda
        const allowedShops = ['husqvarna', 'stihl'];
        if (!shop || !allowedShops.includes(shop.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Tienda no válida o no proporcionada. Opciones permitidas: husqvarna, stihl.'
            });
        }

        // Consultar productos activos con su categoría para obtener el index de orden
        const { data: productos, error } = await supabase
            .from('productos')
            .select(`
                id, created_at, Producto, Marca, Descripcion, Imagen, Precio, 
                Categoria, categorias(Nombre, index), 
                destacados, activo, discount, discount_value, multimedia_array, shop
            `)
            .ilike('shop', shop)
            .eq('activo', true);

        if (error) {
            console.error('Error en Supabase al obtener productos para la tienda:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Error al consultar a la base de datos.',
                error: error.message
            });
        }

        // Ordenar los productos usando el index de su categoría (menor a mayor)
        const productosOrdenados = productos ? productos.sort((a, b) => {
            const indexA = a.categorias?.index ?? 9999;
            const indexB = b.categorias?.index ?? 9999;
            return indexA - indexB;
        }) : [];

        return res.status(200).json({
            success: true,
            data: productosOrdenados,
            total: productosOrdenados.length
        });

    } catch (error) {
        console.error('Error en el endpoint del ecommerce (productos):', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
};

export const getStoreCategorias = async (req, res) => {
    try {
        const { shop } = req.query;

        // Buscamos todas las categorías de la tabla 'categorias'
        let query = supabase
            .from('categorias')
            .select('*')
            .order('index', { ascending: true });

        // Si se provee la tienda, filtramos por tienda
        if (shop) {
            query = query.ilike('shop', shop);
        }

        const { data: categorias, error } = await query;

        if (error) {
            console.error('Error al obtener categorías para la tienda:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Error al consultar a la base de datos.',
                error: error.message || error
            });
        }

        // Devolvemos las categorías encontradas
        return res.status(200).json({
            success: true,
            data: categorias || [],
            total: (categorias || []).length
        });

    } catch (error) {
        console.error('Error en el endpoint de categorías del ecommerce:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
};

export const getStoreProductoDetalle = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el ID del producto.'
            });
        }

        // Consultar el producto junto con sus especificaciones y el nombre de su categoría
        const { data: producto, error } = await supabase
            .from('productos')
            .select(`
                *,
                categorias(Nombre),
                product_specs(*)
            `)
            .eq('id', id)
            .single(); // Solo queremos un resultado

        if (error || !producto) {
            console.error('Error al obtener detalle del producto:', error?.message || 'Producto no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado.'
            });
        }

        return res.status(200).json({
            success: true,
            data: producto
        });

    } catch (error) {
        console.error('Error en el detalle de producto del ecommerce:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
};

export const getStoreDestacados = async (req, res) => {
    try {
        const { shop } = req.query;

        // Validamos la tienda
        const allowedShops = ['husqvarna', 'stihl'];
        if (!shop || !allowedShops.includes(shop.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Tienda no válida o no proporcionada. Opciones permitidas: husqvarna, stihl.'
            });
        }

        // Consultar productos destacados y activos
        const { data: productos, error } = await supabase
            .from('productos')
            .select(`
                id, created_at, Producto, Marca, Descripcion, Imagen, Precio, 
                Categoria, categorias(Nombre, index), 
                destacados, destacados_img, activo, discount, discount_value, multimedia_array, shop
            `)
            .ilike('shop', shop)
            .eq('activo', true)
            .eq('destacados', true);

        if (error) {
            console.error('Error en Supabase al obtener destacados para la tienda:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Error al consultar a la base de datos.',
                error: error.message
            });
        }

        // Devolvemos ambas imágenes para que el frontend elija cuál mostrar:
        //   - Imagen       → imagen principal del producto
        //   - destacados_img → imagen especial para la sección de destacados (puede ser null)
        return res.status(200).json({
            success: true,
            data: productos || [],
            total: (productos || []).length
        });

    } catch (error) {
        console.error('Error en el endpoint de destacados del ecommerce:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
};
