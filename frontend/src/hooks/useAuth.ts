import { useAppSelector } from '../app/store';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsAuthInitialized,
  selectToken,
} from '../features/auth/authSlice';

export const useAuth = () => {
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectIsAuthInitialized);

  return {
    user,
    token,
    isAuthenticated,
    isInitialized,
    isInternal: user?.userType === 'internal',
    isClient: user?.userType === 'client',
    isPlatformAdmin: Boolean(user?.isPlatformAdmin),
  };
};

