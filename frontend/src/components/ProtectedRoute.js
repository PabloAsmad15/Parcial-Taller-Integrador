import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, initializing } = useAuth();
  const location = useLocation();

  // Mientras validamos el token con el backend, no redirigimos ni mostramos nada
  if (initializing) return null; // o un spinner si lo prefieres

  if (!token) {
    // Redirigir a /login si no hay token
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay token y la validación está completa, mostrar el contenido protegido
  return children;
};

export default ProtectedRoute;