import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CryptoHelper } from '../utils/cryptoHelper';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ProfileEditor } from './ProfileEditor';
import { ProfileCard } from './ProfileCard';
import { SearchPage } from './SearchPage';
import { RequestsPage } from './RequestsPage';
import { GhostsPage } from './GhostsPage';
import { WallPage } from './WallPage';

interface Message { sender: string; content: string; avatar?: string; nickname?: string; createdAt: string; }
interface SessionItem { username: string; nickname?: string; avatar?: string; lastTime: string; }
interface User { username: string; nickname?: string; avatar?: string; publicKey?: string; bio?: string; age?: number; location?: string; languages?: string; status?: string; gender?: string; }

const socket: Socket = io('http://127.0.0.1:3001');

export const Chat = ({ username }: { username: string }) => {
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [myPrivateKey, setMyPrivateKey] = useState<CryptoKey | null>(null);
    const [myAvatar, setMyAvatar] = useState<string | null>(null);
    const [myBio, setMyBio] = useState<string>('');
    const [myStatus, setMyStatus] = useState<string>('offline');
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [viewProfileUser, setViewProfileUser] = useState<User | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'requests' | 'ghosts' | 'wall'>('chat');
    const [ghostList, setGhostList] = useState<{ username: string; nickname?: string }[]>([]);
    const [ghostBlocked, setGhostBlocked] = useState<string[]>(() => {
        const saved = localStorage.getItem(`hush_blocked_${username}`);
        return saved ? JSON.parse(saved) : [];
    });
    const [showSidebar, setShowSidebar] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        localStorage.setItem(`hush_blocked_${username}`, JSON.stringify(ghostBlocked));
    }, [ghostBlocked, username]);

    const buildSessions = useCallback((msgs: Message[], cur: string) => {
        const map = new Map<string, SessionItem>();
        msgs.forEach(m => {
            const partner = m.sender === 'ME' ? cur : m.sender;
            if (!partner || partner === 'ME' || partner === '...') return;
            map.set(partner, { username: partner, nickname: m.nickname, avatar: m.avatar, lastTime: m.createdAt });
        });
        setSessions(Array.from(map.values()).sort((a, b) => b.lastTime.localeCompare(a.lastTime)));
    }, []);

    const loadArchive = useCallback(() => {
        const archive: Message[] = JSON.parse(localStorage.getItem(`hush_arc_${username}`) || "[]");
        setMessages(archive);
        buildSessions(archive, '');
    }, [username, buildSessions]);

    const addToArchive = useCallback((msg: Message, cur: string) => {
        if (msg.sender !== 'ME' && ghostBlocked.includes(msg.sender)) return;
        setMessages(prev => {
            if (prev.some(m => m.createdAt === msg.createdAt && m.sender === msg.sender)) return prev;
            const newArchive = [...prev, msg];
            localStorage.setItem(`hush_arc_${username}`, JSON.stringify(newArchive));
            const map = new Map<string, SessionItem>();
            newArchive.forEach(m => {
                const partner = m.sender === 'ME' ? cur : m.sender;
                if (!partner || partner === 'ME' || partner === '...') return;
                map.set(partner, { username: partner, nickname: m.nickname, avatar: m.avatar, lastTime: m.createdAt });
            });
            setSessions(Array.from(map.values()).sort((a, b) => b.lastTime.localeCompare(a.lastTime)));
            if (msg.sender !== 'ME' && msg.sender !== cur) {
                setUnreadCounts(prev => ({ ...prev, [msg.sender]: (prev[msg.sender] || 0) + 1 }));
            }
            return newArchive;
        });
    }, [username, ghostBlocked]);

    const refreshSession = () => {
        const saved = JSON.parse(localStorage.getItem('hush_session') || '{}');
        setMyAvatar(saved.photo || null); setMyBio(saved.bio || ''); setMyStatus(saved.status || 'offline');
    };

    const handleViewProfile = async (u: string) => {
        fetch(`http://localhost:3001/api/users/search?query=${u}&me=`).then(r => r.json()).then((data: User[]) => {
            const user = data.find(x => x.username === u);
            if (user) setViewProfileUser(user);
        });
    };

    const handleAvatarUpload = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            setMyAvatar(base64);
            const session = JSON.parse(localStorage.getItem('hush_session') || '{}');
            session.photo = base64;
            localStorage.setItem('hush_session', JSON.stringify(session));
            await fetch('http://localhost:3001/api/users/update', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, avatar: base64 }) });
        };
        reader.readAsDataURL(file);
    };

    const handleSelectRecipient = (r: string) => {
        setRecipient(r); setActiveTab('chat');
        if (isMobile) setShowSidebar(false);
        if (unreadCounts[r]) { setUnreadCounts(prev => { const u = { ...prev }; delete u[r]; return u; }); }
    };

    const handleStartChat = (r: string) => {
        setRecipient(r); setActiveTab('chat');
        if (isMobile) setShowSidebar(false);
    };

    const handleClearChat = (r: string) => {
        setMessages(prev => {
            const filtered = prev.filter(m => m.sender !== r && !(m.sender === 'ME' && r === recipient));
            localStorage.setItem(`hush_arc_${username}`, JSON.stringify(filtered));
            buildSessions(filtered, r);
            return filtered;
        });
    };

    const handleRemoveGhost = async (r: string) => {
        try {
            const incomingRes = await fetch(`http://localhost:3001/api/friends/incoming/${username}`);
            const incoming: { id: string; fromUser: { username: string } }[] = await incomingRes.json();
            const foundIncoming = incoming.find((req: { id: string; fromUser: { username: string } }) => req.fromUser.username === r);
            if (foundIncoming) {
                await fetch('http://localhost:3001/api/friends/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: foundIncoming.id }) });
            }
            setGhostBlocked(prev => {
                if (prev.includes(r)) return prev;
                return [...prev, r];
            });
            handleClearChat(r);
            setRecipient('');
        } catch (err) { console.error(err); }
    };

    const handleUnblock = (r: string) => {
        setGhostBlocked(prev => prev.filter(u => u !== r));
    };

    useEffect(() => {
        const init = async () => {
            const saved = JSON.parse(localStorage.getItem('hush_session') || '{}');
            setMyAvatar(saved.photo || null); setMyBio(saved.bio || ''); setMyStatus(saved.status || 'offline');
            try {
                const res = await fetch(`http://localhost:3001/api/friends/list/${username}`);
                const list: { username: string; nickname?: string }[] = await res.json();
                setGhostList(list);
            } catch { /* */ }

            let privKey: CryptoKey | null = null;
            const storedKey = localStorage.getItem(`hush_vault_${username}`);
            const password = sessionStorage.getItem('hush_pass') || '';

            if (storedKey && password) {
                const decryptedJwk = await CryptoHelper.decryptPrivateKey(storedKey, password);
                if (decryptedJwk) {
                    privKey = await CryptoHelper.importPrivateKey(decryptedJwk);
                }
            }

            if (!privKey) {
                const n = await CryptoHelper.createNewKeys();
                if (password) {
                    const encrypted = await CryptoHelper.encryptPrivateKey(n.privateKeyJwk, password);
                    localStorage.setItem(`hush_vault_${username}`, encrypted);
                } else {
                    localStorage.setItem(`hush_vault_${username}`, n.privateKeyJwk);
                }
                privKey = n.rawPriv;
                await fetch('http://localhost:3001/api/users/update', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, publicKey: n.publicKeyPem }) });
            }

            setMyPrivateKey(privKey);
            loadArchive();
            socket.emit('join', username);
        };
        init();
    }, [username, loadArchive]);

    useEffect(() => {
        const handler = (msg: Message) => addToArchive(msg, recipient);
        socket.on('new_message', handler);
        socket.on('offline_messages', (msgs: Message[]) => msgs.forEach(m => addToArchive(m, recipient)));
        return () => { socket.off('new_message'); socket.off('offline_messages'); };
    }, [addToArchive, recipient]);

    const handleSend = async () => {
        if (!recipient || !message) return;
        try {
            const res = await fetch(`http://localhost:3001/api/users/key/${recipient}`);
            const data: User = await res.json();
            if (!data.publicKey) return alert("System: Public key missing.");
            const encrypted = await CryptoHelper.encryptHybrid(message, data.publicKey);
            socket.emit('send_message', { sender: username, receiver: recipient, content: encrypted });
            addToArchive({ sender: 'ME', content: message, createdAt: new Date().toISOString() }, recipient);
            setMessage('');
        } catch (e) { console.error(e); }
    };

    const handleSendPhoto = async (file: File) => {
        if (!recipient) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            try {
                const res = await fetch(`http://localhost:3001/api/users/key/${recipient}`);
                const data: User = await res.json();
                if (!data.publicKey) return alert("System: Public key missing.");
                const encrypted = await CryptoHelper.encryptLargeData(base64, data.publicKey);
                socket.emit('send_message', { sender: username, receiver: recipient, content: encrypted });
                addToArchive({ sender: 'ME', content: base64, createdAt: new Date().toISOString() }, recipient);
            } catch (err) { console.error(err); }
        };
        reader.readAsDataURL(file);
    };

    const handleSendSticker = async (sticker: string) => {
        if (!recipient) return;
        try {
            const res = await fetch(`http://localhost:3001/api/users/key/${recipient}`);
            const data: User = await res.json();
            if (!data.publicKey) return alert("System: Public key missing.");
            const encrypted = await CryptoHelper.encryptHybrid('__STICKER__' + sticker, data.publicKey);
            socket.emit('send_message', { sender: username, receiver: recipient, content: encrypted });
            addToArchive({ sender: 'ME', content: '__STICKER__' + sticker, createdAt: new Date().toISOString() }, recipient);
        } catch (e) { console.error(e); }
    };

    const handleSendVoice = async (audioBase64: string) => {
        if (!recipient) return;
        try {
            const res = await fetch(`http://localhost:3001/api/users/key/${recipient}`);
            const data: User = await res.json();
            if (!data.publicKey) return alert("System: Public key missing.");
            const encrypted = await CryptoHelper.encryptLargeData(audioBase64, data.publicKey);
            socket.emit('send_message', { sender: username, receiver: recipient, content: encrypted });
            addToArchive({ sender: 'ME', content: audioBase64, createdAt: new Date().toISOString() }, recipient);
        } catch (err) { console.error(err); }
    };

    const handleToggleStatus = async () => {
        const nextStatus = myStatus === 'online' ? 'offline' : myStatus === 'offline' ? 'shadow' : 'online';
        setMyStatus(nextStatus);
        const session = JSON.parse(localStorage.getItem('hush_session') || '{}');
        session.status = nextStatus;
        localStorage.setItem('hush_session', JSON.stringify(session));
        await fetch('http://localhost:3001/api/users/update', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, status: nextStatus }) });
    };

    const isWall = activeTab === 'wall';

    const containerStyles: React.CSSProperties = {
        display: 'flex',
        height: isMobile ? '100vh' : isWall ? 'auto' : '680px',
        minHeight: isWall ? '100vh' : 'auto',
        maxHeight: isWall ? 'none' : '680px',
        width: isMobile ? '100%' : '1000px',
        margin: isMobile ? '0' : '0 auto',
        background: '#000',
        border: isMobile ? 'none' : '1px solid #1a1a1a',
        borderRadius: isMobile ? '0' : '24px',
        overflow: isWall ? 'visible' : 'hidden',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        flexDirection: 'row'
    };

    const sidebarVisible = !isMobile || showSidebar;

    return (
        <div style={containerStyles}>
            {sidebarVisible && (
                <ChatSidebar
                    username={username} myAvatar={myAvatar} myBio={myBio}
                    sessions={sessions || []} recipient={recipient}
                    onSelectRecipient={handleSelectRecipient} myStatus={myStatus}
                    onToggleStatus={handleToggleStatus} onEditProfile={() => setShowProfileEditor(true)}
                    onViewProfile={handleViewProfile} onAvatarUpload={handleAvatarUpload}
                    unreadCounts={unreadCounts || {}} activeTab={activeTab} onTabChange={setActiveTab}
                    isMobile={isMobile} ghostBlocked={ghostBlocked}
                    onOpenWall={() => setActiveTab('wall')}
                />
            )}
            {(!isMobile || !showSidebar) && (
                <>
                    {isMobile && (
                        <button onClick={() => setShowSidebar(true)} style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 1000, background: '#111', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '18px' }}>☰</button>
                    )}
                    {activeTab === 'chat' && (
                        <ChatWindow
                            recipient={recipient} setRecipient={setRecipient}
                            message={message} setMessage={setMessage}
                            messages={messages} searchResults={searchResults}
                            setSearchResults={setSearchResults} myPrivateKey={myPrivateKey}
                            username={username} onSend={handleSend}
                            onSendPhoto={handleSendPhoto}
                            onSendSticker={handleSendSticker}
                            onSendVoice={handleSendVoice}
                            onClearChat={handleClearChat}
                            onRemoveGhost={handleRemoveGhost}
                            onUnblock={handleUnblock}
                            ghostList={ghostList} ghostBlocked={ghostBlocked}
                        />
                    )}
                    {activeTab === 'search' && <SearchPage username={username} onStartChat={handleStartChat} />}
                    {activeTab === 'requests' && <RequestsPage username={username} onStartChat={handleStartChat} />}
                    {activeTab === 'ghosts' && <GhostsPage username={username} onStartChat={handleStartChat} />}
                    {activeTab === 'wall' && (
                        <WallPage
                            username={username}
                            myAvatar={myAvatar}
                            myBio={myBio}
                            myStatus={myStatus}
                            ghostCount={ghostList.length}
                        />
                    )}
                </>
            )}
            {showProfileEditor && <ProfileEditor username={username} onClose={() => setShowProfileEditor(false)} onSave={() => { setShowProfileEditor(false); refreshSession(); }} />}
            {viewProfileUser && <ProfileCard user={viewProfileUser} myUsername={username} onClose={() => setViewProfileUser(null)} onSendMessage={() => { handleSelectRecipient(viewProfileUser.username); setViewProfileUser(null); }} />}
        </div>
    );
};