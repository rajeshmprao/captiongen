import { imageService } from './imageService';
import { auth } from '../config/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

const API_URL = process.env.REACT_APP_API_URL;
const CAROUSEL_API_URL = process.env.REACT_APP_CAROUSEL_API_URL;

class AuthService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.user = JSON.parse(localStorage.getItem('auth_user') || 'null');
    this.provider = new GoogleAuthProvider();
    
    // Listen for Firebase auth state changes
    onAuthStateChanged(auth, this.handleAuthStateChange.bind(this));
  }

  async handleAuthStateChange(firebaseUser) {
    if (firebaseUser) {
      try {
        // Get Firebase ID token
        const idToken = await firebaseUser.getIdToken();
        
        // Exchange for our JWT
        await this.exchangeFirebaseToken(idToken);
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    } else {
      // User signed out
      await this.clearAuthData();
    }
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.provider);
      const idToken = await result.user.getIdToken();
      await this.exchangeFirebaseToken(idToken);
      return this.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async exchangeFirebaseToken(firebaseIdToken) {
    try {
      // Exchange Firebase ID token for our JWT
      const authResponse = await fetch(`${API_URL.replace('/GenerateCaption', '/UserAuth')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseIdToken: firebaseIdToken
        })
      });

      const authData = await authResponse.json();
      
      if (authResponse.ok && authData.success) {
        this.token = authData.data.token;
        this.user = authData.data.user;
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('auth_user', JSON.stringify(this.user));
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: this.user } }));
      } else {
        throw new Error(authData.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      await this.clearAuthData();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async clearAuthData() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));
  }

  getAuthHeaders() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }
}

const authService = new AuthService();

export const apiService = {
  authService,
  
  async generateSingleCaption(image, apiKey, options) {
    const startTime = Date.now();
    const compressedBase64 = await imageService.compressImage(image, 300);
    const base64Image = compressedBase64.split(',')[1];
    
    const requestBody = {
      image: base64Image,
      ...options
    };

    // Use JWT auth if available, fallback to apiKey for backward compatibility
    const headers = {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders()
    };

    if (!authService.isAuthenticated() && apiKey) {
      requestBody.apiKey = apiKey.trim();
    }

    const requestData = {
      url: API_URL,
      method: 'POST',
      payloadSize: JSON.stringify(requestBody).length,
      startTime
    };
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    // Add timing and response info to request data
    requestData.duration = Date.now() - startTime;
    requestData.status = response.status;
    requestData.statusText = response.statusText;

    if (!response.ok) {
      const error = new Error(data.error || 'Failed to generate caption');
      error.requestData = requestData;
      error.serverDebugInfo = data.debugInfo;
      throw error;
    }

    return data;
  },  async generateCarouselCaption(images, apiKey, options) {
    const startTime = Date.now();
    // Compress and convert all images to base64
    const compressedImages = await Promise.all(
      images.map(async (image) => {
        const compressed = await imageService.compressImage(image, 300);
        return compressed.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      })
    );    const requestBody = {
      images: compressedImages,
      ...options
    };

    // Use JWT auth if available, fallback to apiKey for backward compatibility
    const headers = {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders()
    };

    if (!authService.isAuthenticated() && apiKey) {
      requestBody.apiKey = apiKey.trim();
    }

    const requestData = {
      url: CAROUSEL_API_URL,
      method: 'POST',
      payloadSize: JSON.stringify(requestBody).length,
      startTime
    };
    
    const response = await fetch(CAROUSEL_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    // Add timing and response info to request data
    requestData.duration = Date.now() - startTime;
    requestData.status = response.status;
    requestData.statusText = response.statusText;

    if (!response.ok) {
      const error = new Error(data.error || 'Failed to generate carousel caption');
      error.requestData = requestData;
      error.serverDebugInfo = data.debugInfo;
      throw error;
    }

    return data;
  }
};
