import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const AuthButton = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize with current user state
    setUser(apiService.authService.getUser());

    // Listen for auth changes
    const handleAuthChange = (event) => {
      setUser(event.detail.user);
    };

    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await apiService.authService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await apiService.authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        padding: '10px',
        background: '#f0f0f0',
        borderRadius: '8px',
        margin: '10px 0'
      }}>
        <span>Welcome, {user.displayName || user.email}!</span>
        <button 
          onClick={handleSignOut}
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ margin: '10px 0' }}>
      <button 
        onClick={handleSignIn}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          background: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {isLoading ? 'Loading...' : 'Sign in with Google'}
      </button>
    </div>
  );
};

export default AuthButton;
