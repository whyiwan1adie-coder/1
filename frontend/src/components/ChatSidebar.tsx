import React, { useState, useRef } from 'react';
import {
    sidebarStyle,
    profileAreaStyle,
    avatarMainStyle,
    nicknameDisplayStyle,
    listHeaderStyle,
    chatItemStyle,
    avatarMiniStyle,
    imgStyle
} from '../styles/chatStyles';

interface SessionItem { username: string; nickname?: string; avatar?: string; lastTime: string; }

interface ChatSidebarProps {
    username: string;
    myAvatar: string | null;
    myBio: string;
    sessions: SessionItem[];
    recipient: string;
    onSelectRecipient: (username: string) => void;
    myStatus: string;
    onToggleStatus: () => void;
    onEditProfile: () => void;
    onViewProfile: (username: string) => void;
    onAvatarUpload: (file: File) => void;
    unreadCounts: Record<string, number>;
    activeTab: 'chat' | 'search' | 'requests' | 'ghosts' | 'wall';
    onTabChange: (tab: 'chat' | 'search' | 'requests' | 'ghosts' | 'wall') => void;
    isMobile: boolean;
    ghostBlocked: string[];
    onOpenWall: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    username, myAvatar, myBio, sessions, recipient,
    onSelectRecipient, myStatus, onToggleStatus, onEditProfile,
    onViewProfile, onAvatarUpload, unreadCounts, activeTab, onTabChange,
    isMobile, ghostBlocked, onOpenWall
}) => {
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [sessionAvatars, setSessionAvatars] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onAvatarUpload(file);
    };

    const handleExpandSession = async (sessionUsername: string) => {
        if (expandedSession === sessionUsername) { setExpandedSession(null); }
        else {
            setExpandedSession(sessionUsername);
            if (!sessionAvatars[sessionUsername]) {
                try {
                    const res = await fetch(`http://localhost:3001/api/users/search?query=${sessionUsername}&me=`);
                    const data: { username: string; avatar?: string }[] = await res.json();
                    const user = data.find(u => u.username === sessionUsername);
                    if (user?.avatar) setSessionAvatars(prev => ({ ...prev, [sessionUsername]: user.avatar as string }));
                } catch { /* */ }
            }
        }
    };

    const getSessionAvatar = (s: SessionItem) => sessionAvatars[s.username] || s.avatar || null;
    const totalUnread = Object.values(unreadCounts).reduce((sum, val) => sum + val, 0);

    const statusColor = myStatus === 'online' ? '#22d3ee' : myStatus === 'shadow' ? '#a855f7' : '#333';
    const statusGlow = myStatus === 'online' ? '0 0 8px #22d3ee' : myStatus === 'shadow' ? '0 0 8px #a855f7' : 'none';
    const statusLabel = myStatus === 'online' ? 'ONLINE' : myStatus === 'shadow' ? 'SHADOW' : 'OFFLINE';

    const tabStyle = (tab: string): React.CSSProperties => ({
        flex: 1, padding: isMobile ? '12px 6px' : '10px 6px',
        background: activeTab === tab ? 'rgba(34,211,238,0.1)' : 'transparent',
        border: 'none', color: activeTab === tab ? '#22d3ee' : '#444',
        cursor: 'pointer', fontSize: isMobile ? '11px' : '9px', fontWeight: 'bold',
        letterSpacing: '1.5px',
        borderBottom: activeTab === tab ? '2px solid #22d3ee' : '2px solid transparent',
        position: 'relative'
    });

    return (
        <div style={{ ...sidebarStyle, width: isMobile ? '100%' : '280px', maxWidth: isMobile ? '100%' : '280px' }}>
            <div style={profileAreaStyle}>
                <div style={{ ...avatarMainStyle, cursor: 'pointer', position: 'relative' }} onClick={handleAvatarClick} title="Загрузить фото">
                    {myAvatar ? <img src={myAvatar} style={imgStyle} alt="" /> : username[0]?.toUpperCase() || '?'}
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '22px', height: '22px', borderRadius: '6px', background: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#000', fontWeight: 'bold' }}>+</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
                    <div style={nicknameDisplayStyle}>{username}</div>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor, boxShadow: statusGlow, flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '6px', fontWeight: 'normal', letterSpacing: '0.5px', textTransform: 'none', maxWidth: '200px', wordBreak: 'break-word' }}>{myBio || '...'}</div>
                <button onClick={onToggleStatus} style={{ marginTop: '15px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${statusColor}`, background: 'transparent', color: statusColor, cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>{statusLabel}</button>
                <button onClick={onOpenWall} style={{ marginTop: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #1a1a1a', background: 'transparent', color: '#555', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', width: '100%' }}>
                    MY WALL
                </button>
                <button onClick={onEditProfile} style={{ marginTop: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #1a1a1a', background: 'transparent', color: '#555', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', width: '100%' }}>
                    EDIT PROFILE
                </button>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
                <button onClick={() => onTabChange('chat')} style={tabStyle('chat')}>
                    CHAT{totalUnread > 0 && activeTab !== 'chat' && <span style={{ position: 'absolute', top: '2px', right: '2px', minWidth: '14px', height: '14px', borderRadius: '7px', background: '#22d3ee', fontSize: '8px', fontWeight: '900', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{totalUnread > 99 ? '99+' : totalUnread}</span>}
                </button>
                <button onClick={() => onTabChange('search')} style={tabStyle('search')}>SEARCH</button>
                <button onClick={() => onTabChange('requests')} style={tabStyle('requests')}>INBOX</button>
                <button onClick={() => onTabChange('ghosts')} style={tabStyle('ghosts')}>GHOSTS</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
                {activeTab === 'chat' && (
                    <>
                        <div style={listHeaderStyle}>ACTIVE_SESSIONS</div>
                        {(sessions || []).map(s => {
                            const isExpanded = expandedSession === s.username;
                            const isActive = recipient === s.username;
                            const avatar = getSessionAvatar(s);
                            const unread = unreadCounts[s.username] || 0;
                            const blocked = ghostBlocked.includes(s.username);
                            return (
                                <div key={s.username}>
                                    <div onClick={() => handleExpandSession(s.username)} style={chatItemStyle(isActive)}>
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <div style={avatarMiniStyle}>{avatar ? <img src={avatar} style={imgStyle} alt="" /> : s.username[0]?.toUpperCase()}</div>
                                            {unread > 0 && !isActive && <div style={{ position: 'absolute', top: '-6px', right: '-6px', minWidth: '18px', height: '18px', borderRadius: '9px', background: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#000', padding: '0 4px' }}>{unread > 99 ? '99+' : unread}</div>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: isActive ? '#22d3ee' : '#fff' }}>
                                                {blocked ? '🚫 ' : ''}{s.nickname || s.username}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#444' }}>{new Date(s.lastTime).toLocaleTimeString()}</div>
                                        </div>
                                        <div style={{ fontSize: '16px', color: '#333' }}>{isExpanded ? '▾' : '▸'}</div>
                                    </div>
                                    {isExpanded && (
                                        <div style={{ padding: '12px 20px', background: '#050505', borderBottom: '1px solid #0a0a0a', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => onSelectRecipient(s.username)} style={{ flex: 1, padding: '8px', background: '#22d3ee', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '900' }}>НАПИСАТЬ</button>
                                                <button onClick={() => onViewProfile(s.username)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>ПРОФИЛЬ</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};