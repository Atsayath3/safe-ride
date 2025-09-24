import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AuthTest = () => {
  const { login, signup, currentUser, loading } = useAuth();

  console.log('AuthContext functions available:', { 
    login: typeof login, 
    signup: typeof signup, 
    currentUser, 
    loading 
  });

  const testLogin = async () => {
    try {
      console.log('Attempting login with:', { login });
      await login('test@example.com', 'testpass');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', margin: '20px' }}>
      <h3>Auth Test Component</h3>
      <p>Login function type: {typeof login}</p>
      <p>Signup function type: {typeof signup}</p>
      <p>User: {currentUser ? JSON.stringify(currentUser.email) : 'null'}</p>
      <button onClick={testLogin} style={{ padding: '10px', background: 'blue', color: 'white' }}>
        Test Login
      </button>
    </div>
  );
};

export default AuthTest;