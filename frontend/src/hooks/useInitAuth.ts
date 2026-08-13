import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { selectIsAuthInitialized, setInitialized } from '../features/auth/authSlice';
import { useRefreshMutation } from '../features/auth/authApi';

export const useInitAuth = () => {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector(selectIsAuthInitialized);
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    if (!isInitialized) {
      refresh(undefined)
        .unwrap()
        .catch(() => {
          dispatch(setInitialized(true));
        });
    }
  }, [isInitialized, refresh, dispatch]);

  return { isInitialized };
};
