import { apiFetch } from '../config/api';
import { useState, useEffect } from 'react';
import { Title, Card, Text, Button, Group, SimpleGrid, Image, ActionIcon, Menu, Box, Badge, Loader } from '@mantine/core';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import AddOffersModal from '../components/modals/AddOffersModal';
import motosierraImg from '../assets/motosierra.png';

export default function Offers() {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [opened, { open, close }] = useDisclosure(false);

    const [currentOffers, setCurrentOffers] = useState([]);
    const [availableToOffer, setAvailableToOffer] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Obtener las ofertas actuales
            const resOffers = await apiFetch(`http://localhost:4000/api/products?shop=${activeStore.toLowerCase()}&discount=true`);
            const dataOffers = await resOffers.json();

            if (dataOffers.success) {
                setCurrentOffers(dataOffers.data.map(p => {
                    const discountAmount = p.Precio * (p.discount_value / 100);
                    return {
                        id: p.id,
                        name: p.Producto,
                        marca: p.Marca,
                        category: p.categorias?.Nombre || 'Sin Categoría',
                        active: p.activo,
                        price: p.Precio,
                        image: p.Imagen || motosierraImg,
                        discount: p.discount_value,
                        newPrice: p.Precio - discountAmount
                    };
                }));
            }

            // Obtener todos para el modal (omitiendo los que ya están en oferta)
            const resAll = await apiFetch(`http://localhost:4000/api/products?shop=${activeStore.toLowerCase()}&limit=200`);
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
                    isDiscounted: p.discount
                }));
                setAvailableToOffer(mappedAll.filter(p => p.active && !p.isDiscounted));
            }

        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeStore]);

    const updateProductOffer = async (productId, status, discountValue = 0) => {
        try {
            const res = await apiFetch(`http://localhost:4000/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discount: status, discount_value: discountValue })
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

    const handleRemoveOffer = (product) => {
        modals.openConfirmModal({
            title: `Quitar Oferta`,
            children: <Text size="sm">¿Estás seguro de quitar la oferta de "{product.name}"?</Text>,
            labels: { confirm: 'Quitar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                const success = await updateProductOffer(product.id, false, 0);
                if (success) {
                    notifications.show({ title: 'Oferta removida', message: 'El producto volvió a su precio normal.', color: 'teal' });
                    fetchData();
                }
            }
        });
    };

    const handleSaveOffers = async (selectedProducts, discount) => {
        let hasError = false;
        for (const p of selectedProducts) {
            const success = await updateProductOffer(p.id, true, discount);
            if (!success) hasError = true;
        }

        if (!hasError) {
            notifications.show({ title: 'Ofertas Creadas', message: 'Se aplicaron los descuentos a los productos seleccionados.', color: 'teal' });
        }
        fetchData();
    };

    return (
        <div>
            <Group justify="space-between" mb="xl" align="flex-start">
                <div>
                    <Title order={2} fw={500} style={{ color: '#111827', letterSpacing: '-0.02em' }}>Ofertas Especiales - {activeStore}</Title>
                    <Text c="dimmed" size="sm" mt={4}>
                        Creá descuentos masivos para grupos de productos.
                    </Text>
                </div>
                <Button
                    leftSection={<Plus size={16} strokeWidth={2.5} />}
                    color={primaryColor}
                    radius={0}
                    size="md"
                    fw={500}
                    onClick={open}
                >
                    Añadir Ofertas
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="xl">
                {currentOffers.map((product) => (
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

                            <Badge color="red" variant="filled" radius={0} size="lg" style={{ position: 'absolute', top: 12, left: 12, fontWeight: 500 }}>
                                -{product.discount}% OFF
                            </Badge>

                            <Menu withinPortal position="bottom-end" shadow="md">
                                <Menu.Target>
                                    <ActionIcon variant="light" color="gray" radius={0} size="sm" style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'white', border: '1px solid #E5E7EB' }}>
                                        <MoreVertical size={16} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown radius={0} p={4}>
                                    <Menu.Item leftSection={<Trash2 size={16} />} color="red" onClick={() => handleRemoveOffer(product)} fw={500}>
                                        Quitar Oferta
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </div>

                        {/* Card Info */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <Text fw={500} size="lg" lineClamp={2} title={product.name} c="gray.9" style={{ lineHeight: 1.3 }}>{product.name}</Text>

                            <Group mt="md" align="center" gap="sm">
                                <Text fw={500} size="xl" c={`${primaryColor}.6`}>
                                    ${product.newPrice.toLocaleString('es-AR')}
                                </Text>
                                <Text size="sm" c="dimmed" style={{ textDecoration: 'line-through' }}>
                                    ${product.price.toLocaleString('es-AR')}
                                </Text>
                            </Group>
                        </div>
                    </Card>
                ))}
            </SimpleGrid>

            {currentOffers.length === 0 && (
                <Card p="xl" radius={0} bg="transparent" ta="center">
                    <Text c="dimmed" size="lg" fw={500}>No hay ofertas activas. Creá descuentos llamativos para tus ventas.</Text>
                </Card>
            )}

            <AddOffersModal
                opened={opened}
                onClose={close}
                availableProducts={availableToOffer}
                onSave={handleSaveOffers}
            />
        </div>
    );
}
