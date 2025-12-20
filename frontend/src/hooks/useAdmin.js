import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to check if the current user has admin privileges
 * Checks the user_metadata.role field for 'admin'
 */
export function useAdmin() {
    const { user, loading } = useAuth();

    const isAdmin = useMemo(() => {
        if (!user) return false;

        // Check if user has admin role in metadata
        return user.user_metadata?.role === 'admin';
    }, [user]);

    return { isAdmin, loading };
}
