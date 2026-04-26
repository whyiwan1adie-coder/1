import React, { useState } from 'react';
import { UserData } from './App';

interface LoginProps {
    onLogin: (userData: UserData) => void;
    onSwitchToRegister: () => void;
}

// Интерфейс для ответа от сервера
interface LoginResponse {
    username: string;
    publicKey: string;
    photo?: string;
    error?: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Обработка входа
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            // Типизируем через unknown, чтобы линтер не ругался на any
            const rawData: unknown = await response.json();
            const data = rawData as LoginResponse;

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка входа');
            }

            // Передаем данные в App.tsx
            onLogin({
                username: data.username,
                login: data.username,
                hashPassword: '',
                encryptionKey: data.publicKey || 'HUSH_SESSION',
                photo: data.photo || ''
            });

        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(err.message);
            } else {
                alert('Произошла неизвестная ошибка');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            {/* Декоративные фоновые градиенты (как в Register) */}
            <div style={bgBlurViolet}></div>
            <div style={bgBlurEmerald}></div>

            <div style={cardStyle}>
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={logoStyle}>HUSH</h1>
                    <h2 style={titleStyle}>Вход в систему</h2>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <input
                        style={inputStyle}
                        placeholder="Никнейм"
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                    <input
                        style={inputStyle}
                        placeholder="Пароль"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button type="submit" disabled={isLoading} style={btnStyle}>
                        {isLoading ? 'ВХОД...' : 'АВТОРИЗОВАТЬСЯ'}
                    </button>
                </form>

                <button onClick={onSwitchToRegister} style={switchBtnStyle}>
                    Нет аккаунта? <span style={{ color: '#22d3ee' }}>Создать личность</span>
                </button>
            </div>
        </div>
    );
};

// --- СТИЛИ ---

const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#020203',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'system-ui, sans-serif'
};

const cardStyle: React.CSSProperties = {
    maxWidth: '400px',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    padding: '50px 40px',
    borderRadius: '40px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    zIndex: 10
};

const logoStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: '900',
    fontStyle: 'italic',
    margin: '0',
    background: 'linear-gradient(to bottom right, #fff, #22d3ee, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '0.1em'
};

const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginTop: '10px'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '16px 20px',
    borderRadius: '18px',
    color: 'white',
    outline: 'none',
    boxSizing: 'border-box',
    fontSize: '14px',
    transition: 'border-color 0.3s ease'
};

const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(45deg, #7c3aed, #22d3ee)',
    border: 'none',
    borderRadius: '18px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    fontSize: '14px',
    letterSpacing: '0.1em',
    boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)'
};

const switchBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#64748b',
    marginTop: '25px',
    cursor: 'pointer',
    fontSize: '13px',
    letterSpacing: '0.05em'
};

// Фоновые эффекты (светящиеся пятна)
const bgBlurViolet: React.CSSProperties = {
    position: 'absolute', top: '-10%', left: '-10%',
    width: '50%', height: '50%', borderRadius: '50%',
    background: 'rgba(124, 58, 237, 0.1)', filter: 'blur(120px)', zIndex: 0
};

const bgBlurEmerald: React.CSSProperties = {
    position: 'absolute', bottom: '-10%', right: '-10%',
    width: '50%', height: '50%', borderRadius: '50%',
    background: 'rgba(5, 150, 105, 0.08)', filter: 'blur(120px)', zIndex: 0
};