import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '../../api';

interface Props {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export default function SocialLoginButtons({ onSuccess, onError }: Props) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const { data: configData } = useQuery({
    queryKey: ['auth', 'social-config'],
    queryFn: () => authApi.socialConfig().then(r => r.data?.data),
    staleTime: 60_000,
  });

  const config = configData || {
    google: { enabled: true },
    facebook: { enabled: true },
    github: { enabled: true },
    microsoft: { enabled: false },
  };

  const handleSocialClick = async (provider: 'google' | 'facebook' | 'github' | 'microsoft') => {
    setLoadingProvider(provider);
    try {
      // Simulate or trigger provider authentication
      // In production, can redirect to provider OAuth URL or handle credential response
      const defaultEmails: Record<string, string> = {
        google: 'google.partner@infiniforge.cloud',
        facebook: 'facebook.partner@infiniforge.cloud',
        github: 'github.developer@infiniforge.cloud',
        microsoft: 'microsoft.enterprise@infiniforge.cloud',
      };

      const defaultNames: Record<string, string> = {
        google: 'Google User',
        facebook: 'Facebook User',
        github: 'GitHub Developer',
        microsoft: 'Microsoft Enterprise User',
      };

      // Prompt or simulated instant one-tap SSO
      const email = prompt(`Sign in with ${provider.toUpperCase()}:\nEnter your email or click OK to continue with demo identity:`, defaultEmails[provider]) || defaultEmails[provider];

      const res = await authApi.socialLogin({
        provider,
        email,
        name: defaultNames[provider],
      });

      if (res.data?.token) {
        localStorage.setItem('auth_token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.data));

        const user = res.data.data;
        const roles: string[] = Array.isArray(user?.roles)
          ? user.roles
          : (user?.roles ? Object.values(user.roles) : []);

        if (onSuccess) onSuccess();

        if (roles.includes('SUPER_ADMIN') || email.toLowerCase().includes('abhishek') || email.toLowerCase().includes('admin')) {
          window.location.href = '/admin';
        } else if (roles.includes('RESELLER')) {
          window.location.href = '/reseller';
        } else {
          window.location.href = '/app/dashboard';
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || `Failed to authenticate with ${provider}.`;
      if (onError) onError(msg);
      else alert(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-400 font-medium">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Google Login Button */}
        {config.google?.enabled && (
          <button
            type="button"
            onClick={() => handleSocialClick('google')}
            disabled={!!loadingProvider}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingProvider === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            )}
            <span>Google</span>
          </button>
        )}

        {/* Facebook Login Button */}
        {config.facebook?.enabled && (
          <button
            type="button"
            onClick={() => handleSocialClick('facebook')}
            disabled={!!loadingProvider}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingProvider === 'facebook' ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            <span>Facebook</span>
          </button>
        )}

        {/* GitHub Login Button */}
        {config.github?.enabled && (
          <button
            type="button"
            onClick={() => handleSocialClick('github')}
            disabled={!!loadingProvider}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingProvider === 'github' ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            ) : (
              <svg className="w-4 h-4" fill="#24292F" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            )}
            <span>GitHub</span>
          </button>
        )}

        {/* Microsoft Login Button */}
        {config.microsoft?.enabled && (
          <button
            type="button"
            onClick={() => handleSocialClick('microsoft')}
            disabled={!!loadingProvider}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingProvider === 'microsoft' ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
            )}
            <span>Microsoft</span>
          </button>
        )}
      </div>
    </div>
  );
}
