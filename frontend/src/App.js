import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// AuthProvider is already applied in `src/index.js` so do not wrap App again
import LoginForm from './components/LoginForm';
import CourseForm from './components/CourseForm';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import './App.css';

const AppContent = () => (
  <div className="App">
    <Header />
    <main>
      <CourseForm />
    </main>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
