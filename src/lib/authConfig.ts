// Production-specific authentication configuration
export const getAuthConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  return {
    isProduction,
    baseUrl,
    // Add any production-specific auth settings here
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
};

// Helper function to validate auth configuration
export const validateAuthConfig = () => {
  const config = getAuthConfig();
  const errors: string[] = [];

  if (!config.authDomain) {
    errors.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set');
  }

  if (!config.projectId) {
    errors.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
  }

  if (config.isProduction && !config.baseUrl.startsWith('https://')) {
    errors.push('Production URL must use HTTPS');
  }

  if (errors.length > 0) {
    console.error('Auth configuration errors:', errors);
    return false;
  }

  return true;
};

// Log auth configuration for debugging (only in development)
export const logAuthConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    const config = getAuthConfig();
    console.log('Auth Configuration:', {
      isProduction: config.isProduction,
      baseUrl: config.baseUrl,
      authDomain: config.authDomain,
      projectId: config.projectId,
    });
  }
};
