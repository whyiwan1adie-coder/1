import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// --- ADVANCED HYBRID CRYPTO (RSA-OAEP + AES-GCM) ---
const CryptoHelper = {
    async createNewKeys() {
        const keys = await window.crypto.subtle.generateKey(
            { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
            true, ["encrypt", "decrypt"]
        );
        const pub = await window.crypto.subtle.exportKey("spki", keys.publicKey);
        const priv = await window.crypto.subtle.exportKey("jwk", keys.privateKey);
        return {
            publicKeyPem: btoa(String.fromCharCode(...new Uint8Array(pub))),
            privateKeyJwk: JSON.stringify(priv),
            rawPriv: keys.privateKey
        };
    },
    async importPrivateKey(jwkString: string) {
        return await window.crypto.subtle.importKey("jwk", JSON.parse(jwkString), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
    },
    async encryptHybrid(text: string, publicKeyPem: string) {
        const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(text));
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const binaryDer = new Uint8Array(atob(publicKeyPem).split("").map(c => c.charCodeAt(0)));
        const pubKeyObj = await window.crypto.subtle.importKey("spki", binaryDer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
        const encryptedAesKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKeyObj, exportedAesKey);

        return JSON.stringify({
            k: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))),
            i: btoa(String.fromCharCode(...new Uint8Array(iv))),
            d: btoa(String.fromCharCode(...new Uint8Array(encryptedContent)))
        });
    },
    async decryptHybrid(packetStr: string, privateKey: CryptoKey) {
        try {
            const p = JSON.parse(packetStr);
            const aesKeyRaw = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, new Uint8Array(atob(p.k).split("").map(c => c.charCodeAt(0))));
            const aesKey = await window.crypto.subtle.importKey("raw", aesKeyRaw, "AES-GCM", true, ["decrypt"]);
            const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(atob(p.i).split("").map(c => c.charCodeAt(0))) }, aesKey, new Uint8Array(atob(p.d).split("").map(c => c.charCodeAt(0))));
            return new TextDecoder().decode(decrypted);
        } catch { return "[DECRYPTION_ERROR: ILLEGAL_KEY]"; }
    }
};

interface Message { sender: string; content: string; avatar?: string; nickname?: string; createdAt: string; }
interface SessionItem { username: string; nickname?: string; avatar?: string; lastTime: string; }

const socket: Socket = io('http://127.0.0.1:3001');

export const Chat = ({ username }: { username: string }) => {
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [myPrivateKey, setMyPrivateKey] = useState<CryptoKey | null>(null);
    const [myAvatar, setMyAvatar] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // --- ARCHIVE LOGIC ---
    const loadArchive = useCallback(() => {
        const archive = JSON.parse(localStorage.getItem(`hush_arc_${username}`) || "[]");
        setMessages(archive);
        buildSessions(archive);
    }, [username]);

    const buildSessions = (msgs: Message[]) => {
        const map = new Map();
        msgs.forEach(m => {
            const partner = m.sender === 'ME' ? (recipient || '...') : m.sender;
            if (partner === 'ME' || partner === '...') return;
            map.set(partner, { username: partner, nickname: m.nickname, avatar: m.avatar, lastTime: m.createdAt });
        });
        setSessions(Array.from(map.values()).sort((a, b) => b.lastTime.localeCompare(a.lastTime)));
    };

    const addToArchive = useCallback((msg: Message) => {
        const archive = JSON.parse(localStorage.getItem(`hush_arc_${username}`) || "[]");
        if (archive.some((m: any) => m.createdAt === msg.createdAt && m.sender === msg.sender)) return;
        const newArchive = [...archive, msg];
        localStorage.setItem(`hush_arc_${username}`, JSON.stringify(newArchive));
        setMessages(newArchive);
        buildSessions(newArchive);
    }, [username, recipient]);

    // --- INITIALIZE ---
    useEffect(() => {
        const init = async () => {
            const saved = JSON.parse(localStorage.getItem('hush_session') || '{}');
            setMyAvatar(saved.photo || null);

            let privKey: CryptoKey;
            const storedKey = localStorage.getItem(`hush_vault_${username}`);
            if (!storedKey) {
                const n = await CryptoHelper.createNewKeys();
                localStorage.setItem(`hush_vault_${username}`, n.privateKeyJwk);
                privKey = n.rawPriv;
                await fetch('http://localhost:3001/api/users/update', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, publicKey: n.publicKeyPem }) });
            } else {
                privKey = await CryptoHelper.importPrivateKey(storedKey);
            }
            setMyPrivateKey(privKey);
            loadArchive();
            socket.emit('join', username);
        };
        init();
    }, [username, loadArchive]);

    // --- INCOMING MESSAGES ---
    useEffect(() => {
        const handler = (msg: Message) => addToArchive(msg);
        socket.on('new_message', handler);
        socket.on('offline_messages', (msgs: Message[]) => msgs.forEach(handler));
        return () => { socket.off('new_message'); socket.off('offline_messages'); };
    }, [addToArchive]);

    // --- ACTIONS ---
    const handleSend = async () => {
        if (!recipient || !message) return;
        try {
            const res = await fetch(`http://localhost:3001/api/users/key/${recipient}`);
            const data = await res.json();
            if (!data.publicKey) return alert("System: Public key missing.");

            const encrypted = await CryptoHelper.encryptHybrid(message, data.publicKey);
            const myMsg = { sender: 'ME', content: message, createdAt: new Date().toISOString() };

            socket.emit('send_message', { sender: username, receiver: recipient, content: encrypted });
            addToArchive(myMsg);
            setMessage('');
        } catch (e) { console.error(e); }
    };

    const DecryptedText = ({ content, sender }: { content: string, sender: string }) => {
        const [text, setText] = useState('...');
        useEffect(() => {
            if (sender === 'ME') { setText(content); return; }
            if (myPrivateKey) CryptoHelper.decryptHybrid(content, myPrivateKey).then(setText);
        }, [content, sender]);
        return <span>{text}</span>;
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    return (
        <div style={mainLayoutStyle}>
            {/* SIDEBAR */}
            <div style={sidebarStyle}>
                <div style={profileAreaStyle}>
                    <div style={avatarMainStyle}>
                        {myAvatar ? <img src={myAvatar} style={imgStyle} alt="" /> : username[0].toUpperCase()}
                    </div>
                    <div style={nicknameDisplayStyle}>{username}</div>
                    <div style={bioDisplayStyle}>ENCRYPTED_VAULT</div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <div style={listHeaderStyle}>ACTIVE_SESSIONS</div>
                    {sessions.map(s => (
                        <div key={s.username} onClick={() => setRecipient(s.username)} style={{ ...chatItemStyle, background: recipient === s.username ? 'rgba(34, 211, 238, 0.15)' : 'transparent' }}>
                            <div style={avatarMiniStyle}>{s.avatar ? <img src={s.avatar} style={imgStyle} alt="" /> : s.username[0]}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: recipient === s.username ? '#22d3ee' : '#fff' }}>{s.nickname || s.username}</div>
                                <div style={{ fontSize: '10px', color: '#444' }}>{new Date(s.lastTime).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CHAT */}
            <div style={chatWindowStyle}>
                <div style={searchWrapperStyle}>
                    <input placeholder="SEARCH_ID..." value={recipient} onChange={e => {
                        setRecipient(e.target.value);
                        if (e.target.value.length > 1) fetch(`http://localhost:3001/api/users/search?query=${e.target.value}&me=${username}`).then(r => r.json()).then(setSearchResults);
                    }} style={inputRecipientStyle} />
                    {searchResults.length > 0 && (
                        <div style={dropdownStyle}>
                            {searchResults.map(u => <div key={u.username} style={resItemStyle} onClick={() => { setRecipient(u.username); setSearchResults([]); }}>{u.nickname || u.username} (@{u.username})</div>)}
                        </div>
                    )}
                </div>

                <div style={msgBoxStyle}>
                    {recipient ? (
                        messages.filter(m => m.sender === recipient || (m.sender === 'ME' && recipient)).map((msg, i) => {
                            const isMe = msg.sender === 'ME';
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '12px', marginBottom: '18px' }}>
                                    <div style={avatarStyle}>{msg.avatar ? <img src={msg.avatar} style={imgStyle} alt="" /> : <div style={avatarPlaceholderStyle}>{msg.sender[0]}</div>}</div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ ...bubbleStyle, background: isMe ? '#22d3ee' : '#111', color: isMe ? '#000' : '#fff', fontWeight: isMe ? 'bold' : 'normal' }}>
                                            <DecryptedText content={msg.content} sender={msg.sender} />
                                        </div>
                                        <div style={{ fontSize: '9px', color: '#333', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            );
                        })
                    ) : <div style={emptyStateStyle}>ESTABLISH_CONNECTION</div>}
                    <div ref={messagesEndRef} />
                </div>

                {recipient && (
                    <div style={sendBarStyle}>
                        <input placeholder="SECURE_INPUT..." value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} style={msgInputStyle} />
                        <button onClick={handleSend} style={sendBtnStyle}>SEND</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STYLES (ENLARGED & NEON) ---
const mainLayoutStyle: React.CSSProperties = { display: 'flex', height: '680px', width: '1000px', margin: '0 auto', background: '#000', border: '1px solid #1a1a1a', borderRadius: '24px', overflow: 'hidden', color: '#fff', fontFamily: 'Inter, sans-serif' };
const sidebarStyle: React.CSSProperties = { width: '280px', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column' };
const profileAreaStyle: React.CSSProperties = { padding: '30px 20px', borderBottom: '1px solid #1a1a1a', textAlign: 'center' };
const avatarMainStyle: React.CSSProperties = { width: '80px', height: '80px', borderRadius: '20px', background: '#111', margin: '0 auto', border: '2px solid #22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#22d3ee' };
const nicknameDisplayStyle: React.CSSProperties = { fontSize: '20px', color: '#22d3ee', fontWeight: '900', marginTop: '15px' };
const bioDisplayStyle: React.CSSProperties = { fontSize: '12px', color: '#555', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold' };
const listHeaderStyle: React.CSSProperties = { padding: '15px 20px', fontSize: '11px', color: '#333', fontWeight: 'bold', letterSpacing: '2px' };
const chatItemStyle: React.CSSProperties = { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', borderBottom: '1px solid #050505' };
const avatarMiniStyle: React.CSSProperties = { width: '42px', height: '42px', borderRadius: '12px', background: '#111', border: '1px solid #222', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#22d3ee' };
const chatWindowStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', background: '#000' };
const searchWrapperStyle: React.CSSProperties = { padding: '20px', borderBottom: '1px solid #1a1a1a' };
const inputRecipientStyle: React.CSSProperties = { width: '100%', background: '#080808', border: '1px solid #1a1a1a', padding: '14px 18px', borderRadius: '12px', color: '#22d3ee', fontSize: '14px', outline: 'none' };
const dropdownStyle: React.CSSProperties = { position: 'absolute', top: '80px', left: '20px', right: '20px', background: '#080808', border: '1px solid #22d3ee', borderRadius: '12px', zIndex: 10 };
const resItemStyle: React.CSSProperties = { padding: '15px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #1a1a1a' };
const msgBoxStyle: React.CSSProperties = { flex: 1, padding: '30px', overflowY: 'auto' };
const emptyStateStyle: React.CSSProperties = { textAlign: 'center', marginTop: '200px', color: '#1a1a1a', fontSize: '16px', letterSpacing: '6px', fontWeight: '900' };
const bubbleStyle: React.CSSProperties = { padding: '14px 20px', borderRadius: '16px', maxWidth: '350px', fontSize: '15px', lineHeight: '1.6', wordWrap: 'break-word' };
const avatarStyle: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '10px', overflow: 'hidden' };
const imgStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const avatarPlaceholderStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#22d3ee', fontWeight: 'bold' };
const sendBarStyle: React.CSSProperties = { padding: '25px', display: 'flex', gap: '15px', borderTop: '1px solid #1a1a1a' };
const msgInputStyle: React.CSSProperties = { flex: 1, background: '#080808', border: '1px solid #1a1a1a', padding: '16px 20px', borderRadius: '14px', color: '#fff', outline: 'none', fontSize: '15px' };
const sendBtnStyle: React.CSSProperties = { padding: '0 30px', background: '#22d3ee', color: '#000', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '900' };