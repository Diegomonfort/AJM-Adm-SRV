import { apiFetch } from '../../config/api';
import React, { useState } from 'react';
import { Modal, Text, Group, Button, TextInput, NumberInput, Textarea, Select, FileInput, SimpleGrid, Switch, Box, ActionIcon, Divider, Badge, Image } from '@mantine/core';
import { Upload, Link as LinkIcon, X, Plus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { notifications } from '@mantine/notifications';

export default function EditProductModal({ opened, onClose, product, onSave, categories = [] }) {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price || 0);
    const [description, setDescription] = useState(product?.description || '');
    const [category, setCategory] = useState(product?.categoryId || '');
    const [active, setActive] = useState(product?.active ?? true);
    const [saving, setSaving] = useState(false);

    const [multimediaArray, setMultimediaArray] = useState(product?.multimedia_array || []);
    const [currentUrl, setCurrentUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');

    React.useEffect(() => {
        if (opened) {
            if (product) {
                setName(product.name || '');
                setPrice(product.price || 0);
                setDescription(product.description || '');
                setCategory(product.categoryId || '');
                setActive(product.active ?? true);
                setMultimediaArray(product.multimedia_array || []);
                setImageUrl(product.image || '');
                setImageFile(null);
            } else {
                setName('');
                setPrice(0);
                setDescription('');
                setCategory('');
                setActive(true);
                setMultimediaArray([]);
                setCurrentUrl('');
                setImageUrl('');
                setImageFile(null);
            }
        }
    }, [product, opened]);

    const handleAddUrl = () => {
        if (currentUrl.trim() && !multimediaArray.includes(currentUrl.trim())) {
            setMultimediaArray([...multimediaArray, currentUrl.trim()]);
            setCurrentUrl('');
        }
    };

    const handleRemoveUrl = (urlToRemove) => {
        setMultimediaArray(multimediaArray.filter(url => url !== urlToRemove));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            return notifications.show({
                title: 'Campo obligatorio',
                message: 'El nombre del producto es obligatorio.',
                color: 'yellow',
            });
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('Producto', name.trim());
            formData.append('Precio', price || 0);
            formData.append('Descripcion', description.trim());
            formData.append('Categoria', category);
            formData.append('activo', active);
            formData.append('multimedia_array', JSON.stringify(multimediaArray));
            formData.append('shop', activeStore.toLowerCase());

            if (imageFile) {
                formData.append('imagen', imageFile);
            } else {
                formData.append('imagenUrl', imageUrl);
            }

            const url = product
                ? `${import.meta.env.VITE_API_URL}/products/${product.id}`
                : `${import.meta.env.VITE_API_URL}/products`;
            const method = product ? 'PUT' : 'POST';

            const res = await apiFetch(url, {
                method,
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                notifications.show({
                    title: 'Éxito',
                    message: `El producto se ha guardado correctamente.`,
                    color: 'teal',
                });
                onSave && onSave(data.data);
                onClose();
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'Error al guardar: ' + data.message,
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error saving product:', error);
            notifications.show({
                title: 'Error crítico',
                message: 'Error al intentar guardar el producto.',
                color: 'red',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="xl"
            padding="xl"
            withCloseButton={false}
            radius={0}
            overlayProps={{ blur: 1, backgroundOpacity: 0.1 }}
            styles={{
                content: {
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }
            }}
        >
            {/* HEADER MINIMAL */}
            <Group justify="space-between" align="flex-start" mb="xl">
                <div>
                    <Text fw={500} size="xl" c="gray.9" style={{ letterSpacing: '-0.02em' }}>
                        {product ? 'Editar Producto' : 'Nuevo Producto'}
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                        {product ? 'Actualizá los detalles de este artículo en el catálogo.' : 'Ingresá los datos para agregar un nuevo artículo al catálogo.'}
                    </Text>
                </div>
                <ActionIcon variant="subtle" color="gray" onClick={onClose} radius={0}>
                    <X size={20} />
                </ActionIcon>
            </Group>

            {/* BODY MINIMAL */}
            <Box>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                    <TextInput
                        label={<Text fw={500} size="sm" mb={4}>Nombre del Producto</Text>}
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                        radius={0}
                        size="md"
                    />
                    <NumberInput
                        label={<Text fw={500} size="sm" mb={4}>Precio Final</Text>}
                        value={price}
                        onChange={setPrice}
                        decimalSeparator=","
                        thousandsSeparator="."
                        prefix="$ "
                        radius={0}
                        size="md"
                    />
                </SimpleGrid>

                <Textarea
                    label={<Text fw={500} size="sm" mb={4} mt="xl">Descripción Corta</Text>}
                    minRows={3}
                    value={description}
                    onChange={(e) => setDescription(e.currentTarget.value)}
                    radius={0}
                    size="md"
                />

                <Divider my="xl" color="gray.2" />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                    <Select
                        label={<Text fw={500} size="sm" mb={4}>Categoría</Text>}
                        value={category}
                        onChange={setCategory}
                        data={categories}
                        radius={0}
                        size="md"
                    />
                </SimpleGrid>

                <Box mt="xl">
                    <Text fw={500} size="sm" mb={4}>Imagen de Portada (Sube un archivo o pega un Link)</Text>
                    <Group align="flex-start" grow mb="sm">
                        <TextInput
                            placeholder="URL de la imagen principal"
                            leftSection={<LinkIcon size={16} c="gray.5" />}
                            value={imageUrl}
                            onChange={(e) => {
                                setImageUrl(e.currentTarget.value);
                                if (e.currentTarget.value) setImageFile(null);
                            }}
                            radius={0}
                            size="md"
                        />
                        <FileInput
                            placeholder={imageFile ? imageFile.name : "O subir desde PC..."}
                            leftSection={<Upload size={16} c="gray.5" />}
                            accept="image/png,image/jpeg,image/webp"
                            value={imageFile}
                            onChange={(file) => {
                                setImageFile(file);
                                if (file) setImageUrl('');
                            }}
                            radius={0}
                            size="md"
                            clearable
                        />
                    </Group>

                    {(imageUrl || imageFile) && (
                        <Box style={{ position: 'relative', display: 'inline-block', border: '1px solid #E5E7EB', padding: 4, borderRadius: 4, backgroundColor: 'white' }}>
                            <Image
                                src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                                height={120}
                                fit="contain"
                                fallbackSrc="https://placehold.co/120?text=Error"
                            />
                            <ActionIcon
                                color="red"
                                variant="filled"
                                size="sm"
                                radius="xl"
                                style={{ position: 'absolute', top: -10, right: -10, zIndex: 10 }}
                                onClick={() => {
                                    setImageUrl('');
                                    setImageFile(null);
                                }}
                            >
                                <X size={14} />
                            </ActionIcon>
                        </Box>
                    )}
                </Box>

                <Box mt="xl">
                    <Text fw={500} size="sm" mb={4}>Imágenes Secundarias y Multimedia (URLs)</Text>
                    <Group mb="sm">
                        <TextInput
                            placeholder="https://sys.feli.com.uy/images/products/H...png"
                            leftSection={<LinkIcon size={16} c="gray.5" />}
                            radius={0}
                            size="md"
                            flex={1}
                            value={currentUrl}
                            onChange={(e) => setCurrentUrl(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddUrl();
                                }
                            }}
                        />
                        <Button color={primaryColor} radius={0} size="md" onClick={handleAddUrl} leftSection={<Plus size={16} />}>
                            Agregar URL
                        </Button>
                    </Group>

                    {multimediaArray.length > 0 && (
                        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm" mt="sm">
                            {multimediaArray.map((url, index) => (
                                <Box key={index} style={{ position: 'relative', border: '1px solid #E5E7EB', padding: 4, borderRadius: 0, backgroundColor: 'white' }}>
                                    <Image
                                        src={url}
                                        height={100}
                                        fit="contain"
                                        fallbackSrc="https://placehold.co/100x100?text=Error"
                                    />
                                    <ActionIcon
                                        color="red"
                                        variant="filled"
                                        size="xs"
                                        radius="xl"
                                        style={{ position: 'absolute', top: -8, right: -8, zIndex: 2 }}
                                        onClick={() => handleRemoveUrl(url)}
                                    >
                                        <X size={12} strokeWidth={3} />
                                    </ActionIcon>
                                </Box>
                            ))}
                        </SimpleGrid>
                    )}
                </Box>

                <Divider my="xl" color="gray.2" />

                <Box>
                    <Switch
                        label={<Text fw={500} size="sm">Activo</Text>}
                        color={primaryColor}
                        checked={active}
                        onChange={(e) => setActive(e.currentTarget.checked)}
                        size="sm"
                    />
                </Box>
            </Box>

            {/* FOOTER ACTIONS MINIMAL */}
            <Group justify="flex-end" mt={40}>
                <Button variant="default" onClick={onClose} radius={0} size="md" disabled={saving}>
                    Cancelar
                </Button>
                <Button color={primaryColor} onClick={handleSave} radius={0} size="md" loading={saving}>
                    Guardar Cambios
                </Button>
            </Group>
        </Modal>
    );
}
