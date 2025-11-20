import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from 'src/contexts/auth-context';

export default function LogoutPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      await signOut();
      navigate('/login', { replace: true });
    };

    handleLogout();
  }, [signOut, navigate]);

  return null;
}
