import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Handler component for Firebase Auth action URLs
 * Redirects /__/auth/action to the appropriate page based on mode
 */
export default function AuthActionHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const apiKey = searchParams.get('apiKey');
    const continueUrl = searchParams.get('continueUrl');
    const lang = searchParams.get('lang');

    console.log('🔐 Auth Action Handler triggered');
    console.log('Mode:', mode);
    console.log('Has oobCode:', !!oobCode);
    console.log('Has apiKey:', !!apiKey);

    if (!mode || !oobCode) {
      console.error('Missing required parameters');
      navigate('/login');
      return;
    }

    // Build the redirect URL based on the mode
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('oobCode', oobCode);
    if (apiKey) params.set('apiKey', apiKey);
    if (continueUrl) params.set('continueUrl', continueUrl);
    if (lang) params.set('lang', lang);

    switch (mode) {
      case 'resetPassword':
        navigate(`/reset-password?${params.toString()}`, { replace: true });
        break;
      case 'verifyEmail':
        navigate(`/verify-email?${params.toString()}`, { replace: true });
        break;
      case 'recoverEmail':
        navigate(`/recover-email?${params.toString()}`, { replace: true });
        break;
      default:
        console.error('Unknown mode:', mode);
        navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing your request...</p>
      </div>
    </div>
  );
}
