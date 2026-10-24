import { createContext, useContext } from 'react';

const AuthLoadingContext = createContext(null);

export function useAuthLoading() {
  return useContext(AuthLoadingContext);
}

export default AuthLoadingContext;
