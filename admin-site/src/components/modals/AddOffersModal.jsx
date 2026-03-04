import React, { useState, useEffect } from 'react';
import { Modal, Text, Group, Button, TextInput, Box, ActionIcon, ScrollArea, Image, Checkbox, Select, NumberInput, Divider } from '@mantine/core';
import { Search, X, Save, Filter, Percent } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function AddOffersModal({ opened, onClose, availableProducts, onSave }) {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [discount, setDiscount] = useState(15);

    useEffect(() => {
        if (opened) {
            setSearchQuery('');
            setCategoryFilter('');
            setSelectedProducts([]);
            setDiscount(15);
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
            setSelectedProducts([...selectedProducts, product]);
        }
    };

    const handleSave = () => {
        onSave(selectedProducts, discount);
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
            <Group justify="space-between" align="flex-start" mb="lg">
                <div>
                    <Text fw={500} size="xl" c="gray.9" style={{ letterSpacing: '-0.02em' }}>
                        Crear Ofertas Masivas
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                        Seleccioná uno o varios productos y aplicales un porcentaje de descuento.
                    </Text>
                </div>
                <ActionIcon variant="subtle" color="gray" onClick={onClose} radius={0}>
                    <X size={20} />
                </ActionIcon>
            </Group>

            <Group grow mb="md">
                <TextInput
                    placeholder="Buscar por nombre..."
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

            <ScrollArea h={300} type="always" offsetScrollbars bg="#F9FAFB" style={{ border: '1px solid #E5E7EB' }}>
                {filteredProducts.length === 0 ? (
                    <Text ta="center" c="dimmed" py="xl" size="sm">No se encontraron productos disponibles.</Text>
                ) : (
                    filteredProducts.map(product => {
                        const isSelected = selectedProducts.some(p => p.id === product.id);

                        return (
                            <Box
                                key={product.id}
                                p="md"
                                style={{
                                    borderBottom: '1px solid #E5E7EB',
                                    backgroundColor: isSelected ? 'rgba(0,0,0,0.02)' : 'white',
                                    cursor: 'pointer'
                                }}
                                onClick={() => toggleSelection(product)}
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
                                        onChange={() => { }}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                </Group>
                            </Box>
                        );
                    })
                )}
            </ScrollArea>

            <Divider my="xl" color="gray.2" />

            <Group justify="space-between" align="center">
                <Group>
                    <NumberInput
                        label={<Text fw={500} size="sm">Descuento a aplicar</Text>}
                        value={discount}
                        onChange={setDiscount}
                        rightSection={<Percent size={14} color="#9CA3AF" />}
                        min={1}
                        max={99}
                        radius={0}
                        size="md"
                        w={140}
                    />
                </Group>

                <Group align="flex-end">
                    <Text size="sm" fw={500} c={selectedProducts.length > 0 ? primaryColor : 'dimmed'}>
                        {selectedProducts.length} listos
                    </Text>
                    <Button variant="default" onClick={onClose} radius={0} size="md">
                        Cancelar
                    </Button>
                    <Button
                        color={primaryColor}
                        radius={0}
                        size="md"
                        leftSection={<Save size={18} />}
                        onClick={handleSave}
                        disabled={selectedProducts.length === 0 || !discount}
                    >
                        Crear Ofertas
                    </Button>
                </Group>
            </Group>
        </Modal>
    );
}
