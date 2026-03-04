import { apiFetch } from '../config/api';
import { useState } from 'react';
import { Title, Card, Text, Button, Group, SimpleGrid, Image, ActionIcon, Menu, Badge, TextInput, Select, Box, Switch, Pagination, Popover, ScrollArea, Loader } from '@mantine/core';
import { Plus, MoreVertical, Edit, Trash2, ListTree, Search, Filter } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import EditProductModal from '../components/modals/EditProductModal';
import SpecsProductModal from '../components/modals/SpecsProductModal';
import motosierraImg from '../assets/motosierra.png';

import { useEffect } from 'react';

export default function Products() {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [opened, { open, close }] = useDisclosure(false);
    const [specsOpened, { open: openSpecs, close: closeSpecs }] = useDisclosure(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [globalCategories, setGlobalCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchOpened, setSearchOpened] = useState(false);

    const fetchProducts = async (currentPage = page, cat = categoryFilter) => {
        setLoading(true);
        try {
            const res = await apiFetch(`http://localhost:4000/api/products?shop=${activeStore.toLowerCase()}&page=${currentPage}&limit=12&category=${cat}`);
            const data = await res.json();
            if (data.success) {
                // Mapear los datos de Supabase para que coincidan con la estructura que espera la tabla.
                const mappedProducts = data.data.map(p => ({
                    id: p.id,
                    name: p.Producto,
                    price: parseFloat(p.Precio) || 0,
                    description: p.Descripcion,
                    category: p.categorias?.Nombre || 'Sin Categoría',
                    categoryId: p.Categoria ? String(p.Categoria) : '',
                    active: p.activo,
                    // Si no tiene imagen, se usa la de repuesto.
                    image: p.Imagen || motosierraImg,
                    marca: p.Marca,
                    modelo: p.Modelo,
                    modelo: p.Modelo,
                    multimedia_array: p.multimedia_array || [],
                }));
                setProducts(mappedProducts);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                }
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchOpened(false);
            setSearchResults([]);
            return;
        }

        setSearchOpened(true);
        setIsSearching(true);
        try {
            const res = await apiFetch(`http://localhost:4000/api/products?shop=${activeStore.toLowerCase()}&search=${query}&limit=5`);
            const data = await res.json();
            if (data.success) {
                setSearchResults(data.data);
            }
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await apiFetch(`http://localhost:4000/api/categories?shop=${activeStore.toLowerCase()}`);
            const data = await res.json();
            if (data.success) {
                setGlobalCategories(data.data.map(c => ({ value: String(c.id), label: c.Nombre })));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        loadCategories();
    }, [activeStore]);

    useEffect(() => {
        setCategoryFilter('');
        setPage(1);
        fetchProducts(1, '');
    }, [activeStore]);

    useEffect(() => {
        fetchProducts(page, categoryFilter);
    }, [page]);

    const handleEdit = (product) => {
        setSelectedProduct(product);
        open();
    };

    const handleSpecs = (product) => {
        setSelectedProduct(product);
        openSpecs();
    };

    const handleDelete = (product) => {
        modals.openConfirmModal({
            title: `Eliminar Producto`,
            centered: true,
            children: (
                <Text size="sm">
                    ¿Estás seguro de eliminar el producto "{product.name}"? Esta acción no se puede deshacer.
                </Text>
            ),
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const res = await apiFetch(`http://localhost:4000/api/products/${product.id}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();
                    if (data.success) {
                        notifications.show({
                            title: 'Producto eliminado',
                            message: `Se ha eliminado "${product.name}" correctamente.`,
                            color: 'teal',
                        });
                        fetchProducts(); // Recargar productos
                    } else {
                        notifications.show({
                            title: 'Error',
                            message: data.message || 'No se pudo eliminar el producto.',
                            color: 'red',
                        });
                    }
                } catch (error) {
                    console.error('Error deleting product:', error);
                    notifications.show({
                        title: 'Error de servidor',
                        message: 'Ocurrió un error al intentar eliminar el producto.',
                        color: 'red',
                    });
                }
            }
        });
    };

    const currentProducts = products;
    const categoryOptions = globalCategories;

    return (
        <div>
            <Group justify="space-between" mb="xl" align="flex-start">
                <div>
                    <Title order={2} fw={500} style={{ color: '#111827', letterSpacing: '-0.02em' }}>Productos - {activeStore}</Title>
                    <Text c="dimmed" size="sm" mt={4}>
                        Gestioná el catálogo, precios, fotos, y disponibilidad en tienda.
                    </Text>
                </div>
                <Button leftSection={<Plus size={16} strokeWidth={2.5} />} color={primaryColor} radius={0} size="md" fw={500} onClick={() => handleEdit(null)}>
                    Nuevo Producto
                </Button>
            </Group>

            {/* Toolbar for Searching and Filtering */}
            <Box bg="white" p="md" mb="xl" style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                <Group grow>
                    <Popover opened={searchOpened} onChange={setSearchOpened} width="target" position="bottom" withArrow shadow="md">
                        <Popover.Target>
                            <TextInput
                                placeholder="Buscar por nombre o modelo..."
                                leftSection={<Search size={16} color="#9CA3AF" />}
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.currentTarget.value)}
                                onClick={() => searchQuery.length >= 2 && setSearchOpened(true)}
                                radius={0}
                                size="md"
                                variant="filled"
                            />
                        </Popover.Target>
                        <Popover.Dropdown p={0}>
                            <ScrollArea.Autosize mah={300} type="scroll">
                                {isSearching ? (
                                    <Box p="md" ta="center"><Loader size="sm" color={primaryColor} /></Box>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((res) => {
                                        const mappedRes = {
                                            id: res.id,
                                            name: res.Producto,
                                            price: parseFloat(res.Precio) || 0,
                                            description: res.Descripcion,
                                            category: res.categorias?.Nombre || 'Sin Categoría',
                                            categoryId: res.Categoria ? String(res.Categoria) : '',
                                            active: res.activo,
                                            image: res.Imagen || motosierraImg,
                                            marca: res.Marca,
                                            modelo: res.Modelo,
                                            multimedia_array: res.multimedia_array || [],
                                        };
                                        return (
                                            <Box
                                                key={res.id}
                                                p="sm"
                                                style={{ borderBottom: '1px solid #E5E7EB' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <Group wrap="nowrap" justify="space-between">
                                                    <Group wrap="nowrap" style={{ flex: 1 }}>
                                                        <Image src={res.Imagen || motosierraImg} w={40} h={40} fit="contain" style={{ mixBlendMode: 'multiply' }} />
                                                        <div>
                                                            <Text size="sm" fw={500} lineClamp={1}>{res.Producto}</Text>
                                                            <Text size="xs" c="dimmed">{res.Modelo}</Text>
                                                        </div>
                                                    </Group>

                                                    <Menu withinPortal position="bottom-end" shadow="md">
                                                        <Menu.Target>
                                                            <ActionIcon variant="subtle" color="gray" radius="md">
                                                                <MoreVertical size={16} />
                                                            </ActionIcon>
                                                        </Menu.Target>
                                                        <Menu.Dropdown radius={0} p={4}>
                                                            <Menu.Item leftSection={<Edit size={16} />} onClick={() => { setSearchOpened(false); handleEdit(mappedRes); }} fw={500}>
                                                                Editar Producto
                                                            </Menu.Item>
                                                            <Menu.Item leftSection={<ListTree size={16} />} onClick={() => { setSearchOpened(false); handleSpecs(mappedRes); }} fw={500}>
                                                                Especificaciones
                                                            </Menu.Item>
                                                            <Menu.Divider />
                                                            <Menu.Item leftSection={<Trash2 size={16} />} color="red" onClick={() => { setSearchOpened(false); handleDelete(mappedRes); }} fw={500}>
                                                                Eliminar
                                                            </Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                </Group>
                                            </Box>
                                        );
                                    })
                                ) : (
                                    <Box p="md" ta="center"><Text size="sm" c="dimmed">No se encontraron resultados.</Text></Box>
                                )}
                            </ScrollArea.Autosize>
                        </Popover.Dropdown>
                    </Popover>
                    <Select
                        placeholder="Filtrar por Categoría"
                        leftSection={<Filter size={16} color="#9CA3AF" />}
                        value={categoryFilter}
                        onChange={(val) => {
                            const newCat = val || '';
                            setCategoryFilter(newCat);
                            setPage(1);
                            fetchProducts(1, newCat);
                        }}
                        data={categoryOptions}
                        clearable
                        radius={0}
                        size="md"
                        variant="filled"
                    />
                </Group>
            </Box>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="xl">
                {currentProducts.map((product) => (
                    <Card key={product.id} p="0" radius={0} bg="white" style={{
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'; }}
                    >
                        {/* Image Wrapper */}
                        <div style={{ position: 'relative', backgroundColor: '#F9FAFB', padding: '20px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid #E5E7EB' }}>
                            <Image src={product.image} h={180} w="auto" fit="contain" style={{ mixBlendMode: 'multiply' }} alt={product.name} />
                            <Badge color={primaryColor} variant="light" radius={0} size="sm" tt="uppercase" style={{ position: 'absolute', top: 12, left: 12, fontWeight: 500, letterSpacing: '0.05em' }}>
                                {product.category}
                            </Badge>
                            <Menu withinPortal position="bottom-end" shadow="md">
                                <Menu.Target>
                                    <ActionIcon variant="light" color="gray" radius={0} size="sm" style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'white', border: '1px solid #E5E7EB' }}>
                                        <MoreVertical size={16} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown radius={0} p={4} onClick={(e) => e.stopPropagation()}>
                                    <Menu.Item leftSection={<Edit size={16} />} onClick={() => handleEdit(product)} fw={500}>
                                        Editar Producto
                                    </Menu.Item>
                                    <Menu.Item leftSection={<ListTree size={16} />} onClick={() => handleSpecs(product)} fw={500}>
                                        Especificaciones
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item leftSection={<Trash2 size={16} />} color="red" onClick={() => handleDelete(product)} fw={500}>
                                        Eliminar
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </div>

                        {/* Card Info */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div>
                                <Text fw={500} size="md" lineClamp={2} title={product.name} c="gray.9" style={{ lineHeight: 1.3 }}>{product.name}</Text>
                                <Text size="xs" c="dimmed" mt={4} lineClamp={1}>{product.description}</Text>
                            </div>

                            <Group justify="space-between" align="center" mt="xl" wrap="nowrap">
                                <Text fw={500} size="xl" c="gray.9">
                                    ${product.price.toLocaleString('es-AR')}
                                </Text>

                                <Switch
                                    size="sm"
                                    color={primaryColor}
                                    checked={product.active}
                                    readOnly
                                    style={{ pointerEvents: 'none' }}
                                    aria-label="Estado del producto"
                                    onLabel="ON" offLabel="OFF"
                                />
                            </Group>
                        </div>
                    </Card>
                ))}
                {currentProducts.length === 0 && !loading && (
                    <Card p="xl" radius={0} gridColumn="1 / -1" bg="transparent" ta="center">
                        <Text c="dimmed" size="lg" fw={500}>No se encontraron productos en esta página.</Text>
                    </Card>
                )}
            </SimpleGrid>

            {totalPages > 1 && (
                <Group justify="center" mt="xl" pb="xl">
                    <Pagination
                        total={totalPages}
                        value={page}
                        onChange={setPage}
                        color={primaryColor}
                        radius={0}
                    />
                </Group>
            )}

            <EditProductModal
                opened={opened}
                onClose={close}
                product={selectedProduct}
                categories={globalCategories}
                onSave={() => {
                    close();
                    fetchProducts(); // Refetch para ver los cambios
                }}
            />

            <SpecsProductModal
                opened={specsOpened}
                onClose={closeSpecs}
                product={selectedProduct}
                onSave={(newSpecs) => {
                    closeSpecs();
                    // Aquí iría el servicio para guardar specs en DB
                    console.log('Specs guardadas:', newSpecs);
                }}
            />
        </div>
    );
}
