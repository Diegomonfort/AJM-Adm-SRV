import React, { useState, useEffect } from 'react';
import { Modal, Text, Group, Button, TextInput, Box, ActionIcon, ScrollArea, Image, Checkbox, Select } from '@mantine/core';
import { Search, X, Save, Filter } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function SelectFeaturedModal({ opened, onClose, availableProducts, onSave, selectionRemaining }) {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);

    const [categoryFilter, setCategoryFilter] = useState('');

    // Limpiar el buscador y la selección previa cada vez que se abre el modal nuevo
    useEffect(() => {
        if (opened) {
            setSearchQuery('');
            setCategoryFilter('');
            setSelectedProducts([]);
        }
    }, [opened]);

    const filteredProducts = availableProducts.filter(p =>
        p.active &&
        (searchQuery === '' || (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()))) &&
        (categoryFilter === '' || p.category === categoryFilter)
    );

    const toggleSelection = (product) => {
        const isSelected = selectedProducts.some(p => p.id === product.id);
        if (isSelected) {
            setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
        } else {
            if (selectedProducts.length < selectionRemaining) {
                setSelectedProducts([...selectedProducts, product]);
            }
        }
    };

    const handleSave = () => {
        onSave(selectedProducts);
        onClose();
    };

    const categoryOptions = Array.from(new Set(availableProducts.map(p => p.category)));

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
            {/* HEADER */}
            <Group justify="space-between" align="flex-start" mb="lg">
                <div>
                    <Text fw={500} size="xl" c="gray.9" style={{ letterSpacing: '-0.02em' }}>
                        Seleccionar Producto
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                        Buscá y marcá los productos que querés destacar (Podés agregar {selectionRemaining - selectedProducts.length} más).
                    </Text>
                </div>
                <ActionIcon variant="subtle" color="gray" onClick={onClose} radius={0}>
                    <X size={20} />
                </ActionIcon>
            </Group>

            {/* BUSCADOR */}
            <Group grow mb="md">
                <TextInput
                    placeholder="Escribí para buscar..."
                    leftSection={<Search size={16} color="#9CA3AF" />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    radius={0}
                    size="md"
                    variant="filled"
                />
                <Select
                    placeholder="Filtrar por Categoría"
                    leftSection={<Filter size={16} color="#9CA3AF" />}
                    data={categoryOptions}
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    clearable
                    radius={0}
                    size="md"
                    variant="filled"
                />
            </Group>

            {/* LISTA DE RESULTADOS SCROLLABLE */}
            <ScrollArea h={300} type="always" offsetScrollbars bg="#F9FAFB" style={{ border: '1px solid #E5E7EB' }}>
                {filteredProducts.length === 0 ? (
                    <Text ta="center" c="dimmed" py="xl" size="sm">No se encontraron productos.</Text>
                ) : (
                    filteredProducts.map(product => {
                        const isSelected = selectedProducts.some(p => p.id === product.id);
                        const isDisabled = !isSelected && selectedProducts.length >= selectionRemaining;

                        return (
                            <Box
                                key={product.id}
                                p="md"
                                style={{
                                    borderBottom: '1px solid #E5E7EB',
                                    backgroundColor: isSelected ? 'rgba(0,0,0,0.02)' : 'white',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    opacity: isDisabled ? 0.6 : 1
                                }}
                                onClick={() => !isDisabled && toggleSelection(product)}
                            >
                                <Group justify="space-between" align="center" wrap="nowrap">
                                    <Group wrap="nowrap" gap="md">
                                        <Image src={product.image} h={40} w={40} fit="contain" style={{ mixBlendMode: 'multiply', border: '1px solid #E5E7EB', padding: 4 }} />
                                        <div>
                                            <Text fw={500} size="sm" c="gray.9" lineClamp={1}>{product.name}</Text>
                                            <Text size="xs" c="dimmed">{product.category} • ${product.price.toLocaleString('es-AR')}</Text>
                                        </div>
                                    </Group>
                                    <Checkbox
                                        color={primaryColor}
                                        size="md"
                                        radius={0}
                                        checked={isSelected}
                                        onChange={() => { }} // Handle on parent Box
                                        style={{ pointerEvents: 'none' }}
                                    />
                                </Group>
                            </Box>
                        );
                    })
                )}
            </ScrollArea>

            {/* FOOTER */}
            <Group justify="space-between" align="center" mt="lg">
                <Text size="sm" fw={500} c={selectedProducts.length > 0 ? primaryColor : 'dimmed'}>
                    {selectedProducts.length} producto(s) marcado(s)
                </Text>
                <Group>
                    <Button variant="default" onClick={onClose} radius={0} size="md">
                        Cancelar
                    </Button>
                    <Button
                        color={primaryColor}
                        radius={0}
                        size="md"
                        leftSection={<Save size={18} />}
                        onClick={handleSave}
                        disabled={selectedProducts.length === 0}
                    >
                        Guardar Selección
                    </Button>
                </Group>
            </Group>
        </Modal>
    );
}
