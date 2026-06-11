import { useEffect, useState } from 'react';
import { logoutUser, loginWithEmail, watchAuth, getApprovedUserProfile, subscribeToUserProfile } from './lib/auth';
import { AppDataProvider } from './context/AppDataProvider';
import AppRoutes from './routes/AppRoutes';
import LoginPage from './components/auth/LoginPage';
import AppLoadingScreen from './components/auth/AppLoadingScreen';
import './App.css';

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = watchAuth(async (firebaseUser) => {
      setAuthLoading(true);
      setAuthError('');

      if (!firebaseUser) {
        setAuthUser(null);
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        const profile = await getApprovedUserProfile(firebaseUser.uid);
        if (!profile || profile.isActive !== true) {
          await logoutUser();
          setAuthError('Access not approved.');
          setAuthUser(null);
          setUserProfile(null);
          setAuthLoading(false);
          return;
        }
        setAuthUser(firebaseUser);
        setUserProfile(profile);
      } catch (error) {
        console.error('Profile verification error:', error);
        setAuthError('Failed to verify access.');
        setAuthUser(null);
        setUserProfile(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser?.uid) return undefined;

    const unsubscribe = subscribeToUserProfile(authUser.uid, (profile) => {
      if (!profile || profile.isActive !== true) {
        logoutUser();
        setAuthError('Access not approved.');
        setAuthUser(null);
        setUserProfile(null);
        return;
      }
      setUserProfile(profile);
    });

    return () => unsubscribe();
  }, [authUser?.uid]);

  async function handleLogin(email, password) {
    setLoginLoading(true);
    setAuthError('');
    try {
      await loginWithEmail(email, password);
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  }

  if (authLoading) {
    return <AppLoadingScreen />;
  }

  if (!authUser || !userProfile) {
    return (
      <LoginPage
        onLogin={handleLogin}
        errorMessage={authError}
        loading={loginLoading}
      />
    );
  }

  return (
    <AppDataProvider authUser={authUser} userProfile={userProfile}>
      <AppRoutes />
    </AppDataProvider>
  );
}

export default App;
