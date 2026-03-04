import { apiFetch } from '../config/api';
import { useState, useEffect } from 'react';
import { Title, Text, Card, Group, SimpleGrid, Paper, Badge, ThemeIcon, Progress, Avatar, ActionIcon, Loader, Center, Select, Modal, Divider, SegmentedControl, Button, ScrollArea } from '@mantine/core';
import { useStore } from '../context/StoreContext';
import { Package, Tags, Star, Percent, TrendingUp, Users, ShoppingCart, ArrowUpRight, MoreVertical, CreditCard, Clock, Eye, ArrowLeft, ReceiptText } from 'lucide-react';

export default function Dashboard() {
    const { activeStore } = useStore();
    const primaryColor = activeStore === 'Husqvarna' ? 'blue' : 'orange';

    const [transactions, setTransactions] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all');

    // View states
    const [viewMode, setViewMode] = useState('dashboard');
    const [txStatusFilter, setTxStatusFilter] = useState('all'); // 'all', 'pagados', 'pendientes'

    // Modal states
    const [selectedTx, setSelectedTx] = useState(null);
    const [modalOpened, setModalOpened] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [transRes, prodRes] = await Promise.all([
                apiFetch(`http://localhost:4000/api/transactions?shop=${activeStore.toLowerCase()}`),
                apiFetch(`http://localhost:4000/api/products?shop=${activeStore.toLowerCase()}&limit=1000`)
            ]);
            if (transRes.ok) {
                const data = await transRes.json();
                setTransactions(data.data || []);
            }
            if (prodRes.ok) {
                const data = await prodRes.json();
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeStore]);

    const calculateStats = () => {
        const now = new Date();
        const filteredTransactions = transactions.filter(t => {
            if (timeFilter === 'all') return true;
            const tDate = new Date(t.created_at);
            const diffDays = (now - tDate) / (1000 * 60 * 60 * 24);
            if (timeFilter === '90d') return diffDays <= 90;
            if (timeFilter === '30d') return diffDays <= 30;
            if (timeFilter === '7d') return diffDays <= 7;
            return true;
        });

        const pagadas = filteredTransactions.filter(t => t.estado === 0);
        const pendientes = filteredTransactions.filter(t => t.estado === 1);

        const totalIngresos = pagadas.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

        return [
            { title: 'Ingresos Totales', value: `$${totalIngresos.toLocaleString('es-UY')}`, icon: TrendingUp, color: 'blue', diff: 'En base a pagos confirmados' },
            { title: 'Pedidos Pagados', value: pagadas.length.toString(), icon: ShoppingCart, color: 'teal', diff: 'Órdenes completadas' },
            { title: 'Pedidos Pendientes', value: pendientes.length.toString(), icon: Clock, color: 'orange', diff: 'Esperando el pago' },
            { title: 'Productos Activos', value: products.filter(p => p.activo).length.toString(), icon: Package, color: 'grape', diff: 'En catálogo' },
        ];
    };

    const stats = calculateStats();

    // Top products calculation
    const productsSold = transactions.reduce((acc, t) => {
        if (t.estado === 0) { // Contar solo los pagos confirmados o todos? Depende de lo que prefieras
            let items = [];
            try {
                items = typeof t.productos === 'string' ? JSON.parse(t.productos) : t.productos;
            } catch (e) { }
            if (Array.isArray(items)) {
                items.forEach(item => {
                    acc[item.id] = (acc[item.id] || 0) + item.quantity;
                });
            }
        }
        return acc;
    }, {});

    const topProductsIds = Object.entries(productsSold).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const topProductsData = topProductsIds.map(([id, qty]) => {
        const prod = products.find(p => String(p.id) === String(id));
        return {
            name: prod ? prod.Producto : `Producto #${id}`,
            quantity: qty
        }
    });
    const maxSold = topProductsData.length > 0 ? topProductsData[0].quantity : 1;
    const categoryColors = ['green', 'orange', 'blue', 'grape'];

    return (
        <div>
            <Group justify="space-between" mb="xl" style={{ alignItems: 'flex-start' }}>
                <div>
                    <Title order={2} fw={500} style={{ letterSpacing: '-0.02em', color: '#111827' }}>
                        Dashboard - {activeStore}
                    </Title>
                    <Text c="dimmed" size="sm" mt={4}>
                        Bienvenido al panel general. Resumen de actividad de hoy.
                    </Text>
                </div>
                <Group gap="md">
                    <Select
                        data={[
                            { value: 'all', label: 'Todo el tiempo' },
                            { value: '90d', label: 'Últimos 90 días' },
                            { value: '30d', label: 'Últimos 30 días' },
                            { value: '7d', label: 'Últimos 7 días' }
                        ]}
                        value={timeFilter}
                        onChange={(val) => setTimeFilter(val)}
                        radius="md"
                        variant="default"
                        style={{ width: 160 }}
                    />
                </Group>
            </Group>

            {loading ? (
                <Center mt={50}><Loader color={primaryColor} /></Center>
            ) : viewMode === 'dashboard' ? (
                <>

                    {/* Stats Grid */}
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                        {stats.map((stat) => (
                            <Paper
                                withBorder
                                p="xl"
                                radius={0}
                                key={stat.title}
                                bg="white"
                                style={{
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                    border: '1px solid #E5E7EB',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                                    }
                                }}
                            >
                                <Group justify="space-between" mb="md" align="flex-start">
                                    <ThemeIcon variant="light" color={stat.color} size="xl" radius={0}>
                                        <stat.icon size={22} strokeWidth={2} />
                                    </ThemeIcon>
                                    <ActionIcon variant="subtle" color="gray">
                                        <MoreVertical size={16} />
                                    </ActionIcon>
                                </Group>

                                <Text size="sm" c="gray.6" fw={500} tt="uppercase" lts={1}>
                                    {stat.title}
                                </Text>

                                <Group align="flex-end" gap="xs" mt={4}>
                                    <Text style={{ fontSize: '2rem', fontWeight: 500, color: '#111827', lineHeight: 1 }}>
                                        {stat.value}
                                    </Text>
                                </Group>

                                <Group mt="lg" gap="xs">
                                    <ArrowUpRight size={16} color="#10B981" />
                                    <Text size="sm" c="green.6" fw={500}>
                                        {stat.diff}
                                    </Text>
                                </Group>
                            </Paper>
                        ))}
                    </SimpleGrid>

                    {/* Bottom Layout section */}
                    <SimpleGrid cols={{ base: 1, lg: 3 }} mt="xl" spacing="lg">
                        {/* Main Chart / List placeholder */}
                        <Card
                            withBorder
                            p="xl"
                            radius={0}
                            style={{
                                gridColumn: '1 / span 2',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #E5E7EB'
                            }}
                        >
                            <Group justify="space-between" mb="xl">
                                <div>
                                    <Title order={4} fw={500}>Ventas Recientes</Title>
                                    <Text c="dimmed" size="xs">Resumen de las últimas transacciones</Text>
                                </div>
                                <Button size="xs" variant="light" color={primaryColor} onClick={() => setViewMode('transactions')} radius="md">
                                    Ver Todos
                                </Button>
                            </Group>

                            {[...transactions].slice(0, 5).map((trans, index) => {
                                const date = new Date(trans.created_at);
                                const isPagado = trans.estado === 0;
                                return (
                                    <Group key={trans.id} justify="space-between" style={{ borderBottom: index < 4 ? '1px solid #F3F4F6' : 'none', padding: '12px 0' }}>
                                        <Group>
                                            <Avatar color={isPagado ? 'green' : 'orange'} radius={0} variant="light">
                                                {isPagado ? <ShoppingCart size={20} /> : <Clock size={20} />}
                                            </Avatar>
                                            <div>
                                                <Text fw={500} size="sm" lineClamp={1}>{trans.nombre_completo}</Text>
                                                <Text size="xs" c="dimmed">{date.toLocaleDateString()} - {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                            </div>
                                        </Group>
                                        <Group gap="sm">
                                            <div>
                                                <Text fw={500} size="sm" ta="right">${parseFloat(trans.total).toLocaleString('es-UY')}</Text>
                                                <Text size="xs" ta="right" c={isPagado ? 'green.6' : 'orange.6'} fw={600}>
                                                    {isPagado ? 'COMPLETADO' : 'PENDIENTE'}
                                                </Text>
                                            </div>
                                            <ActionIcon variant="subtle" color="gray" onClick={() => {
                                                setSelectedTx(trans);
                                                setModalOpened(true);
                                            }} radius="xl" size="lg">
                                                <Eye size={20} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                );
                            })}
                            {transactions.length === 0 && (
                                <Text size="sm" c="dimmed" ta="center" mt="md">No hay pedidos registrados.</Text>
                            )}
                        </Card>

                        {/* Top Products */}
                        <Card
                            withBorder
                            p="xl"
                            radius={0}
                            style={{
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #E5E7EB'
                            }}
                        >
                            <Title order={4} fw={500} mb="xl">Productos Más Vendidos</Title>

                            {topProductsData.length > 0 ? topProductsData.map((prodData, idx) => {
                                const percent = Math.round((prodData.quantity / maxSold) * 100);
                                const currentColor = categoryColors[idx % categoryColors.length];
                                return (
                                    <div key={prodData.name} style={{ marginBottom: 20 }}>
                                        <Group justify="space-between" mb={8}>
                                            <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>{prodData.name}</Text>
                                            <Text size="sm" c="dimmed" ml="xs">{prodData.quantity} uds</Text>
                                        </Group>
                                        <Progress value={percent} color={currentColor} size="md" radius={0} />
                                    </div>
                                )
                            }) : (
                                <Text size="sm" c="dimmed" ta="center">Aún no hay ventas registradas.</Text>
                            )}
                        </Card>
                    </SimpleGrid>
                </>
            ) : (
                <Card withBorder radius="md" p="xl" style={{ border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <Group justify="space-between" mb="lg">
                        <Group>
                            <ActionIcon variant="light" color="gray" onClick={() => setViewMode('dashboard')} radius="md" size="lg">
                                <ArrowLeft size={20} />
                            </ActionIcon>
                            <Title order={3} fw={500}>Todas las Transacciones</Title>
                        </Group>
                        <SegmentedControl
                            value={txStatusFilter}
                            onChange={setTxStatusFilter}
                            data={[
                                { label: 'Todas', value: 'all' },
                                { label: 'Completadas', value: 'pagadas' },
                                { label: 'Pendientes', value: 'pendientes' },
                            ]}
                            color={primaryColor}
                        />
                    </Group>

                    <ScrollArea style={{ height: 600 }}>
                        {transactions
                            .filter(t => {
                                if (txStatusFilter === 'pagadas') return t.estado === 0;
                                if (txStatusFilter === 'pendientes') return t.estado === 1;
                                return true;
                            })
                            .map((trans, index) => {
                                const date = new Date(trans.created_at);
                                const isPagado = trans.estado === 0;
                                return (
                                    <Group key={trans.id} justify="space-between" mb="xs" p="md" style={{
                                        borderRadius: '8px',
                                        backgroundColor: index % 2 === 0 ? '#F9FAFB' : '#FFF',
                                        border: '1px solid #F3F4F6'
                                    }}>
                                        <Group>
                                            <Avatar color={isPagado ? 'green' : 'orange'} radius="xl" variant="light" size="lg">
                                                {isPagado ? <ShoppingCart size={22} /> : <Clock size={22} />}
                                            </Avatar>
                                            <div>
                                                <Text fw={600} size="sm">{trans.nombre_completo}</Text>
                                                <Text size="xs" c="dimmed">{trans.email} • {trans.celular}</Text>
                                                <Text size="xs" c="dimmed" mt={4}>{date.toLocaleDateString()} a las {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                            </div>
                                        </Group>
                                        <Group gap="xl">
                                            <div style={{ textAlign: 'right' }}>
                                                <Text fw={700} size="md" c="dark.9">${parseFloat(trans.total).toLocaleString('es-UY')}</Text>
                                                <Badge
                                                    color={isPagado ? 'green' : 'orange'}
                                                    variant="light"
                                                    size="sm"
                                                    radius="sm"
                                                >
                                                    {isPagado ? 'Completado' : 'Pendiente'}
                                                </Badge>
                                            </div>
                                            <Button variant="subtle" color="gray" size="xs" onClick={() => {
                                                setSelectedTx(trans);
                                                setModalOpened(true);
                                            }} rightSection={<ArrowUpRight size={14} />}>
                                                Ver Detalles
                                            </Button>
                                        </Group>
                                    </Group>
                                );
                            })}
                        {transactions.length === 0 && (
                            <Center style={{ height: 200 }}>
                                <Text c="dimmed">No se encontraron ventas para este filtro.</Text>
                            </Center>
                        )}
                    </ScrollArea>
                </Card>
            )}

            {/* Transaction Modal */}
            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title={
                    <Group gap="xs">
                        <ThemeIcon variant="light" color={primaryColor} size="lg" radius="md">
                            <ReceiptText size={20} />
                        </ThemeIcon>
                        <Text fw={600} size="lg">Detalle de Operación</Text>
                    </Group>
                }
                size="xl"
                radius="md"
                padding="xl"
                overlayProps={{ opacity: 0.5, blur: 2 }}
                styles={{ header: { paddingBottom: 0 } }}
            >
                {selectedTx && (
                    <div>
                        <Group justify="space-between" mt="md" mb="xl">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={1}>ID de Boleta</Text>
                                <Text size="md" fw={500} c="dark.9" style={{ fontFamily: 'monospace' }}>{selectedTx.id}</Text>
                            </div>
                            <Badge color={selectedTx.estado === 0 ? 'green' : 'orange'} size="xl" radius="sm" variant="filled">
                                {selectedTx.estado === 0 ? 'PAGO CONFIRMADO' : 'PENDIENTE DE PAGO'}
                            </Badge>
                        </Group>

                        <Paper withBorder p="lg" radius="md" bg="gray.0" mb="xl" style={{ border: '1px solid #E5E7EB' }}>
                            <SimpleGrid cols={2} spacing="xl">
                                <div>
                                    <Text size="xs" c="gray.6" tt="uppercase" fw={600} mb={4}>Cliente</Text>
                                    <Text size="sm" fw={500} c="dark.9">{selectedTx.nombre_completo}</Text>
                                    <Text size="sm" c="dimmed">{selectedTx.email}</Text>
                                    <Text size="sm" c="dimmed">{selectedTx.celular}</Text>
                                </div>
                                <div>
                                    <Text size="xs" c="gray.6" tt="uppercase" fw={600} mb={4}>Entrega a Domicilio</Text>
                                    <Text size="sm" fw={500} c="dark.9">{selectedTx.direccion}</Text>
                                    <Text size="sm" c="dimmed">{selectedTx.departamento}</Text>
                                    <Text size="sm" c="dimmed">C.P. {selectedTx.codigo_postal}</Text>
                                </div>
                            </SimpleGrid>
                        </Paper>

                        <Text size="sm" fw={600} mb="sm" tt="uppercase" c="gray.7">Artículos Adquiridos</Text>
                        <Paper withBorder radius="md" style={{ overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                            {(() => {
                                let items = [];
                                try {
                                    items = typeof selectedTx.productos === 'string' ? JSON.parse(selectedTx.productos) : selectedTx.productos;
                                } catch (e) { }
                                return items.map((item, idx) => {
                                    const prod = products.find(p => String(p.id) === String(item.id));
                                    return (
                                        <Group key={idx} justify="space-between" p="md" style={{ borderBottom: idx < items.length - 1 ? '1px solid #F3F4F6' : 'none', backgroundColor: idx % 2 === 0 ? '#FFF' : '#F9FAFB' }}>
                                            <Group gap="sm">
                                                <ThemeIcon variant="light" color="gray" size="md" radius="sm">
                                                    <Package size={14} />
                                                </ThemeIcon>
                                                <Text size="sm" fw={500} c="dark.9">{prod ? prod.Producto : `Producto ID ${item.id}`}</Text>
                                            </Group>
                                            <Text size="sm" fw={600} c="gray.6">x{item.quantity}</Text>
                                        </Group>
                                    )
                                })
                            })()}
                        </Paper>

                        <Group justify="flex-end" mt="xl" pt="xl" style={{ borderTop: '2px dashed #D1D5DB' }}>
                            <div style={{ textAlign: 'right' }}>
                                <Text size="sm" c="dimmed" tt="uppercase" fw={600} mb={2}>Costo Final</Text>
                                <Text style={{ fontSize: '2.5rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                                    ${parseFloat(selectedTx.total).toLocaleString('es-UY')}
                                </Text>
                                <Text size="xs" c="dimmed" mt={4}>Impuestos incluidos</Text>
                            </div>
                        </Group>
                    </div>
                )}
            </Modal>
        </div >
    );
}
