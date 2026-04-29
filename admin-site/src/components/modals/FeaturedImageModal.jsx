import { apiFetch } from '../../config/api';
import React, { useState } from 'react';
import { Modal, Text, Group, Button, TextInput, FileInput, Box, ActionIcon, Image } from '@mantine/core';
import { Upload, Link as LinkIcon, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { notifications } from '@mantine/notifications';

export default function FeaturedImageModal({ opened, onClose, product, onSave }) {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (opened && product) {
            setImageUrl(product.destacados_img || '');
            setImageFile(null);
        }
    }, [product, opened]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            // Solo enviamos lo necesario para actualizar destacados_img
            formData.append('shop', activeStore.toLowerCase());

            if (imageFile) {
                formData.append('destacados_img', imageFile);
            } else {
                formData.append('destacados_img_url', imageUrl);
            }

            const res = await apiFetch(`${import.meta.env.VITE_API_URL}/products/${product.id}`, {
                method: 'PUT',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                notifications.show({
                    title: 'Éxito',
                    message: `Imagen destacada guardada correctamente.`,
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
            console.error('Error saving featured image:', error);
            notifications.show({
                title: 'Error crítico',
                message: 'Error al intentar guardar la imagen destacada.',
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
            size="lg"
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
            <Group justify="space-between" align="flex-start" mb="xl">
                <div>
                    <Text fw={500} size="xl" c="gray.9" style={{ letterSpacing: '-0.02em' }}>
                        Imagen Destacada
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                        Subí la imagen que se mostrará específicamente en la sección de destacados para "{product?.name}".
                    </Text>
                </div>
                <ActionIcon variant="subtle" color="gray" onClick={onClose} radius={0}>
                    <X size={20} />
                </ActionIcon>
            </Group>

            <Box>
                <Text fw={500} size="sm" mb={4}>Imagen (Sube un archivo o pega un Link)</Text>
                <Group align="flex-start" grow mb="sm">
                    <TextInput
                        placeholder="URL de la imagen"
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
                    <Box style={{ position: 'relative', display: 'inline-block', border: '1px solid #E5E7EB', padding: 4, borderRadius: 4, backgroundColor: 'white', marginTop: 12 }}>
                        <Image
                            src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                            height={200}
                            fit="contain"
                            fallbackSrc="https://placehold.co/200?text=Error"
                        />
                    </Box>
                )}
            </Box>

            <Group justify="flex-end" mt={40}>
                <Button variant="default" onClick={onClose} radius={0} size="md" disabled={saving}>
                    Cancelar
                </Button>
                <Button color={primaryColor} onClick={handleSave} radius={0} size="md" loading={saving}>
                    Guardar Imagen
                </Button>
            </Group>
        </Modal>
    );
}
