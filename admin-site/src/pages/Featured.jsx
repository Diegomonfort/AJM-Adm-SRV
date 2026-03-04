import { apiFetch } from '../config/api';
import { useState, useEffect } from 'react';
import { Title, Card, Text, Button, Group, SimpleGrid, Image, ActionIcon, Menu, Box, Loader } from '@mantine/core';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import SelectFeaturedModal from '../components/modals/SelectFeaturedModal';
import motosierraImg from '../assets/motosierra.png';

export default function Featured() {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [opened, { open, close }] = useDisclosure(false);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [availableToFeature, setAvailableToFeature] = useState([]);
    const [loading, setLoading] = useState(true);

    const isMaxFeatured = featuredProducts.length >= 5;

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch destacados
            const resFeatured = await apiFetch(`${import.meta.env.VITE_API_URL}/products?shop=${activeStore.toLowerCase()}&destacados=true`);
            const dataFeatured = await resFeatured.json();

            if (dataFeatured.success) {
                setFeaturedProducts(dataFeatured.data.map(p => ({
                    id: p.id,
                    name: p.Producto,
                    marca: p.Marca,
                    category: p.categorias?.Nombre || 'Sin Categoría',
                    active: p.activo,
                    price: p.Precio,
                    image: p.Imagen || motosierraImg
                })));
            }

            // Fetch todo para el modal (limit grande). Omitiendo los ya destacados.
            const resAll = await apiFetch(`${import.meta.env.VITE_API_URL}/products?shop=${activeStore.toLowerCase()}&limit=200`);
            const dataAll = await resAll.json();

            if (dataAll.success) {
                const mappedAll = dataAll.data.map(p => ({
                    id: p.id,
                    name: p.Producto,
                    marca: p.Marca,
                    category: p.categorias?.Nombre || 'Sin Categoría',
                    active: p.activo,
                    price: p.Precio,
                    image: p.Imagen || motosierraImg,
                    destacados: p.destacados
                }));
                setAvailableToFeature(mappedAll.filter(p => p.active && !p.destacados));
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeStore]);

    const updateProductStatus = async (productId, status) => {
        try {
            const res = await apiFetch(`${import.meta.env.VITE_API_URL}/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destacados: status })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            return true;
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Error', message: error.message || 'Error al actualizar', color: 'red' });
            return false;
        }
    };

    const handleRemoveFeatured = async (product) => {
        modals.openConfirmModal({
            title: `Quitar Destacado`,
            children: <Text size="sm">¿Estás seguro de quitar "{product.name}" de destacados?</Text>,
            labels: { confirm: 'Quitar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                const success = await updateProductStatus(product.id, false);
                if (success) {
                    notifications.show({ title: 'Actualizado', message: 'Se quitó de destacados.', color: 'teal' });
                    fetchData();
                }
            }
        });
    };

    const handleAddFeatured = async (selectedProducts) => {
        // Enforce max 5
        const combinedCount = featuredProducts.length + selectedProducts.length;
        if (combinedCount > 5) {
            notifications.show({ title: 'Límite alcanzado', message: 'Solo puedes tener 5 destacados.', color: 'yellow' });
            return;
        }

        let hasError = false;
        for (const p of selectedProducts) {
            const success = await updateProductStatus(p.id, true);
            if (!success) hasError = true;
        }

        if (!hasError) {
            notifications.show({ title: 'Actualizado', message: 'Se agregaron productos destacados.', color: 'teal' });
        }
        fetchData();
    };

    return (
        <div>
            <Group justify="space-between" mb="xl" align="flex-start">
                <div>
                    <Title order={2} fw={500} style={{ color: '#111827', letterSpacing: '-0.02em' }}>Productos Destacados - {activeStore}</Title>
                    <Text c="dimmed" size="sm" mt={4}>
                        Elegí hasta 5 productos clave que se mostrarán de forma estática en la página de inicio principal.
                        <Text component="span" fw={500} c={isMaxFeatured ? 'red.6' : 'gray.7'} ml={4}>
                            ({featuredProducts.length}/5 seleccionados)
                        </Text>
                    </Text>
                </div>
                <Button
                    leftSection={<Plus size={16} strokeWidth={2.5} />}
                    color={primaryColor}
                    radius={0}
                    size="md"
                    fw={500}
                    onClick={open}
                    disabled={isMaxFeatured}
                >
                    Añadir Destacado
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="xl">
                {featuredProducts.map((product) => (
                    <Card key={product.id} p="0" radius={0} bg="white" style={{
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'; }}
                    >
                        {/* Image Wrapper */}
                        <div style={{ position: 'relative', backgroundColor: '#F9FAFB', padding: '20px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid #E5E7EB' }}>
                            <Image src={product.image} h={140} w="auto" fit="contain" style={{ mixBlendMode: 'multiply' }} alt={product.name} />

                            <Menu withinPortal position="bottom-end" shadow="md">
                                <Menu.Target>
                                    <ActionIcon variant="light" color="gray" radius={0} size="sm" style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'white', border: '1px solid #E5E7EB' }}>
                                        <MoreVertical size={16} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown radius={0} p={4}>
                                    <Menu.Item leftSection={<Trash2 size={16} />} color="red" onClick={() => handleRemoveFeatured(product)} fw={500}>
                                        Quitar de Destacados
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </div>

                        {/* Card Info */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <Text fw={500} size="lg" lineClamp={2} title={product.name} c="gray.9" style={{ lineHeight: 1.3 }}>{product.name}</Text>
                        </div>
                    </Card>
                ))}
            </SimpleGrid>

            {featuredProducts.length === 0 && (
                <Card p="xl" radius={0} bg="transparent" ta="center">
                    <Text c="dimmed" size="lg" fw={500}>No hay productos destacados. Añadí el primero para que aparezca en el Inicio.</Text>
                </Card>
            )}

            <SelectFeaturedModal
                opened={opened}
                onClose={close}
                availableProducts={availableToFeature}
                onSave={handleAddFeatured}
                selectionRemaining={5 - featuredProducts.length}
            />
        </div>
    );
}
