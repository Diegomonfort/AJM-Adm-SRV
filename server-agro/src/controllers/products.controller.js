import { supabase } from '../config/supabase.js';

export const getProductsByShop = async (req, res) => {
    try {
        // Obtenemos parámetros de la query
        const { shop, page = 1, limit = 12, search = '', category = '' } = req.query;

        // Validamos la tienda
        const allowedShops = ['husqvarna', 'stihl'];
        if (!shop || !allowedShops.includes(shop.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Tienda no válida o no proporcionada. Opciones permitidas: husqvarna, stihl.'
            });
        }

        // Configuración de paginación
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum - 1;

        // Construir la consulta base
        let query = supabase
            .from('productos')
            .select(`
                id, created_at, Producto, Marca, Descripcion, Imagen, Precio, 
                Categoria, categorias(Nombre), 
                destacados, activo, discount, discount_value, multimedia_array, shop,
                destacados_img
            `, { count: 'exact' }) // Para obtener el total de registros
            .ilike('shop', shop);

        // Si hay una búsqueda, agregar filtro por nombre
        if (search) {
            query = query.ilike('Producto', `%${search}%`);
        }

        // Si hay categoría, agregar filtro exacto
        if (category) {
            query = query.eq('Categoria', category);
        }

        // Si se pide destacados
        if (req.query.destacados) {
            query = query.eq('destacados', req.query.destacados === 'true');
        }

        // Si se pide discount (ofertas)
        if (req.query.discount) {
            query = query.eq('discount', req.query.discount === 'true');
        }

        // Aplicar paginación
        const { data: products, error, count } = await query
            .range(startIndex, endIndex);

        if (error) {
            console.error('Error en Supabase al obtener productos:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Error al consultar a la base de datos.',
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(count / limitNum)
            }
        });

    } catch (error) {
        console.error('Error en el endpoint de productos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
};

export const getProductSpecs = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Se requiere el ID del producto.' });
        }

        const { data: specs, error } = await supabase
            .from('product_specs')
            .select('*')
            .eq('product_id', id);

        if (error) {
            console.error('Error al obtener especificaciones:', error);
            return res.status(500).json({ success: false, message: 'Error de base de datos.', error: error.message });
        }

        return res.status(200).json({ success: true, data: specs });
    } catch (error) {
        console.error('Error en getProductSpecs:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

export const upsertProductSpecs = async (req, res) => {
    try {
        const { id } = req.params;
        const { specs } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Se requiere el ID del producto.' });
        }

        if (!Array.isArray(specs)) {
            return res.status(400).json({ success: false, message: 'Las especificaciones (specs) deben ser un arreglo.' });
        }

        // Preparamos los datos para upsert, asegurando el product_id
        const specsToUpsert = specs.map(spec => ({
            ...spec,
            product_id: parseInt(id)
        }));

        // Upsert permite crear (si no hay id en spec) o actualizar (si sí lo hay)
        const { data, error } = await supabase
            .from('product_specs')
            .upsert(specsToUpsert)
            .select();

        if (error) {
            console.error('Error al hacer upsert de especificaciones:', error);
            return res.status(500).json({ success: false, message: 'Error de base de datos.', error: error.message });
        }

        return res.status(200).json({ success: true, message: 'Especificaciones guardadas correctamente.', data });
    } catch (error) {
        console.error('Error en upsertProductSpecs:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

export const deleteProductSpec = async (req, res) => {
    try {
        const { id, specId } = req.params;

        if (!id || !specId) {
            return res.status(400).json({ success: false, message: 'Se requiere el ID del producto y de la especificación.' });
        }

        const { error } = await supabase
            .from('product_specs')
            .delete()
            .eq('id', specId)
            .eq('product_id', id);

        if (error) {
            console.error('Error al eliminar especificación:', error);
            return res.status(500).json({ success: false, message: 'Error de base de datos.', error: error.message });
        }

        return res.status(200).json({ success: true, message: 'Especificación eliminada correctamente.' });
    } catch (error) {
        console.error('Error en deleteProductSpec:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

export const createProduct = async (req, res) => {
    try {
        const productData = req.body;

        // Ensure multimedia array is an array
        if (typeof productData.multimedia_array === 'string') {
            try {
                productData.multimedia_array = JSON.parse(productData.multimedia_array);
            } catch (e) {
                productData.multimedia_array = [];
            }
        }

        if (productData.activo === 'true' || productData.activo === 'false') {
            productData.activo = productData.activo === 'true';
        }

        if (productData.Categoria === '' || productData.Categoria === 'null') {
            productData.Categoria = null;
        }

        if (productData.Precio !== undefined) {
            productData.Precio = parseFloat(productData.Precio) || 0;
        }

        // Manejo de archivos (imagen principal y destacados_img)
        const files = req.files;
        if (files) {
            const handleUpload = async (file, fieldName) => {
                const fileExtension = file.originalname.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
                const filePath = `productos/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('fotosProductos')
                    .upload(filePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false
                    });

                if (uploadError) {
                    console.error(`Error subiendo ${fieldName} a Supabase (Product Create):`, uploadError);
                    throw new Error(`La imagen para ${fieldName} no pudo subirse.`);
                }

                const { data: publicUrlData } = supabase.storage
                    .from('fotosProductos')
                    .getPublicUrl(filePath);

                return publicUrlData.publicUrl;
            };

            if (files.imagen?.[0]) {
                productData.Imagen = await handleUpload(files.imagen[0], 'Imagen');
            } else if (req.body.imagenUrl) {
                productData.Imagen = req.body.imagenUrl;
            }

            if (files.destacados_img?.[0]) {
                productData.destacados_img = await handleUpload(files.destacados_img[0], 'destacados_img');
            } else if (req.body.destacados_img_url) {
                productData.destacados_img = req.body.destacados_img_url;
            }
        } else {
            if (req.body.imagenUrl) productData.Imagen = req.body.imagenUrl;
            if (req.body.destacados_img_url) productData.destacados_img = req.body.destacados_img_url;
        }

        // Clean up temp fields
        delete productData.imagenUrl;
        delete productData.destacados_img_url;

        const { data, error } = await supabase
            .from('productos')
            .insert([productData])
            .select();

        if (error) {
            console.error('Error al crear producto:', error);
            return res.status(500).json({ success: false, message: 'Error al crear en base de datos.', error: error.message });
        }

        return res.status(201).json({ success: true, message: 'Producto creado correctamente.', data: data[0] });
    } catch (error) {
        console.error('Error en createProduct:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Se requiere el ID del producto.' });
        }

        if (typeof productData.multimedia_array === 'string') {
            try {
                productData.multimedia_array = JSON.parse(productData.multimedia_array);
            } catch (e) {
                productData.multimedia_array = [];
            }
        }

        if (productData.activo === 'true' || productData.activo === 'false') {
            productData.activo = productData.activo === 'true';
        }

        if (productData.Categoria === '' || productData.Categoria === 'null') {
            productData.Categoria = null;
        }

        if (productData.Precio !== undefined) {
            productData.Precio = parseFloat(productData.Precio) || 0;
        }

        // Manejo de archivos (imagen principal y destacados_img)
        const files = req.files;
        if (files) {
            const handleUpload = async (file, fieldName) => {
                const fileExtension = file.originalname.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
                const filePath = `productos/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('fotosProductos')
                    .upload(filePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false
                    });

                if (uploadError) {
                    console.error(`Error subiendo ${fieldName} a Supabase:`, uploadError);
                    throw new Error(`La imagen para ${fieldName} no pudo subirse.`);
                }

                const { data: publicUrlData } = supabase.storage
                    .from('fotosProductos')
                    .getPublicUrl(filePath);

                return publicUrlData.publicUrl;
            };

            if (files.imagen?.[0]) {
                productData.Imagen = await handleUpload(files.imagen[0], 'Imagen');
            } else if (req.body.imagenUrl) {
                productData.Imagen = req.body.imagenUrl;
            }

            if (files.destacados_img?.[0]) {
                productData.destacados_img = await handleUpload(files.destacados_img[0], 'destacados_img');
            } else if (req.body.destacados_img_url) {
                productData.destacados_img = req.body.destacados_img_url;
            }
        } else {
            // Caso sin archivos (si multer se configuró diferente o no se enviaron)
            if (req.body.imagenUrl) productData.Imagen = req.body.imagenUrl;
            if (req.body.destacados_img_url) productData.destacados_img = req.body.destacados_img_url;
        }

        delete productData.imagenUrl;
        delete productData.destacados_img_url;

        const { data, error } = await supabase
            .from('productos')
            .update(productData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error al actualizar producto:', error);
            return res.status(500).json({ success: false, message: 'Error al actualizar en base de datos.', error: error.message });
        }

        return res.status(200).json({ success: true, message: 'Producto actualizado.', data: data[0] });
    } catch (error) {
        console.error('Error en updateProduct:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Se requiere el ID del producto.' });
        }

        const { error } = await supabase
            .from('productos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar producto:', error);
            return res.status(500).json({ success: false, message: 'Error de base de datos al eliminar.', error: error.message });
        }

        return res.status(200).json({ success: true, message: 'Producto eliminado correctamente.' });
    } catch (error) {
        console.error('Error en deleteProduct:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
