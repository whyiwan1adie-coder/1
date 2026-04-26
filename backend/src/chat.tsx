// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Подключаемся к бэкенду. Используем 127.0.0.1 чтобы избежать проблем с localhost
const socket = io('http://127.0.0.1:3001');

export const Chat = ({ username }) => {
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Заходим в чат
        socket.emit('join', username);

        // Слушаем новые сообщения
        socket.on('new_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        // Слушаем оффлайн сообщения
        socket.on('offline_messages', (msgs) => {
            const formatted = msgs.map(m => ({
                sender: 'Оффлайн',
                content: m.content
            }));
            setMessages((prev) => [...prev, ...formatted]);
        });

        return () => {
            socket.off('new_message');
            socket.off('offline_messages');
        };
    }, [username]);

    const handleSend = () => {
        if (!recipient || !message) return;

        const msgData = {
            sender: username,
            receiver: recipient,
            content: message
        };

        socket.emit('send_message', msgData);
        setMessages((prev) => [...prev, { sender: 'Я', content: message }]);
        setMessage('');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h3>Чат: {username}</h3>
            <input
                placeholder="Кому..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ alignSelf: msg.sender === 'Я' ? 'flex-end' : 'flex-start', margin: '5px', padding: '8px', background: msg.sender === 'Я' ? '#007bff' : '#eee', color: msg.sender === 'Я' ? '#white' : '#000', borderRadius: '10px' }}>
                        <small style={{ display: 'block', fontSize: '10px' }}>{msg.sender}</small>
                        {msg.content}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div style={{ display: 'flex', marginTop: '10px' }}>
                <input
                    placeholder="Сообщение..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ flex: 1, padding: '8px' }}
                />
                <button onClick={handleSend} style={{ padding: '8px' }}>➔</button>
            </div>
        </div>
    );
};