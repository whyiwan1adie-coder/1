import React, { useState, useEffect } from 'react';

interface ProfileCardProps {
    user: {
        username: string;
        nickname?: string;
        avatar?: string;
        bio?: string;
        age?: number;
        location?: string;
        languages?: string;
        status?: string;
        gender?: string;
    };
    myUsername: string;
    onClose: () => void;
    onSendMessage: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, myUsername, onClose, onSendMessage }) => {
    const isOnline = user.status === 'online';
    const [requested, setRequested] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [checked, setChecked] = useState(false);
    const [ghostCount, setGhostCount] = useState(0);

    useEffect(() => {
        fetch(`http://localhost:3001/api/friends/list/${user.username}`)
            .then(r => r.json())
            .then((data: { username: string }[]) => {
                setGhostCount(data.length);
                const found = data.find((g: { username: string }) => g.username === myUsername);
                if (found) setIsConnected(true);
                setChecked(true);
            })
            .catch(() => setChecked(true));
    }, [user.username, myUsername]);

    const handleFollow = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: myUsername, to: user.username })
            });
            if (res.ok) setRequested(true);
        } catch (err) { console.error(err); }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={cardStyle} onClick={e => e.stopPropagation()}>
                <button style={closeBtnStyle} onClick={onClose}>✕</button>

                <div style={avatarStyle}>
                    {user.avatar ? (
                        <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    ) : (
                        user.username[0]?.toUpperCase() || '?'
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                    <div style={nicknameStyle}>{user.nickname || user.username}</div>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: isOnline ? '#22d3ee' : '#333',
                        boxShadow: isOnline ? '0 0 8px #22d3ee' : 'none'
                    }} />
                </div>

                {user.bio && <div style={bioStyle}>{user.bio}</div>}

                <div style={infoGridStyle}>
                    {user.age ? (
                        <div style={infoItemStyle}>
                            <div style={infoLabelStyle}>ВОЗРАСТ</div>
                            <div style={infoValueStyle}>{user.age}</div>
                        </div>
                    ) : null}
                    {user.gender && user.gender !== 'не указан' ? (
                        <div style={infoItemStyle}>
                            <div style={infoLabelStyle}>ПОЛ</div>
                            <div style={infoValueStyle}>{user.gender.toUpperCase()}</div>
                        </div>
                    ) : null}
                    <div style={infoItemStyle}>
                        <div style={infoLabelStyle}>GHOSTS</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <span style={infoValueStyle}>{ghostCount}</span>
                            <span style={{ fontSize: '18px' }}>👻</span>
                        </div>
                    </div>
                    {user.languages ? (
                        <div style={infoItemStyle}>
                            <div style={infoLabelStyle}>ЯЗЫКИ</div>
                            <div style={infoValueStyle}>{user.languages}</div>
                        </div>
                    ) : null}
                    <div style={infoItemStyle}>
                        <div style={infoLabelStyle}>СТАТУС</div>
                        <div style={{ ...infoValueStyle, color: isOnline ? '#22d3ee' : '#555' }}>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </div>
                    </div>
                </div>

                <button style={messageBtnStyle} onClick={onSendMessage}>НАПИСАТЬ</button>

                {checked && !isConnected && (
                    <button
                        style={requested ? requestedBtnStyle : followBtnStyle}
                        onClick={handleFollow}
                        disabled={requested}
                    >
                        {requested ? '✓ ЗАПРОС ОТПРАВЛЕН' : 'ПОДПИСАТЬСЯ'}
                    </button>
                )}

                {isConnected && (
                    <div style={connectedStyle}>👻 ВЗАИМНАЯ СВЯЗЬ</div>
                )}
            </div>
        </div>
    );
};

const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.8)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 100
};

const cardStyle: React.CSSProperties = {
    background: '#0a0a0a', border: '1px solid #1a1a1a',
    borderRadius: '24px', padding: '30px', width: '360px',
    textAlign: 'center', position: 'relative'
};

const closeBtnStyle: React.CSSProperties = {
    position: 'absolute', top: '15px', right: '15px',
    background: 'transparent', border: 'none', color: '#555',
    fontSize: '18px', cursor: 'pointer'
};

const avatarStyle: React.CSSProperties = {
    width: '100px', height: '100px', borderRadius: '25px',
    background: '#111', border: '2px solid #22d3ee',
    margin: '0 auto', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '40px',
    fontWeight: 'bold', color: '#22d3ee', overflow: 'hidden'
};

const nicknameStyle: React.CSSProperties = {
    fontSize: '22px', color: '#22d3ee', fontWeight: '900'
};

const bioStyle: React.CSSProperties = {
    fontSize: '13px', color: '#888', marginTop: '15px',
    padding: '0 10px', lineHeight: '1.5'
};

const infoGridStyle: React.CSSProperties = {
    display: 'flex', flexWrap: 'wrap', gap: '10px',
    marginTop: '20px', justifyContent: 'center'
};

const infoItemStyle: React.CSSProperties = {
    background: '#080808', border: '1px solid #1a1a1a',
    borderRadius: '10px', padding: '10px 14px', minWidth: '70px'
};

const infoLabelStyle: React.CSSProperties = {
    fontSize: '8px', color: '#555', fontWeight: 'bold',
    letterSpacing: '1.5px', marginBottom: '4px'
};

const infoValueStyle: React.CSSProperties = {
    fontSize: '13px', color: '#fff', fontWeight: 'bold'
};

const messageBtnStyle: React.CSSProperties = {
    marginTop: '20px', width: '100%', padding: '14px',
    background: '#22d3ee', color: '#000', border: 'none',
    borderRadius: '12px', cursor: 'pointer', fontWeight: '900',
    fontSize: '13px', letterSpacing: '1px'
};

const followBtnStyle: React.CSSProperties = {
    marginTop: '8px', width: '100%', padding: '12px',
    background: 'transparent', border: '1px solid #333',
    color: '#888', borderRadius: '12px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px'
};

const requestedBtnStyle: React.CSSProperties = {
    marginTop: '8px', width: '100%', padding: '12px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid #555',
    color: '#888', borderRadius: '12px', cursor: 'default',
    fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px'
};

const connectedStyle: React.CSSProperties = {
    marginTop: '10px', padding: '10px',
    color: '#22d3ee', fontSize: '12px', fontWeight: 'bold',
    letterSpacing: '1px'
};