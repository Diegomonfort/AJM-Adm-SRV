import { AppShell, Burger, Group, NavLink, Title, Avatar, Text, Menu, Box, Divider, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Home, Package, Tags, Star, Percent, Settings, LogOut, Store as StoreIcon, ChevronDown, Bell } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import logoAgro from '../assets/logoAgro512.png';
import logoHusqvarnaBlanco from '../assets/Husqvarna-Logo_blanco.png';
import logoStihl from '../assets/Stihl_Logo.png';

export default function Layout({ children }) {
    const [opened, { toggle }] = useDisclosure();
    const location = useLocation();
    const navigate = useNavigate();
    const { activeStore, setActiveStore } = useStore();
    const { signOut } = useAuth();

    const activeStoreLower = activeStore?.toLowerCase() || 'husqvarna';

    // Extraer la ruta actual para saber a dónde ir al cambiar de tienda
    const pathParts = location.pathname.split('/').filter(Boolean);
    const currentPage = pathParts.length > 1 ? pathParts[1] : 'products';

    const NAV_ITEMS = [
        { icon: Home, label: 'Dashboard', link: `/${activeStoreLower}/dashboard` },
        { icon: Package, label: 'Productos', link: `/${activeStoreLower}/products` },
        { icon: Tags, label: 'Categorías', link: `/${activeStoreLower}/categories` },
        { icon: Star, label: 'Destacados', link: `/${activeStoreLower}/featured` },
        { icon: Percent, label: 'Ofertas', link: `/${activeStoreLower}/offers` },
    ];

    const switchStore = (storeName) => {
        setActiveStore(storeName);
        navigate(`/${storeName.toLowerCase()}/${currentPage}`);
    };

    // Premium colors for Store
    const isHusqvarna = activeStore === 'Husqvarna';
    const primaryColorHex = isHusqvarna ? '#1c7ed6' : '#f76707'; // blue.6 / orange.6 mantine defaults approx
    const sidebarBg = '#0B0F19'; // Very dark blue/black
    const headerBg = '#FFFFFF';
    const textSidebar = '#A0AEC0'; // Slate 400
    const activeSidebarBg = isHusqvarna ? 'rgba(28, 126, 214, 0.15)' : 'rgba(247, 103, 7, 0.15)';

    return (
        <AppShell
            header={{ height: 70 }}
            navbar={{
                width: 260,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            bg="#F3F4F6"
        >
            <AppShell.Header bg={headerBg} style={{ borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                <Group h="100%" px="xl" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Box ml="sm">
                            <Title order={3} c="dark.8" style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500 }}>
                                <img src={logoAgro} alt="AgroJardin Logo" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
                                Admin Panel
                            </Title>
                        </Box>
                    </Group>

                    <Group gap="lg">
                        {/* Header Store Selector */}
                        <Menu shadow="xl" width={220} radius="md" position="bottom-end">
                            <Menu.Target>
                                <Box style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '8px 16px',
                                    borderRadius: 0,
                                    background: '#F9FAFB',
                                    border: '1px solid #E5E7EB',
                                    transition: 'all 0.2s',
                                    '&:hover': { background: '#F3F4F6' }
                                }}>
                                    <ThemeIcon color="green.6" variant="light" size="sm" radius={0}>
                                        <StoreIcon size={14} />
                                    </ThemeIcon>
                                    <Text fw={500} size="sm" c="gray.8">Tienda: {activeStore}</Text>
                                    <ChevronDown size={14} color="#9CA3AF" />
                                </Box>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label c="gray.5" tt="uppercase" fw={500} fz="xs">Seleccionar Entorno</Menu.Label>
                                <Menu.Item
                                    onClick={() => switchStore('Husqvarna')}
                                    bg={activeStore === 'Husqvarna' ? 'green.0' : 'transparent'}
                                    c={activeStore === 'Husqvarna' ? 'green.8' : 'gray.7'}
                                    fw={activeStore === 'Husqvarna' ? 600 : 400}
                                >
                                    Husqvarna
                                </Menu.Item>
                                <Menu.Item
                                    onClick={() => switchStore('Stihl')}
                                    bg={activeStore === 'Stihl' ? 'green.0' : 'transparent'}
                                    c={activeStore === 'Stihl' ? 'green.8' : 'gray.7'}
                                    fw={activeStore === 'Stihl' ? 600 : 400}
                                >
                                    Stihl
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>

                        {/* User Profile */}
                        <Group gap="sm" style={{ cursor: 'pointer' }}>
                            <Avatar color="green.6" radius={0} size="md">AD</Avatar>
                            <Box visibleFrom="sm">
                                <Text size="sm" fw={500} c="gray.8" style={{ lineHeight: 1 }}>Admin</Text>
                                <Text size="xs" c="gray.5" mt={4}>Gestor Principal</Text>
                            </Box>
                        </Group>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar bg={sidebarBg} style={{ borderRight: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.05)' }}>
                <Box p="xl" pb="md" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                    <img
                        src={isHusqvarna ? logoHusqvarnaBlanco : logoStihl}
                        alt={`Logo ${activeStore}`}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '60px',
                            objectFit: 'contain',
                            filter: !isHusqvarna ? 'brightness(0) invert(1)' : 'none'
                        }}
                    />
                </Box>

                <Box flex={1} px="md" mt="md">
                    <Text size="xs" fw={500} c="gray.6" tt="uppercase" lts={1} mb="sm" pl="sm">Menu Principal</Text>
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.link;
                        return (
                            <NavLink
                                key={item.label}
                                component={Link}
                                to={item.link}
                                label={item.label}
                                leftSection={<item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
                                active={isActive}
                                c={isActive ? primaryColorHex : textSidebar}
                                bg={isActive ? activeSidebarBg : 'transparent'}
                                style={{
                                    borderRadius: 0,
                                    marginBottom: 6,
                                    fontWeight: isActive ? 600 : 500,
                                    transition: 'all 0.2s ease'
                                }}
                                styles={{
                                    label: { fontSize: '0.95rem' }
                                }}
                            />
                        );
                    })}
                </Box>

                <Box p="md">
                    <Divider color="gray.8" mb="md" />
                    <Box
                        onClick={async () => {
                            await signOut();
                            navigate('/login');
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            color: '#fa5252',
                            transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(250, 82, 82, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <LogOut size={20} strokeWidth={2} />
                        <Text size="sm" fw={500}>Cerrar Sesión</Text>
                    </Box>
                </Box>
            </AppShell.Navbar>

            <AppShell.Main>
                <Box p={{ base: 'md', md: 'xl' }} style={{ maxWidth: 1400, margin: '0 auto' }}>
                    {children}
                </Box>
            </AppShell.Main>
        </AppShell>
    );
}
