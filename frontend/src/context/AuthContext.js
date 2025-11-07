import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Inicializar el estado SIN esperar a useEffect para evitar
  // condiciones de carrera donde ProtectedRoute renderiza antes
  // de que el token se recupere y redirige al login.
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [token, setToken] = useState(storedToken || null);
  // Indica si la inicialización/validación del token está en curso
  const [initializing, setInitializing] = useState(true);

  // Mantener compatibilidad: escuchar cambios si es necesario
  useEffect(() => {
    if (!storedToken) {
      const t = localStorage.getItem('token');
      const u = localStorage.getItem('user');
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
      // Si no hay token en storage, marcar que la inicialización terminó
      if (!t) setInitializing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validar token con el backend en cuanto tengamos uno.
  useEffect(() => {
    if (!token) return;

    let mounted = true;
    const validate = async () => {
      try {
        const res = await fetch('http://localhost:8000/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!mounted) return;

        if (!res.ok) {
          // Token inválido: limpiar estado
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setInitializing(false);
          return;
        }

        const data = await res.json();
        setUser({ email: data.email, dni: data.dni });
        localStorage.setItem('user', JSON.stringify({ email: data.email, dni: data.dni }));
        setInitializing(false);
      } catch (err) {
        console.error('Error validando token:', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setInitializing(false);
      }
    };

    validate();
    return () => { mounted = false; };
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('Intentando login con:', { email, password });  // Debug
      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
        body: new URLSearchParams({
          'username': email,
          'password': password,
        }),
      });

      console.log('Respuesta completa:', response); // Debug

      const data = await response.json();
      console.log('Datos de respuesta:', data); // Debug

      if (!response.ok) {
        throw new Error(data.detail || 'Credenciales incorrectas');
      }

      if (!data.access_token) {
        throw new Error('No se recibió el token de acceso');
      }

      setToken(data.access_token);
      setUser({ email: email }); // Usamos el email que ya sabemos
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify({ email: email }));
      
      // Redirigir al usuario a la página principal
      window.location.href = '/';
      return true;
    } catch (error) {
      console.error('Error de login:', error);
      throw error; // Propagamos el error para manejarlo en el componente
    }
  };

  const register = async (email, dni) => {
    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          dni,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en el registro');
      }

      // Después del registro exitoso, hacer login automático usando el DNI como contraseña inicial
      return await login(email, dni);
    } catch (error) {
      console.error('Error de registro:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch('http://localhost:8000/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cambiar la contraseña');
      }

      return true;
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Asegurarnos de que ProtectedRoute no se quede esperando
    setInitializing(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, changePassword, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};