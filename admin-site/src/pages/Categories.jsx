import { apiFetch } from '../config/api';
import { useState, useEffect } from 'react';
import { Title, Card, Text, Button, Group, SimpleGrid, Image, ActionIcon, Menu, TextInput, Box, Switch, Badge, Loader } from '@mantine/core';
import { Plus, MoreVertical, Edit, Trash2, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import EditCategoryModal from '../components/modals/EditCategoryModal';
import motosierraImg from '../assets/motosierra.png';

export default function Categories() {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [opened, { open, close }] = useDisclosure(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`${import.meta.env.VITE_API_URL}/categories?shop=${activeStore.toLowerCase()}`);
            const data = await res.json();
            if (data.success) {
                const mappedCategories = data.data.map(c => ({
                    id: c.id,
                    name: c.Nombre,
                    image: c.imagen || motosierraImg,
                    active: c.active,
                    index: c.index
                }));
                // Ordenar por índice
                mappedCategories.sort((a, b) => a.index - b.index);
                setCategories(mappedCategories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [activeStore]);

    const handleEdit = (category) => {
        setSelectedCategory(category);
        open();
    };

    const handleDelete = (category) => {
        modals.openConfirmModal({
            title: `Eliminar Categoría`,
            centered: true,
            children: (
                <Text size="sm">
                    ¿Estás seguro de eliminar la categoría "{category.name}"? Esta acción eliminará su estructura.
                </Text>
            ),
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const res = await apiFetch(`${import.meta.env.VITE_API_URL}/categories/${category.id}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();
                    if (data.success) {
                        notifications.show({
                            title: 'Categoría eliminada',
                            message: `Se ha eliminado "${category.name}" correctamente.`,
                            color: 'teal',
                        });
                        fetchCategories();
                    } else {
                        notifications.show({
                            title: 'Error',
                            message: data.message || 'No se pudo eliminar la categoría.',
                            color: 'red',
                        });
                    }
                } catch (error) {
                    console.error('Error deleting category:', error);
                    notifications.show({
                        title: 'Error del servidor',
                        message: 'Ocurrió un error al intentar eliminar la categoría.',
                        color: 'red',
                    });
                }
            }
        });
    };

    const currentCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <Group justify="space-between" mb="xl" align="flex-start">
                <div>
                    <Title order={2} fw={500} style={{ color: '#111827', letterSpacing: '-0.02em' }}>Categorías - {activeStore}</Title>
                    <Text c="dimmed" size="sm" mt={4}>
                        Organizá el catálogo mediante categorías, su orden e imágenes de portada.
                    </Text>
                </div>
                <Button leftSection={<Plus size={16} strokeWidth={2.5} />} color={primaryColor} radius={0} size="md" fw={500} onClick={() => handleEdit(null)}>
                    Nueva Categoría
                </Button>
            </Group>

            {/* Toolbar for Searching */}
            <Box bg="white" p="md" mb="xl" style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                <TextInput
                    placeholder="Buscar categorías por nombre..."
                    leftSection={<Search size={16} color="#9CA3AF" />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    radius={0}
                    size="md"
                    variant="filled"
                    styles={{ root: { maxWidth: 500 } }}
                />
            </Box>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="xl">
                {currentCategories.map((category) => (
                    <Card key={category.id} p="0" radius={0} bg="white" style={{
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
                            <Image src={category.image} h={140} w="auto" fit="contain" style={{ mixBlendMode: 'multiply' }} alt={category.name} />
                            <Badge color="gray" variant="light" radius={0} size="sm" style={{ position: 'absolute', top: 12, left: 12, fontWeight: 500 }}>
                                Índice: {category.index}
                            </Badge>
                            <Menu withinPortal position="bottom-end" shadow="md">
                                <Menu.Target>
                                    <ActionIcon variant="light" color="gray" radius={0} size="sm" style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'white', border: '1px solid #E5E7EB' }}>
                                        <MoreVertical size={16} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown radius={0} p={4} onClick={(e) => e.stopPropagation()}>
                                    <Menu.Item leftSection={<Edit size={16} />} onClick={() => handleEdit(category)} fw={500}>
                                        Editar
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item leftSection={<Trash2 size={16} />} color="red" onClick={() => handleDelete(category)} fw={500}>
                                        Eliminar
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </div>

                        {/* Card Info */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <Text fw={500} size="lg" lineClamp={2} title={category.name} c="gray.9" style={{ lineHeight: 1.3 }}>{category.name}</Text>

                            <Group justify="space-between" align="center" mt="xl" wrap="nowrap">
                                <Text fw={500} size="sm" c={category.active ? primaryColor : 'gray.5'}>
                                    {category.active ? 'Activa' : 'Inactiva'}
                                </Text>

                                <Switch
                                    size="sm"
                                    color={primaryColor}
                                    defaultChecked={category.active}
                                    style={{ pointerEvents: 'none' }}
                                    aria-label="Estado de la categoría"
                                    onLabel="ON" offLabel="OFF"
                                />
                            </Group>
                        </div>
                    </Card>
                ))}
                {currentCategories.length === 0 && (
                    <Card p="xl" radius={0} gridColumn="1 / -1" bg="transparent" ta="center">
                        <Text c="dimmed" size="lg" fw={500}>No se encontraron categorías.</Text>
                    </Card>
                )}
            </SimpleGrid>

            <EditCategoryModal
                opened={opened}
                onClose={close}
                category={selectedCategory}
                onSave={() => {
                    close();
                    fetchCategories();
                }}
            />
        </div>
    );
}
