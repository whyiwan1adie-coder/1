import React, { useEffect, useState, useCallback } from 'react';
import { ProfileCard } from './ProfileCard';

interface Ghost {
    username: string;
    nickname?: string;
    avatar?: string;
    status?: string;
}

interface GhostsPageProps {
    username: string;
    onStartChat: (username: string) => void;
}

export const GhostsPage: React.FC<GhostsPageProps> = ({ username, onStartChat }) => {
    const [ghosts, setGhosts] = useState<Ghost[]>([]);
    const [selectedUser, setSelectedUser] = useState<Ghost | null>(null);

    const loadGhosts = useCallback(() => {
        fetch(`http://localhost:3001/api/friends/list/${username}`)
            .then(r => r.json())
            .then((data: Ghost[]) => setGhosts(data));
    }, [username]);

    useEffect(() => {
        loadGhosts();
    }, [loadGhosts]);

    if (ghosts.length === 0) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>👻</div>
                    <div style={{ fontSize: '16px', color: '#333', letterSpacing: '3px', fontWeight: '900' }}>NO GHOSTS</div>
                    <div style={{ fontSize: '11px', color: '#1a1a1a', marginTop: '10px' }}>Accepted connections will appear here</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #1a1a1a', fontSize: '12px', color: '#444', fontWeight: 'bold', letterSpacing: '3px' }}>
                YOUR GHOSTS ({ghosts.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {ghosts.map(g => {
                    const isOnline = g.status === 'online';
                    const displayName = g.nickname || 'ANONYMOUS';
                    return (
                        <div
                            key={g.username}
                            style={{
                                padding: '14px 16px', display: 'flex', alignItems: 'center',
                                gap: '14px', cursor: 'pointer', borderRadius: '12px',
                                borderBottom: '1px solid #0a0a0a'
                            }}
                            onClick={() => setSelectedUser(g)}
                        >
                            <div style={{
                                width: '46px', height: '46px', borderRadius: '14px',
                                background: '#111', border: '1px solid #222',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '20px', color: '#22d3ee', overflow: 'hidden', flexShrink: 0
                            }}>
                                {g.avatar ? (
                                    <img src={g.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                ) : (
                                    displayName[0]?.toUpperCase() || '?'
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                                        {displayName}
                                    </div>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: isOnline ? '#22d3ee' : '#333',
                                        boxShadow: isOnline ? '0 0 6px #22d3ee' : 'none', flexShrink: 0
                                    }} />
                                </div>
                                {g.nickname && (
                                    <div style={{ fontSize: '10px', color: '#444' }}>@{g.username}</div>
                                )}
                            </div>
                            <div style={{ fontSize: '20px', color: '#1a1a1a' }}>👻</div>
                        </div>
                    );
                })}
            </div>

            {selectedUser && (
                <ProfileCard
                    user={selectedUser}
                    myUsername={username}
                    onClose={() => setSelectedUser(null)}
                    onSendMessage={() => {
                        onStartChat(selectedUser.username);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
};