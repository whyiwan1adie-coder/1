import React, { useEffect, useState, useCallback } from 'react';

interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: string;
    createdAt: string;
    fromUser: {
        username: string;
        nickname?: string;
        avatar?: string;
    };
}

interface RequestsPageProps {
    username: string;
    onStartChat: (username: string) => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ username }) => {
    const [requests, setRequests] = useState<FriendRequest[]>([]);

    const loadRequests = useCallback(() => {
        fetch(`http://localhost:3001/api/friends/incoming/${username}`)
            .then(r => r.json())
            .then((data: FriendRequest[]) => setRequests(data));
    }, [username]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleAccept = async (id: string) => {
        await fetch('http://localhost:3001/api/friends/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        loadRequests();
    };

    const handleReject = async (id: string) => {
        await fetch('http://localhost:3001/api/friends/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        loadRequests();
    };

    if (requests.length === 0) {
        return (
            <div style={emptyContainerStyle}>
                <div style={{ fontSize: '16px', color: '#333', letterSpacing: '3px', fontWeight: '900' }}>INBOX</div>
                <div style={{ fontSize: '11px', color: '#1a1a1a', marginTop: '10px' }}>NO PENDING REQUESTS</div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>INCOMING REQUESTS</div>
            {requests.map(req => {
                const displayName = req.fromUser.nickname || 'ANONYMOUS';
                return (
                    <div key={req.id} style={requestCardStyle}>
                        <div style={avatarStyle}>
                            {req.fromUser.avatar ? (
                                <img src={req.fromUser.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            ) : (
                                displayName[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                                {displayName}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleAccept(req.id)} style={acceptBtnStyle}>✓</button>
                            <button onClick={() => handleReject(req.id)} style={rejectBtnStyle}>✕</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const containerStyle: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'
};

const emptyContainerStyle: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center'
};

const headerStyle: React.CSSProperties = {
    padding: '20px 25px', borderBottom: '1px solid #1a1a1a',
    fontSize: '12px', color: '#444', fontWeight: 'bold', letterSpacing: '3px'
};

const requestCardStyle: React.CSSProperties = {
    padding: '16px 25px', display: 'flex', alignItems: 'center',
    gap: '15px', borderBottom: '1px solid #0a0a0a'
};

const avatarStyle: React.CSSProperties = {
    width: '44px', height: '44px', borderRadius: '12px',
    background: '#111', border: '1px solid #222',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', color: '#22d3ee', overflow: 'hidden', flexShrink: 0
};

const acceptBtnStyle: React.CSSProperties = {
    width: '36px', height: '36px', borderRadius: '10px',
    background: '#22d3ee', color: '#000', border: 'none',
    cursor: 'pointer', fontSize: '16px', fontWeight: 'bold',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const rejectBtnStyle: React.CSSProperties = {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'transparent', border: '1px solid #333',
    color: '#555', cursor: 'pointer', fontSize: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};