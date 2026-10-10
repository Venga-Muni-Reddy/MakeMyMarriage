import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface GoogleLoginButtonProps {
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onError?: (msg: string) => void;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  text = 'continue_with',
  onError,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 60; // poll for up to 3 seconds

    const renderGoogleBtn = () => {
      if (!isMounted || !containerRef.current) return false;
      if (!window.google?.accounts?.id) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (!response?.credential) {
              onError?.('Google authentication returned no credential');
              return;
            }
            try {
              await loginWithGoogle(response.credential);
              navigate('/dashboard');
            } catch (err: any) {
              onError?.(err.message || 'Google authentication failed');
            }
          },
        });

        // Clear container and render official Google button
        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: text,
          shape: 'rectangular',
          logo_alignment: 'left',
          width: containerRef.current.clientWidth > 100 ? containerRef.current.clientWidth : 220,
        });

        setIsRendered(true);
        return true;
      } catch (err: any) {
        console.error('[GoogleLoginButton] render error:', err);
        return false;
      }
    };

    // Attempt immediate render
    if (renderGoogleBtn()) return;

    // Poll until Google Identity Services script finishes loading
    const interval = setInterval(() => {
      attempts++;
      if (renderGoogleBtn() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 50);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [clientId, loginWithGoogle, navigate, onError, text]);

  // Fallback / Loading UI: Displayed while GIS script is downloading or if Client ID is missing
  return (
    <div className={`relative w-full flex items-center justify-center min-h-[40px] ${className}`}>
      {/* Official Google Button Container */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center transition-opacity duration-200 ${
          isRendered ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        }`}
      />

      {/* Styled Instant Placeholder (visible until Google iframe loads so there is never an empty hole) */}
      {!isRendered && (
        <button
          type="button"
          onClick={() => {
            if (!clientId) {
              onError?.('Google Client ID is not configured yet. Please check VITE_GOOGLE_CLIENT_ID.');
            } else if (window.google?.accounts?.id) {
              window.google.accounts.id.prompt();
            } else {
              onError?.('Connecting to Google services... Please click again in a moment.');
            }
          }}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-surface-container-low hover:bg-surface-container rounded-xl border border-outline-variant/40 text-on-surface text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>
      )}
    </div>
  );
};
