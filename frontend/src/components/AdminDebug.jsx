import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';

/**
 * Debug component to check admin status
 * Add this temporarily to App.jsx to see what's happening
 */
export function AdminDebug() {
    const { user } = useAuth();
    const { isAdmin } = useAdmin();

    useEffect(() => {
        console.log('=== ADMIN DEBUG ===');
        console.log('User:', user);
        console.log('User Email:', user?.email);
        console.log('User Metadata:', user?.user_metadata);
        console.log('Role from Metadata:', user?.user_metadata?.role);
        console.log('isAdmin:', isAdmin);
        console.log('==================');
    }, [user, isAdmin]);

    if (!user) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'black',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px'
        }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#4ade80' }}>
                🔍 Admin Debug Panel
            </div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.user_metadata?.role || 'NOT SET'}</div>
            <div><strong>Is Admin:</strong> {isAdmin ? '✅ YES' : '❌ NO'}</div>
            <div style={{ marginTop: '10px', fontSize: '10px', color: '#888' }}>
                Check console (F12) for full details
            </div>
        </div>
    );
}
