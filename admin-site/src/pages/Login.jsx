import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Box } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notifications } from '@mantine/notifications';
import logoAgro from '../assets/logoAgro512.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn(email, password);
            navigate('/');
        } catch (error) {
            console.error('Login error:', error.message);
            notifications.show({
                title: 'Error de Autenticación',
                message: 'El usuario o la contraseña son incorrectos.',
                color: 'red',
                position: 'top-center'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F3F4F6'
            }}
        >
            <Container size={420} my={40}>
                <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ borderTop: '4px solid #1c7ed6' }}>

                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <img src={logoAgro} alt="AgroJardin Logo" style={{ height: 60, width: 'auto', objectFit: 'contain' }} />
                        <Title order={2} ta="center" mt="md" mb={5} fw={600} style={{ color: '#111827' }}>
                            Panel de Administración
                        </Title>
                        <Text c="dimmed" size="sm" ta="center" mt={5}>
                            Ingrese sus credenciales para continuar
                        </Text>
                    </div>

                    <form onSubmit={handleLogin}>
                        <TextInput
                            label="Email"
                            placeholder="tucorreo@agrojardin.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                            mt="md"
                            size="md"
                        />
                        <PasswordInput
                            label="Contraseña"
                            placeholder="Su clave segura"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.currentTarget.value)}
                            mt="md"
                            size="md"
                        />

                        <Button fullWidth mt="xl" size="md" type="submit" loading={loading} color="blue.6">
                            Iniciar Sesión
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
}
