import { apiFetch } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Modal, Text, Group, Button, TextInput, NumberInput, Switch, Box, ActionIcon, Divider, FileInput, Image, Stack } from '@mantine/core';
import { X, Upload, Link as LinkIcon } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { notifications } from '@mantine/notifications';

export default function EditCategoryModal({ opened, onClose, category, onSave }) {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [name, setName] = useState('');
    const [index, setIndex] = useState(1);
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [active, setActive] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (opened) {
            if (category) {
                setName(category.name || '');
                setIndex(category.index ?? 1);
                setImageUrl(category.image || '');
                setImageFile(null);
                setActive(category.active ?? true);
            } else {
                setName('');
                setIndex(1);
                setImageUrl('');
                setImageFile(null);
                setActive(true);
            }
        }
    }, [category, opened]);

    const handleSave = async () => {
        if (!name.trim()) {
            return notifications.show({
                title: 'Campo obligatorio',
                message: 'El nombre de la categoría es obligatorio.',
                color: 'yellow',
            });
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('Nombre', name.trim());
            formData.append('index', index);
            formData.append('active', active);
            formData.append('shop', activeStore.toLowerCase());

            if (imageFile) {
                formData.append('imagen', imageFile);
            } else {
                formData.append('imagen', imageUrl);
            }

            const url = category
                ? `http://localhost:4000/api/categories/${category.id}`
                : `http://localhost:4000/api/categories`;
            const method = category ? 'PUT' : 'POST';

            const res = await apiFetch(url, {
                method,
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                notifications.show({
                    title: 'Éxito',
                    message: `La categoría se ha guardado correctamente.`,
                    color: 'teal',
                });
                onSave && onSave();
                onClose();
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'Error al guardar: ' + data.message,
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error saving category:', error);
            notifications.show({
                title: 'Error crítico',
                message: 'Error al intentar guardar la categoría.',
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
                        {category ? 'Editar Categoría' : 'Nueva Categoría'}
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                        {category ? 'Modificá los datos de esta categoría.' : 'Creá una nueva agrupación para el catálogo.'}
                    </Text>
                </div>
                <ActionIcon variant="subtle" color="gray" onClick={onClose} radius={0}>
                    <X size={20} />
                </ActionIcon>
            </Group>

            <Box>
                <TextInput
                    label={<Text fw={500} size="sm" mb={4}>Nombre de la Categoría</Text>}
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    radius={0}
                    size="md"
                    mb="xl"
                />

                <NumberInput
                    label={<Text fw={500} size="sm" mb={4}>Índice (Orden de aparición)</Text>}
                    value={index}
                    onChange={setIndex}
                    min={0}
                    radius={0}
                    size="md"
                    mb="xl"
                />

                <Box mb="xl">
                    <Text fw={500} size="sm" mb={4}>Imagen de Portada (Sube un archivo o pega un Link)</Text>
                    <Group align="flex-start" grow mb="sm">
                        <TextInput
                            placeholder="URL de la imagen (Ej: https://...)"
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

                <Divider my="xl" color="gray.2" />

                <Box>
                    <Switch
                        label={<Text fw={500} size="sm">Categoría Activa</Text>}
                        color={primaryColor}
                        checked={active}
                        onChange={(e) => setActive(e.currentTarget.checked)}
                        size="sm"
                    />
                </Box>
            </Box>

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
