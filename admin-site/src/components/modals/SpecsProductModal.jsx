import { apiFetch } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Modal, Text, Group, Button, TextInput, Box, ActionIcon, Divider, Stack } from '@mantine/core';
import { X, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';

export default function SpecsProductModal({ opened, onClose, product, onSave }) {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [specs, setSpecs] = useState([]);
    const [newSpecName, setNewSpecName] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Cargar specs cuando se abre el modal
    useEffect(() => {
        if (opened && product) {
            setLoading(true);
            apiFetch(`${import.meta.env.VITE_API_URL}/products/${product.id}/specs`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setSpecs(data.data || []);
                    }
                })
                .catch(err => console.error('Error fetching specs:', err))
                .finally(() => setLoading(false));
        } else {
            setSpecs([]);
            setNewSpecName('');
            setNewSpecValue('');
        }
    }, [product, opened]);

    const handleAddSpec = () => {
        if (newSpecName.trim() && newSpecValue.trim()) {
            setSpecs([...specs, { atributo: newSpecName.trim(), valor: newSpecValue.trim() }]);
            setNewSpecName('');
            setNewSpecValue('');
        }
    };

    const handleRemoveSpec = async (indexToRemove) => {
        const specToRemove = specs[indexToRemove];

        if (specToRemove.id) {
            // Es una spec que ya existe en la DB, hay que eliminarla
            modals.openConfirmModal({
                title: 'Eliminar Especificación',
                centered: true,
                children: (
                    <Text size="sm">
                        ¿Estás seguro de eliminar esta especificación?
                    </Text>
                ),
                labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
                confirmProps: { color: 'red' },
                onConfirm: async () => {
                    try {
                        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/products/${product.id}/specs/${specToRemove.id}`, {
                            method: 'DELETE'
                        });
                        const data = await res.json();
                        if (data.success) {
                            setSpecs(specs.filter((_, index) => index !== indexToRemove));
                            notifications.show({
                                title: 'Eliminada',
                                message: 'La especificación fue eliminada.',
                                color: 'teal',
                            });
                        } else {
                            notifications.show({
                                title: 'Error',
                                message: 'Error al eliminar: ' + data.message,
                                color: 'red',
                            });
                        }
                    } catch (error) {
                        console.error('Error deleting spec:', error);
                        notifications.show({
                            title: 'Error de red',
                            message: 'Error al intentar eliminar la especificación.',
                            color: 'red',
                        });
                    }
                }
            });
        } else {
            // Es una spec nueva que aún no se guarda, solo la quitamos del estado
            setSpecs(specs.filter((_, index) => index !== indexToRemove));
        }
    };

    const handleUpdateSpec = (index, field, value) => {
        const updatedSpecs = [...specs];
        updatedSpecs[index] = { ...updatedSpecs[index], [field]: value };
        setSpecs(updatedSpecs);
    };

    const handleSave = async () => {
        if (!product) return;
        setSaving(true);
        try {
            const res = await apiFetch(`${import.meta.env.VITE_API_URL}/products/${product.id}/specs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ specs })
            });
            const data = await res.json();
            if (data.success) {
                notifications.show({
                    title: 'Éxito',
                    message: 'Especificaciones guardadas correctamente.',
                    color: 'teal',
                });
                onSave && onSave(specs);
                onClose();
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'Error al guardar: ' + data.message,
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error saving specs:', error);
            notifications.show({
                title: 'Error crítico',
                message: 'Error al intentar guardar las especificaciones.',
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
            {/* HEADER MINIMAL */}
            <Group justify="space-between" align="flex-start" mb="xl">
                <div>
                    <Text fw={500} size="xl" c="gray.9" style={{ letterSpacing: '-0.02em' }}>
                        Especificaciones Técnicas
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                        {product?.name ? `Gestionando especificaciones para: ${product.name}` : ''}
                    </Text>
                </div>
                <ActionIcon variant="subtle" color="gray" onClick={onClose} radius={0}>
                    <X size={20} />
                </ActionIcon>
            </Group>

            {/* BODY MINIMAL */}
            <Box mb="xl">
                <Text fw={500} size="sm" mb="sm" c="gray.8">Agregar nueva especificación</Text>
                <Group align="flex-end" mb="xl">
                    <TextInput
                        placeholder="Atributo (ej: Cilindrada)"
                        value={newSpecName}
                        onChange={(e) => setNewSpecName(e.currentTarget.value)}
                        radius={0}
                        size="md"
                        style={{ flex: 1 }}
                    />
                    <TextInput
                        placeholder="Valor (ej: 50 cc)"
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSpec();
                            }
                        }}
                        radius={0}
                        size="md"
                        style={{ flex: 1 }}
                    />
                    <Button color={primaryColor} size="md" radius={0} onClick={handleAddSpec} leftSection={<Plus size={18} />}>
                        Agregar
                    </Button>
                </Group>

                <Divider mb="xl" color="gray.2" />

                <Text fw={500} size="md" mb="md" c="gray.8">Especificaciones del producto</Text>

                {loading ? (
                    <Text c="dimmed" size="sm" ta="center" py="xl">Cargando...</Text>
                ) : specs.length === 0 ? (
                    <Text c="dimmed" size="sm" ta="center" py="xl" style={{ border: '1px dashed #E5E7EB' }}>
                        Aún no hay especificaciones agregadas.
                    </Text>
                ) : (
                    <Stack gap="sm">
                        {specs.map((spec, index) => (
                            <Group key={index} align="center" wrap="nowrap">
                                <TextInput
                                    value={spec.atributo || ''}
                                    onChange={(e) => handleUpdateSpec(index, 'atributo', e.currentTarget.value)}
                                    placeholder="Atributo"
                                    radius={0}
                                    size="sm"
                                    style={{ flex: 1 }}
                                />
                                <TextInput
                                    value={spec.valor || ''}
                                    onChange={(e) => handleUpdateSpec(index, 'valor', e.currentTarget.value)}
                                    placeholder="Valor"
                                    radius={0}
                                    size="sm"
                                    style={{ flex: 1 }}
                                />
                                <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    size="lg"
                                    radius={0}
                                    onClick={() => handleRemoveSpec(index)}
                                    title="Eliminar especificación"
                                >
                                    <Trash2 size={18} />
                                </ActionIcon>
                            </Group>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* FOOTER ACTIONS MINIMAL */}
            <Group justify="flex-end" mt={40}>
                <Button variant="default" onClick={onClose} radius={0} size="md" disabled={saving}>
                    Cancelar
                </Button>
                <Button color={primaryColor} onClick={handleSave} radius={0} size="md" loading={saving}>
                    Guardar Especificaciones
                </Button>
            </Group>
        </Modal>
    );
}
