import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <header className="App-header">
      <div className="header-content">
        <h1>Recomendador de Avance Curricular</h1>
        <div className="user-section">
          {user && <span className="user-email">{user.email}</span>}
          <button 
            onClick={handleLogout}
            className="logout-btn"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;