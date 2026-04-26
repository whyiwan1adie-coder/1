import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserData } from './App';

interface Message {
    sender: string;
    content: string;
    avatar?: string;
}

interface ChatProps {
    username: string;
}

const socket: Socket = io('http://127.0.0.1:3001');

export const Chat = ({ username }: ChatProps) => {
    const [recipient, setRecipient] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const savedUser: UserData = JSON.parse(localStorage.getItem('hush_user') || '{}');
    const myAvatar = savedUser.photo;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        socket.emit('join', username);
        socket.on('new_message', (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });
        return () => {
            socket.off('new_message');
        };
    }, [username]);

    const handleSend = () => {
        if (!recipient || !message) return;
        const msgData = {
            sender: username,
            receiver: recipient,
            content: message,
            avatar: myAvatar
        };
        socket.emit('send_message', msgData);
        setMessages((prev) => [...prev, { ...msgData, sender: 'Я' }]);
        setMessage('');
    };

    return (
        <div style={chatContainerStyle}>
            <div style={inputWrapperStyle}>
                <input
                    placeholder="КОМУ (НИКНЕЙМ)..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    style={recipientInputStyle}
                />
            </div>

            <div style={messagesBoxStyle}>
                {messages.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '100px', letterSpacing: '0.3em' }}>
                        КАНАЛ ПУСТ
                    </p>
                )}
                {messages.map((msg, i) => {
                    const isMe = msg.sender === 'Я';
                    return (
                        <div key={i} style={{
                            display: 'flex',
                            flexDirection: isMe ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            gap: '10px',
                            marginBottom: '15px'
                        }}>
                            <div style={avatarStyle}>
                                {msg.avatar ? (
                                    <img src={msg.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="av" />
                                ) : (
                                    <div style={avatarPlaceholderStyle}>{msg.sender[0].toUpperCase()}</div>
                                )}
                            </div>
                            <div style={{
                                ...bubbleStyle,
                                backgroundColor: isMe ? '#22d3ee' : 'rgba(255,255,255,0.05)',
                                color: isMe ? '#000' : '#fff',
                                borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            }}>
                                <small style={{ display: 'block', fontSize: '9px', fontWeight: '900', marginBottom: '4px', opacity: 0.6 }}>
                                    {isMe ? 'ВЫ' : msg.sender.toUpperCase()}
                                </small>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div style={sendBarStyle}>
                <input
                    placeholder="ВАШЕ СООБЩЕНИЕ..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    // ИСПРАВЛЕНО: onKeyDown вместо onKeyPress
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    style={messageInputStyle}
                />
                <button onClick={handleSend} style={sendButtonStyle}>➔</button>
            </div>
        </div>
    );
};

// Стили
const chatContainerStyle: React.CSSProperties = { background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '30px', display: 'flex', flexDirection: 'column', height: '550px', overflow: 'hidden' };
const inputWrapperStyle: React.CSSProperties = { padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' };
const recipientInputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '12px 20px', borderRadius: '15px', color: '#22d3ee', fontSize: '11px', letterSpacing: '0.1em', outline: 'none' };
const messagesBoxStyle: React.CSSProperties = { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' };
const bubbleStyle: React.CSSProperties = { padding: '12px 18px', maxWidth: '75%', fontSize: '14px', lineHeight: '1.4' };
const avatarStyle: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' };
const avatarPlaceholderStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #7c3aed, #22d3ee)', color: 'white', fontSize: '12px', fontWeight: 'bold' };
const sendBarStyle: React.CSSProperties = { padding: '20px', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)' };
const messageInputStyle: React.CSSProperties = { flex: 1, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '15px 20px', borderRadius: '18px', color: 'white', outline: 'none' };
const sendButtonStyle: React.CSSProperties = { width: '50px', height: '50px', borderRadius: '18px', border: 'none', background: '#fff', color: '#000', cursor: 'pointer' };