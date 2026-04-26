import React, { useState } from "react";
import Register from "./Register";
import { Chat } from "./Chat";
import { Profile } from "./Profile";

// Главный интерфейс пользователя
export interface UserData {
    username: string;
    login: string;
    hashPassword: string;
    encryptionKey: string;
    photo?: string;
}

export default function App() {
    // 1. Инициализация пользователя из localStorage
    const [user, setUser] = useState<UserData | null>(() => {
        const savedUser = localStorage.getItem('hush_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // 2. Управление экранами
    const [screen, setScreen] = useState<'auth' | 'profile' | 'chats'>(() => {
        const savedUser = localStorage.getItem('hush_user');
        return savedUser ? 'profile' : 'auth';
    });

    const handleLogin = (userData: UserData) => {
        setUser(userData);
        setScreen('profile');
        localStorage.setItem('hush_user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        setScreen('auth');
        localStorage.removeItem('hush_user');
    };

    const handleUpdateUser = (updatedData: UserData) => {
        setUser(updatedData);
        localStorage.setItem('hush_user', JSON.stringify(updatedData));
    };

    // Если пользователь не авторизован, показываем экран регистрации
    if (screen === 'auth' && !user) {
        return <Register onRegister={handleLogin} />;
    }

    // Стили для навигации (эффект стекла)
    const navStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
    };

    const getNavBtnStyle = (isActive: boolean): React.CSSProperties => ({
        background: 'none',
        border: 'none',
        color: isActive ? '#22d3ee' : '#94a3b8', // cyan-400 или slate-400
        fontSize: '14px',
        fontWeight: '600',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        borderBottom: isActive ? '2px solid #22d3ee' : '2px solid transparent',
        paddingBottom: '5px'
    });

    return (
        <div style={{
            backgroundColor: '#020203',
            minHeight: '100vh',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* ФОНОВЫЕ ГРАДИЕНТЫ (как в Register) */}
            <div style={{
                position: 'absolute', top: '-10%', left: '-10%',
                width: '50%', height: '50%', borderRadius: '50%',
                background: 'rgba(124, 58, 237, 0.08)', // Violet
                filter: 'blur(120px)', zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute', bottom: '-10%', right: '-10%',
                width: '50%', height: '50%', borderRadius: '50%',
                background: 'rgba(5, 150, 105, 0.05)', // Emerald
                filter: 'blur(120px)', zIndex: 0
            }}></div>

            {/* ОСНОВНОЙ КОНТЕНТ */}
            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Навигация */}
                <nav style={navStyle}>
                    <button
                        onClick={() => setScreen('profile')}
                        style={getNavBtnStyle(screen === 'profile')}
                    >
                        Профиль
                    </button>
                    <button
                        onClick={() => setScreen('chats')}
                        style={getNavBtnStyle(screen === 'chats')}
                    >
                        Чаты
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{ ...getNavBtnStyle(false), color: '#ef4444', borderBottom: 'none' }}
                    >
                        Выход
                    </button>
                </nav>

                {/* Экраны */}
                <div style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '40px 20px',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    {screen === 'profile' && user && (
                        <Profile user={user} onUpdate={handleUpdateUser} />
                    )}

                    {screen === 'chats' && user && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: '800',
                                textAlign: 'center',
                                letterSpacing: '0.1em',
                                color: '#22d3ee'
                            }}>
                                MESSENGER
                            </h2>
                            <Chat username={user.username} />
                        </div>
                    )}
                </div>
            </div>

            {/* Простая анимация появления */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}