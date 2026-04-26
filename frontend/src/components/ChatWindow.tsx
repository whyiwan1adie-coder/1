import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
    chatWindowStyle, searchWrapperStyle, inputRecipientStyle, dropdownStyle,
    resItemStyle, msgBoxStyle, emptyStateStyle, bubbleStyle, avatarStyle,
    imgStyle, avatarPlaceholderStyle, sendBarStyle, msgInputStyle, sendBtnStyle
} from '../styles/chatStyles';
import { CryptoHelper } from '../utils/cryptoHelper';
import { ProfileCard } from './ProfileCard';

interface Message { sender: string; content: string; avatar?: string; nickname?: string; createdAt: string; }
interface User { username: string; nickname?: string; avatar?: string; publicKey?: string; bio?: string; age?: number; location?: string; languages?: string; status?: string; gender?: string; }

const STICKERS = ['❤️', '🔥', '🤡', '🤑', '🥰', '🥴', '🥶', '👻', '🤐', '😐', '🤨', '💀', '😈', '🎭', '💎', '🌟', '💩', '🎃', '😱', '👍', '👎', '💯', '🍆', '🐸'];

const VoicePlayer: React.FC<{ src: string }> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setPlaying(!playing);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoaded = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const formatTime = (t: number) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        audioRef.current.currentTime = pct * duration;
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '200px', padding: '8px 12px', background: '#111', borderRadius: '20px' }}>
            <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoaded} onEnded={() => setPlaying(false)} style={{ display: 'none' }} />
            <button onClick={togglePlay} style={{ background: 'transparent', border: 'none', color: '#22d3ee', cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}>
                {playing ? '⏸' : '▶'}
            </button>
            <div style={{ flex: 1, height: '4px', background: '#1a1a1a', borderRadius: '2px', cursor: 'pointer' }} onClick={handleSeek}>
                <div style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, height: '100%', background: '#22d3ee', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '10px', color: '#555', minWidth: '32px', textAlign: 'right' }}>{formatTime(currentTime)}</span>
        </div>
    );
};

interface DecryptedTextProps { content: string; sender: string; privateKey: CryptoKey | null; }

const DecryptedText: React.FC<DecryptedTextProps> = ({ content, sender, privateKey }) => {
    const [text, setText] = useState('...');
    const [isImage, setIsImage] = useState(false);
    const [isSticker, setIsSticker] = useState(false);
    const [isVoice, setIsVoice] = useState(false);
    const [decrypted, setDecrypted] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const decrypt = async () => {
            if (sender === 'ME') {
                if (content.startsWith('__STICKER__')) {
                    if (!cancelled) { setText(content.replace('__STICKER__', '')); setIsSticker(true); }
                } else if (content.startsWith('data:image/')) {
                    if (!cancelled) { setIsImage(true); setText(content); }
                } else if (content.startsWith('data:audio/')) {
                    if (!cancelled) { setIsVoice(true); setText(content); }
                } else {
                    if (!cancelled) setText(content);
                }
                return;
            }
            if (privateKey && !decrypted) {
                const imgResult = await CryptoHelper.decryptLargeData(content, privateKey);
                if (imgResult) {
                    if (!cancelled) {
                        if (imgResult.startsWith('data:audio/')) {
                            setIsVoice(true); setText(imgResult);
                        } else {
                            setIsImage(true); setText(imgResult);
                        }
                        setDecrypted(true);
                    }
                    return;
                }
                const result = await CryptoHelper.decryptHybrid(content, privateKey);
                if (!cancelled) {
                    if (result.startsWith('__STICKER__')) {
                        setText(result.replace('__STICKER__', ''));
                        setIsSticker(true);
                    } else {
                        setText(result);
                    }
                    setDecrypted(true);
                }
            }
        };
        decrypt();
        return () => { cancelled = true; };
    }, [content, sender, privateKey, decrypted]);

    if (isImage) {
        return (
            <img src={text} style={{ maxWidth: '250px', maxHeight: '250px', borderRadius: '10px', cursor: 'pointer' }} alt="photo" onClick={() => window.open(text, '_blank')} />
        );
    }
    if (isSticker) {
        return <span style={{ fontSize: '64px', lineHeight: '1' }}>{text}</span>;
    }
    if (isVoice) {
        return <VoicePlayer src={text} />;
    }
    return <span>{text}</span>;
};

interface ChatWindowProps {
    recipient: string;
    setRecipient: (val: string) => void;
    message: string;
    setMessage: (val: string) => void;
    messages: Message[];
    searchResults: User[];
    setSearchResults: (val: User[]) => void;
    myPrivateKey: CryptoKey | null;
    username: string;
    onSend: () => void;
    onSendPhoto: (file: File) => void;
    onSendSticker: (sticker: string) => void;
    onSendVoice: (audioBase64: string) => void;
    onClearChat: (recipient: string) => void;
    onRemoveGhost: (recipient: string) => void;
    onUnblock: (recipient: string) => void;
    ghostList: { username: string; nickname?: string }[];
    ghostBlocked: string[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    recipient, setRecipient, message, setMessage, messages, searchResults,
    setSearchResults, myPrivateKey, username, onSend, onSendPhoto, onSendSticker,
    onSendVoice, onClearChat, onRemoveGhost, onUnblock, ghostList, ghostBlocked
}) => {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
    const [showStickers, setShowStickers] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const displayName = useMemo(() => {
        if (!recipient) return 'ANONYMOUS';
        const ghost = ghostList.find(g => g.username === recipient);
        return ghost?.nickname || 'ANONYMOUS';
    }, [recipient, ghostList]);

    const handleSearch = (value: string) => {
        setRecipient(value);
        if (value.length > 1) {
            fetch(`http://localhost:3001/api/users/search?query=${value}&me=${username}`)
                .then(r => r.json()).then((data: User[]) => setSearchResults(data));
        } else { setSearchResults([]); }
    };

    const selectUser = (user: User) => { setRecipient(user.username); setSearchResults([]); setSelectedProfile(null); };
    const openProfileFromSearch = (user: User) => { setSelectedProfile(user); };
    const openProfileFromChat = () => {
        if (recipient) {
            fetch(`http://localhost:3001/api/users/search?query=${recipient}&me=${username}`)
                .then(r => r.json()).then((data: User[]) => {
                    const user = data.find(u => u.username === recipient);
                    if (user) setSelectedProfile(user);
                });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onSendPhoto(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleStickerClick = (sticker: string) => {
        onSendSticker(sticker);
        setShowStickers(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result as string;
                    onSendVoice(base64);
                };
                reader.readAsDataURL(blob);
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch {
            alert('Микрофон недоступен');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const filteredMessages = recipient
        ? messages.filter(m => m.sender === recipient || (m.sender === 'ME' && recipient))
        : [];

    const isBlocked = ghostBlocked.includes(recipient);

    const isStickerBubble = (content: string) => {
        return content.startsWith('__STICKER__') || content.startsWith('data:image/') || content.startsWith('data:audio/');
    };

    return (
        <div style={chatWindowStyle}>
            <div style={searchWrapperStyle}>
                <input placeholder="SEARCH BY NICKNAME..." value={recipient} onChange={e => handleSearch(e.target.value)} style={inputRecipientStyle} />
                {searchResults.length > 0 && (
                    <div style={dropdownStyle}>
                        {searchResults.map(u => (
                            <div key={u.username} style={resItemStyle}>
                                <div onClick={() => selectUser(u)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#22d3ee', overflow: 'hidden', flexShrink: 0 }}>
                                        {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (u.nickname || '?')[0]}
                                    </div>
                                    <span>{u.nickname || 'ANONYMOUS'}</span>
                                </div>
                                <button onClick={() => openProfileFromSearch(u)} style={{ background: 'transparent', border: '1px solid #333', color: '#555', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>ПРОФИЛЬ</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={msgBoxStyle}>
                {recipient ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 0 20px 0', borderBottom: '1px solid #0a0a0a', marginBottom: '20px' }}>
                            <div onClick={openProfileFromChat} style={{ ...avatarStyle, cursor: 'pointer' }}><div style={avatarPlaceholderStyle}>{displayName[0]}</div></div>
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={openProfileFromChat}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#22d3ee' }}>{displayName}</div>
                                <div style={{ fontSize: '10px', color: '#444' }}>нажмите для просмотра профиля</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => onClearChat(recipient)} title="Очистить диалог" style={actionBtnStyle}>🗑️</button>
                                {isBlocked ? (
                                    <button onClick={() => onUnblock(recipient)} title="Разблокировать" style={{ ...actionBtnStyle, background: 'rgba(34,211,238,0.1)' }}>🔓</button>
                                ) : (
                                    <button onClick={() => onRemoveGhost(recipient)} title="Удалить из Ghosts" style={actionBtnStyle}>💀</button>
                                )}
                                <button title="Звонок (скоро)" style={{ ...actionBtnStyle, opacity: 0.3, cursor: 'default' }}>📞</button>
                            </div>
                        </div>

                        {isBlocked && (
                            <div style={{ padding: '15px', background: 'rgba(168,85,247,0.1)', border: '1px solid #a855f7', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{ fontSize: '14px', color: '#a855f7', fontWeight: 'bold' }}>💀 BLOCKED</div>
                                <div style={{ fontSize: '11px', color: '#555', marginTop: '5px' }}>You blocked this user. Messages are not delivered.</div>
                            </div>
                        )}

                        {filteredMessages.map((msg, i) => {
                            const isMe = msg.sender === 'ME';
                            const isStickerLike = isStickerBubble(msg.content);
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '12px', marginBottom: '18px' }}>
                                    <div style={{ ...avatarStyle, cursor: 'pointer' }} onClick={!isMe ? openProfileFromChat : undefined}>
                                        {msg.avatar ? <img src={msg.avatar} style={imgStyle} alt="" /> : <div style={avatarPlaceholderStyle}>{msg.sender[0]}</div>}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={isStickerLike ? { background: 'transparent', padding: '4px' } : bubbleStyle(isMe)}>
                                            <DecryptedText content={msg.content} sender={msg.sender} privateKey={myPrivateKey} />
                                        </div>
                                        <div style={{ fontSize: '9px', color: '#333', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <div style={emptyStateStyle}>ESTABLISH_CONNECTION</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {recipient && !isBlocked && (
                <>
                    <div style={sendBarStyle}>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
                        <button onClick={() => fileInputRef.current?.click()} style={iconBtnStyle} title="Фото">📷</button>
                        <button onClick={() => setShowStickers(!showStickers)} style={{ ...iconBtnStyle, background: showStickers ? 'rgba(34,211,238,0.15)' : 'transparent' }} title="Стикеры">😊</button>
                        <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            style={{ ...iconBtnStyle, background: isRecording ? 'rgba(239,68,68,0.3)' : 'transparent', borderColor: isRecording ? '#ef4444' : '#1a1a1a' }}
                            title="Голосовое"
                        >
                            {isRecording ? '🔴' : '🎙️'}
                        </button>
                        <input placeholder="SECURE_INPUT..." value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()} style={msgInputStyle} />
                        <button onClick={onSend} style={sendBtnStyle}>SEND</button>
                    </div>

                    {showStickers && (
                        <div style={stickerPanelStyle}>
                            {STICKERS.map(s => (
                                <button key={s} onClick={() => handleStickerClick(s)} style={stickerBtnStyle}>
                                    <span style={{ fontSize: '36px' }}>{s}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {selectedProfile && (
                <ProfileCard user={selectedProfile} myUsername={username} onClose={() => setSelectedProfile(null)} onSendMessage={() => selectUser(selectedProfile)} />
            )}
        </div>
    );
};

const actionBtnStyle: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: '1px solid #1a1a1a', color: '#555', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };

const iconBtnStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '10px', background: 'transparent', border: '1px solid #1a1a1a', color: '#555', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

const stickerPanelStyle: React.CSSProperties = {
    padding: '10px', borderTop: '1px solid #1a1a1a',
    display: 'flex', flexWrap: 'wrap', gap: '6px',
    maxHeight: '200px', overflowY: 'auto',
    background: '#050505'
};

const stickerBtnStyle: React.CSSProperties = {
    width: '56px', height: '56px', borderRadius: '12px',
    background: 'transparent', border: '1px solid #1a1a1a',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 0
};