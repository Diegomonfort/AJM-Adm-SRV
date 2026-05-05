import React, { useState, useEffect, useMemo } from 'react';
import { Box, Title, Text, Button, Group, Card, Image, Loader, Notification, SimpleGrid, Badge, ActionIcon, Paper } from '@mantine/core';
import { Check, X, ArrowLeft, Save, LayoutGrid } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../config/api';

export default function RelatedProducts() {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States for Primary Product Selection
    const [selectedPrimary, setSelectedPrimary] = useState(null);
    const [primaryView, setPrimaryView] = useState('categories'); // 'categories' | 'products'
    const [primarySelectedCat, setPrimarySelectedCat] = useState(null);

    // States for Related Products Selection
    const [selectedRelated, setSelectedRelated] = useState([]); // array of product IDs
    const [relatedView, setRelatedView] = useState('categories'); // 'categories' | 'products'
    const [relatedSelectedCat, setRelatedSelectedCat] = useState(null);
    const [loadingRelated, setLoadingRelated] = useState(false);
    
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [prodRes, catRes] = await Promise.all([
                    apiFetch(`${import.meta.env.VITE_API_URL}/store/productos?shop=${activeStore.toLowerCase()}`),
                    apiFetch(`${import.meta.env.VITE_API_URL}/categories?shop=${activeStore.toLowerCase()}`)
                ]);
                
                const prodData = await prodRes.json();
                const catData = await catRes.json();
                
                if (prodData.success) {
                    setProducts(prodData.data || []);
                }
                if (catData.success) {
                    // Ordenar categorías por index
                    const cats = (catData.data || []).sort((a, b) => a.index - b.index);
                    setCategories(cats);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setNotification({ type: 'error', message: 'Error al cargar los datos.' });
            } finally {
                setLoading(false);
            }
        };

        if (activeStore) {
            fetchData();
            // Reset states when store changes
            setSelectedPrimary(null);
            setPrimaryView('categories');
            setRelatedView('categories');
            setSelectedRelated([]);
        }
    }, [activeStore]);

    // Fetch related products when primary changes
    useEffect(() => {
        const fetchRelated = async () => {
            if (!selectedPrimary) return;
            
            setLoadingRelated(true);
            try {
                const res = await apiFetch(`${import.meta.env.VITE_API_URL}/products/${selectedPrimary.id}/related`);
                const data = await res.json();
                if (data && data.success) {
                    setSelectedRelated(data.data); // array of IDs
                }
            } catch (error) {
                console.error('Error fetching related products:', error);
                setNotification({ type: 'error', message: 'Error al cargar las relaciones.' });
            } finally {
                setLoadingRelated(false);
            }
        };

        fetchRelated();
    }, [selectedPrimary]);

    const handleSave = async () => {
        if (!selectedPrimary) return;

        setSaving(true);
        try {
            const payload = {
                relatedIds: selectedRelated.map(Number)
            };
            const res = await apiFetch(`${import.meta.env.VITE_API_URL}/products/${selectedPrimary.id}/related`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data && data.success) {
                setNotification({ type: 'success', message: 'Productos relacionados actualizados correctamente.' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                setNotification({ type: 'error', message: data?.message || 'Error al guardar.' });
            }
        } catch (error) {
            console.error('Error saving related products:', error);
            setNotification({ type: 'error', message: 'Error al comunicarse con el servidor.' });
        } finally {
            setSaving(false);
        }
    };

    const toggleRelated = (prodId) => {
        setSelectedRelated(prev => 
            prev.includes(prodId) 
                ? prev.filter(id => id !== prodId) 
                : [...prev, prodId]
        );
    };

    const renderCategoryGrid = (onSelectCat) => (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
            {categories.map(cat => (
                <Card 
                    key={cat.id} 
                    shadow="sm" 
                    padding="sm" 
                    radius="md" 
                    withBorder 
                    style={{ cursor: 'pointer', transition: 'transform 0.2s, borderColor 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.borderColor = '#1c7ed6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                    onClick={() => onSelectCat(cat)}
                >
                    <Box h={100} w="100%" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                        {cat.imagen ? (
                            <Image src={cat.imagen} fit="contain" h="100%" alt={cat.Nombre} />
                        ) : (
                            <LayoutGrid size={40} color="#9CA3AF" />
                        )}
                    </Box>
                    <Text fw={600} size="sm" ta="center" mt="sm">{cat.Nombre}</Text>
                </Card>
            ))}
        </SimpleGrid>
    );

    const renderProductGrid = (categoryId, onProductClick, isRelatedView = false) => {
        const catProducts = products.filter(p => p.Categoria === categoryId);
        
        if (catProducts.length === 0) {
            return <Text c="dimmed" ta="center" py="xl">No hay productos en esta categoría.</Text>;
        }

        return (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
                {catProducts.map(p => {
                    const isSelectedAsPrimary = selectedPrimary?.id === p.id;
                    const isSelectedAsRelated = selectedRelated.includes(p.id);
                    
                    let borderColor = '#E5E7EB';
                    let bg = 'white';
                    if (isRelatedView) {
                        if (isSelectedAsPrimary) {
                            borderColor = '#fa5252'; // Red for disabled primary
                            bg = '#fff5f5';
                        } else if (isSelectedAsRelated) {
                            borderColor = '#40c057'; // Green for selected
                            bg = '#f4fce3';
                        }
                    }

                    return (
                        <Card 
                            key={p.id} 
                            shadow="sm" 
                            padding="sm" 
                            radius="md" 
                            withBorder 
                            bg={bg}
                            style={{ 
                                cursor: isRelatedView && isSelectedAsPrimary ? 'not-allowed' : 'pointer', 
                                borderColor,
                                borderWidth: isRelatedView && isSelectedAsRelated ? 2 : 1,
                                opacity: isRelatedView && isSelectedAsPrimary ? 0.6 : 1,
                                transition: 'transform 0.1s'
                            }}
                            onClick={() => {
                                if (isRelatedView) {
                                    if (!isSelectedAsPrimary) toggleRelated(p.id);
                                } else {
                                    onProductClick(p);
                                }
                            }}
                        >
                            {isRelatedView && isSelectedAsRelated && (
                                <Badge color="green" style={{ position: 'absolute', top: 5, right: 5, zIndex: 2 }}>Seleccionado</Badge>
                            )}
                            <Box h={100} w="100%" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                                {p.Imagen ? (
                                    <Image src={p.Imagen} fit="contain" h="100%" alt={p.Producto} />
                                ) : (
                                    <Text c="dimmed" size="xs">Sin foto</Text>
                                )}
                            </Box>
                            <Text fw={500} size="xs" ta="center" mt="xs" lineClamp={2} style={{ height: 32 }}>{p.Marca} {p.Producto}</Text>
                        </Card>
                    );
                })}
            </SimpleGrid>
        );
    };

    if (loading) {
        return <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Loader color={primaryColor} /></Box>;
    }

    return (
        <Box>
            <Box mb="xl">
                <Title order={2} c="dark.8">Productos Relacionados</Title>
                <Text c="dimmed" size="sm">Configura visualmente los productos recomendados que aparecerán en la tienda.</Text>
            </Box>

            {notification && (
                <Notification 
                    icon={notification.type === 'success' ? <Check size={18} /> : <X size={18} />}
                    color={notification.type === 'success' ? 'teal' : 'red'}
                    title={notification.type === 'success' ? 'Éxito' : 'Error'}
                    onClose={() => setNotification(null)}
                    mb="md"
                >
                    {notification.message}
                </Notification>
            )}

            {!selectedPrimary ? (
                // PHASE 1: SELECT PRIMARY PRODUCT
                <Paper p="xl" radius="md" withBorder shadow="sm">
                    <Title order={4} mb="md">1. Selecciona el Producto Principal</Title>
                    
                    {primaryView === 'categories' ? (
                        <>
                            <Text size="sm" c="dimmed" mb="lg">Elige una categoría para buscar el producto.</Text>
                            {renderCategoryGrid((cat) => {
                                setPrimarySelectedCat(cat);
                                setPrimaryView('products');
                            })}
                        </>
                    ) : (
                        <>
                            <Group mb="lg">
                                <Button variant="light" color="gray" size="xs" leftSection={<ArrowLeft size={16} />} onClick={() => setPrimaryView('categories')}>
                                    Volver a Categorías
                                </Button>
                                <Text fw={600} c="dark.8">{primarySelectedCat?.Nombre}</Text>
                            </Group>
                            {renderProductGrid(primarySelectedCat?.id, (p) => setSelectedPrimary(p), false)}
                        </>
                    )}
                </Paper>
            ) : (
                // PHASE 2: SELECT RELATED PRODUCTS
                <Box>
                    <Paper p="md" radius="md" withBorder shadow="sm" mb="xl" bg="gray.0">
                        <Group justify="space-between" wrap="nowrap">
                            <Group wrap="nowrap">
                                <Box w={60} h={60} style={{ borderRadius: 8, background: '#fff', border: '1px solid #eee', padding: 4 }}>
                                    <Image src={selectedPrimary.Imagen} fit="contain" h="100%" />
                                </Box>
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Producto Principal</Text>
                                    <Text fw={600} size="lg">{selectedPrimary.Marca} {selectedPrimary.Producto}</Text>
                                </Box>
                            </Group>
                            <Button variant="subtle" color="gray" onClick={() => {
                                setSelectedPrimary(null);
                                setPrimaryView('categories');
                                setRelatedView('categories');
                            }}>
                                Cambiar Producto
                            </Button>
                        </Group>
                    </Paper>

                    <Paper p="xl" radius="md" withBorder shadow="sm">
                        <Group justify="space-between" mb="lg">
                            <Title order={4}>2. Selecciona los Relacionados ({selectedRelated.length} seleccionados)</Title>
                            <Button color={primaryColor} leftSection={<Save size={18} />} onClick={handleSave} loading={saving}>
                                Guardar Relaciones
                            </Button>
                        </Group>

                        {loadingRelated ? (
                            <Group justify="center" py="xl"><Loader color={primaryColor} /></Group>
                        ) : (
                            relatedView === 'categories' ? (
                                <>
                                    <Text size="sm" c="dimmed" mb="lg">Navega por las categorías y selecciona los productos que quieres asociar.</Text>
                                    {renderCategoryGrid((cat) => {
                                        setRelatedSelectedCat(cat);
                                        setRelatedView('products');
                                    })}
                                </>
                            ) : (
                                <>
                                    <Group mb="lg">
                                        <Button variant="light" color="gray" size="xs" leftSection={<ArrowLeft size={16} />} onClick={() => setRelatedView('categories')}>
                                            Volver a Categorías
                                        </Button>
                                        <Text fw={600} c="dark.8">{relatedSelectedCat?.Nombre}</Text>
                                    </Group>
                                    {renderProductGrid(relatedSelectedCat?.id, null, true)}
                                </>
                            )
                        )}
                    </Paper>
                </Box>
            )}
        </Box>
    );
}
