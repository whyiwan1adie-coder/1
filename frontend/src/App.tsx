import React, { useState } from 'react';
import { Chat } from './Chat';

// --- ЕДИНЫЙ ИНТЕРФЕЙС ДЛЯ ВСЕГО ПРОЕКТА ---
export interface UserData {
    username: string;
    photo?: string;
    nickname?: string;
    bio?: string;
    encryptionKey?: string;
    login?: string;
    hashPassword?: string;
}

const App: React.FC = () => {
    // Инициализация состояния напрямую из localStorage (избегаем каскадных рендеров)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        const session = localStorage.getItem('hush_session');
        if (session) {
            try {
                const parsed = JSON.parse(session);
                if (parsed && parsed.username) return true;
                localStorage.removeItem('hush_session');
            } catch {
                localStorage.removeItem('hush_session');
            }
        }
        return false;
    });

    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Поля регистрации
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [location, setLocation] = useState('');

    const handleLogin = async () => {
        if (!username || !password) return alert('CREDENTIALS_REQUIRED');
        try {
            const res = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (res.ok && data.username) {
                localStorage.setItem('hush_session', JSON.stringify(data));
                setIsLoggedIn(true);
            } else {
                alert(data.error || 'AUTHORIZATION_FAILED');
            }
        } catch (err) {
            console.error(err);
            alert('SYSTEM_OFFLINE: SERVER_UNREACHABLE');
        }
    };

    const handleRegister = async () => {
        if (!username || !password) return alert('DATA_REQUIRED');
        try {
            const res = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, gender, age, location }),
            });
            if (res.ok) {
                alert('IDENTITY_INITIALIZED. PROCEED TO LOGIN.');
                setIsRegistering(false);
            } else {
                const data = await res.json();
                alert(data.error || 'REGISTRATION_FAILED');
            }
        } catch (err) {
            console.error(err);
            alert('SYSTEM_OFFLINE: SERVER_UNREACHABLE');
        }
    };

    if (isLoggedIn) {
        let userData: UserData = { username: '' };
        try {
            userData = JSON.parse(localStorage.getItem('hush_session') || '{}');
        } catch {
            localStorage.clear();
            window.location.reload();
        }

        return (
            <div style={containerStyle}>
                <div style={headerArea}>
                    <h1 style={logoStyle}>HUSH // PROTECTED_NETWORK</h1>
                    <button style={logoutBtn} onClick={() => { localStorage.clear(); window.location.reload(); }}>
                        TERMINATE_SESSION
                    </button>
                </div>
                {userData.username ? <Chat username={userData.username} /> : null}
            </div>
        );
    }

    return (
        <div style={authContainerStyle}>
            <div style={authCardStyle}>
                <h1 style={authTitleStyle}>{isRegistering ? 'JOIN_NETWORK' : 'AUTHORIZE'}</h1>
                <p style={authSubtitleStyle}>
                    {isRegistering ? 'CREATE ANONYMOUS IDENTITY' : 'ESTABLISH SECURE LINK'}
                </p>

                <div style={formStyle}>
                    <input
                        style={inputStyle}
                        placeholder="USERNAME"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        style={inputStyle}
                        type="password"
                        placeholder="PASSWORD"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {isRegistering && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input style={{ ...inputStyle, flex: 1 }} placeholder="GENDER" onChange={e => setGender(e.target.value)} />
                                <input style={{ ...inputStyle, width: '100px' }} placeholder="AGE" type="number" onChange={e => setAge(e.target.value)} />
                            </div>
                            <input style={inputStyle} placeholder="PHYSICAL_LOCATION (OPTIONAL)" onChange={e => setLocation(e.target.value)} />
                        </div>
                    )}

                    <button
                        style={mainBtnStyle}
                        onClick={isRegistering ? handleRegister : handleLogin}
                    >
                        {isRegistering ? 'INITIALIZE_IDENTITY' : 'CONNECT'}
                    </button>

                    <p style={switchStyle} onClick={() => setIsRegistering(!isRegistering)}>
                        {isRegistering ? 'ALREADY REGISTERED? LOGIN' : 'NEW USER? JOIN THE VOID'}
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- STYLES ---
const containerStyle: React.CSSProperties = { padding: '40px', background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: '"Inter", sans-serif' };
const headerArea: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1000px', marginBottom: '30px' };
const logoStyle: React.CSSProperties = { fontSize: '14px', letterSpacing: '5px', color: '#22d3ee', fontWeight: '900' };
const logoutBtn: React.CSSProperties = { background: 'transparent', border: '1px solid #1a1a1a', color: '#333', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', transition: '0.3s' };
const authContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff', fontFamily: '"Inter", sans-serif' };
const authCardStyle: React.CSSProperties = { width: '100%', maxWidth: '400px', textAlign: 'center', padding: '20px' };
const authTitleStyle: React.CSSProperties = { fontSize: '40px', color: '#22d3ee', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '10px' };
const authSubtitleStyle: React.CSSProperties = { fontSize: '12px', color: '#444', letterSpacing: '3px', fontWeight: 'bold', marginBottom: '50px' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle: React.CSSProperties = { background: '#080808', border: '1px solid #1a1a1a', padding: '18px', borderRadius: '14px', color: '#22d3ee', fontSize: '15px', outline: 'none', fontWeight: 'bold' };
const mainBtnStyle: React.CSSProperties = { background: '#22d3ee', color: '#000', border: 'none', padding: '20px', borderRadius: '14px', cursor: 'pointer', fontWeight: '900', fontSize: '14px', marginTop: '15px' };
const switchStyle: React.CSSProperties = { fontSize: '11px', color: '#444', cursor: 'pointer', marginTop: '25px', fontWeight: 'bold' };

export default App;