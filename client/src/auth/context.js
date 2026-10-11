import { createContext, useContext } from 'react'
export const AuthContext = createContext({ configured: false, isLoaded: true, isSignedIn: false, userId: null, api: null })
export const useAuthState = () => useContext(AuthContext)
