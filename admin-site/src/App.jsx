import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Featured from './pages/Featured';
import Offers from './pages/Offers';
import Login from './pages/Login';
import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function StoreWrapper() {
  const { store } = useParams();
  const { setActiveStore } = useStore();

  useEffect(() => {
    if (store === 'husqvarna' || store === 'stihl') {
      setActiveStore(store.charAt(0).toUpperCase() + store.slice(1));
    }
  }, [store, setActiveStore]);

  return (
    <Layout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="featured" element={<Featured />} />
        <Route path="offers" element={<Offers />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<Navigate to="/husqvarna/products" replace />} />
            <Route path="/:store/*" element={<ProtectedRoute><StoreWrapper /></ProtectedRoute>} />
          </Routes>
        </Router>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
