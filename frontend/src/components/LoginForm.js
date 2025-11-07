import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginForm.css';

const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  // recoveringStep: 0 = enviar email para verificar, 1 = formulario dni + nueva contraseña
  const [recoveringStep, setRecoveringStep] = useState(0);
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register, changePassword } = useAuth();

  const validateEmail = (email) => {
    return email.endsWith('@upao.edu.pe');
  };

  const validateDni = (dni) => {
    if (!/^\d{8}$/.test(dni)) {
      throw new Error('La contraseña debe ser un DNI de 8 dígitos');
    }
    return true;
  };

  const validatePassword = (password) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Flujo de recuperación (nuevo): primero verificar email, luego permitir reset con DNI
    if (isRecovering) {
      // Paso 0: verificar email
      if (recoveringStep === 0) {
        if (!validateEmail(email)) {
          setError('Debe usar un correo UPAO (@upao.edu.pe)');
          return;
        }
        try {
          const res = await fetch('http://localhost:8000/recover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (!res.ok || data.exists === false) {
            setError(data.message || 'Correo no registrado');
            return;
          }
          // Avanzar al siguiente paso del flujo (dni + nueva contraseña)
          setRecoveringStep(1);
          return;
        } catch (err) {
          setError('Error verificando correo: ' + err.message);
          return;
        }
      }

      // Paso 1: dni + nueva contraseña -> llamar a reset-password
      if (recoveringStep === 1) {
        if (newPassword !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }
        if (!validatePassword(newPassword)) {
          setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
          return;
        }
        if (!/^[0-9]{8}$/.test(dni)) {
          setError('DNI inválido. Debe tener 8 dígitos');
          return;
        }
        try {
          const res = await fetch('http://localhost:8000/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, dni, new_password: newPassword })
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.detail || data.message || 'Error al actualizar contraseña');
            return;
          }
          // Reset exitoso: retornar a login
          setIsRecovering(false);
          setRecoveringStep(0);
          setNewPassword('');
          setConfirmPassword('');
          setDni('');
          setPassword('');
          setError('Contraseña actualizada correctamente. Inicie sesión con la nueva contraseña.');
          return;
        } catch (err) {
          setError('Error al actualizar contraseña: ' + err.message);
          return;
        }
      }
    }

    if (isChangingPassword) {
      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (!validatePassword(newPassword)) {
        setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
        return;
      }
      try {
        await changePassword(password, newPassword);
        setIsChangingPassword(false);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    if (!validateEmail(email)) {
      setError('Debe usar un correo UPAO (@upao.edu.pe)');
      return;
    }

    try {
      if (isLogin) {
        console.log('Intentando iniciar sesión...'); // Debug
        try {
          await login(email, password);
          // El login fue exitoso si llegamos aquí
          // La redirección se maneja en AuthContext
        } catch (error) {
          console.error('Error en login:', error);
          setError(error.message || 'Credenciales incorrectas');
          return;
        }
      } else {
        try {
        validateDni(dni);
      } catch (err) {
        setError(err.message);
        return;
      }
        try {
          const success = await register(email, dni);
          if (success) {
            // Login automático después del registro
            const loginSuccess = await login(email, dni);
            if (loginSuccess) {
              window.location.href = '/';
            }
          }
        } catch (error) {
          setError(error.message);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>
          {isRecovering ? (recoveringStep === 0 ? 'Recuperar Contraseña' : 'Actualizar Contraseña') :
          (isChangingPassword 
            ? 'Cambiar Contraseña'
            : isLogin 
              ? 'Iniciar Sesión' 
              : 'Registro')}
        </h2>
        
        {!isChangingPassword && (
          <div className="form-group">
            <label htmlFor="email">Correo UPAO:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@upao.edu.pe"
              required
              disabled={isRecovering && recoveringStep === 1}
            />
          </div>
        )}

          {!isChangingPassword && !isLogin && (
          <div className="form-group">
            <label htmlFor="dni">Contraseña (DNI):</label>
            <input
              type="password"
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingresa tu DNI (8 dígitos)"
              required
            />
          </div>
        )}        {(isLogin || isChangingPassword) && (
          <div className="form-group">
            <label htmlFor="password">
              {isChangingPassword ? 'Contraseña Actual:' : 'Contraseña:'}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isRecovering}
            />
          </div>
        )}

        {/* Mostrar nuevos campos de contraseña cuando se cambia o cuando ya verificado email en recuperación */}
        {(isChangingPassword || (isRecovering && recoveringStep === 1)) && (
          <>
            <div className="form-group">
              <label htmlFor="newPassword">Nueva Contraseña:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Nueva Contraseña:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {/* Si estamos en el paso 1 de recuperación, mostrar el campo DNI */}
        {isRecovering && recoveringStep === 1 && (
          <div className="form-group">
            <label htmlFor="dni">DNI:</label>
            <input
              type="password"
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingresa tu DNI (8 dígitos)"
              required
            />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-btn">
          {isRecovering ? (recoveringStep === 0 ? 'Verificar Correo' : 'Guardar Nueva Contraseña') :
          (isChangingPassword 
            ? 'Guardar Nueva Contraseña'
            : isLogin 
              ? 'Iniciar Sesión' 
              : 'Registrarse')}
        </button>

        {!isChangingPassword && (
          <p className="toggle-form">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="toggle-btn"
            >
              {isLogin ? 'Regístrate' : 'Inicia Sesión'}
            </button>
          </p>
        )}

        {isLogin && (
          <p className="toggle-form">
            <button
              type="button"
              onClick={() => { setIsRecovering(!isRecovering); setRecoveringStep(0); setError(''); }}
              className="toggle-btn"
            >
              {isRecovering ? 'Volver al Login' : 'Recuperar Contraseña'}
            </button>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginForm;