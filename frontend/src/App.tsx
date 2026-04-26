import React, { useState } from 'react';
import { Chat } from './components/Chat';
import { CryptoHelper } from './utils/cryptoHelper';

export interface UserData {
    username: string;
    photo?: string;
    nickname?: string;
    bio?: string;
    status?: string;
    location?: string;
    languages?: string;
    age?: number;
    gender?: string;
}

const App: React.FC = () => {
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
    const [showAccessKey, setShowAccessKey] = useState(false);
    const [accessKey, setAccessKey] = useState('');
    const [useAccessKeyLogin, setUseAccessKeyLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [accessKeyInput, setAccessKeyInput] = useState('');
    const [registeredUsername, setRegisteredUsername] = useState('');

    const [gender, setGender] = useState('не указан');
    const [age, setAge] = useState('');
    const [location, setLocation] = useState('не_указано');

    const saveEncryptedKey = async (user: string, pass: string, privateKeyJwk: string) => {
        const encrypted = await CryptoHelper.encryptPrivateKey(privateKeyJwk, pass);
        localStorage.setItem(`hush_vault_${user}`, encrypted);
    };

    const handleLogin = async () => {
        if (!username) return alert('ВВЕДИТЕ ЛОГИН');

        if (useAccessKeyLogin) {
            if (!accessKeyInput) return alert('ВВЕДИТЕ КЛЮЧ ДОСТУПА');
            try {
                const res = await fetch('http://localhost:3001/api/auth/login-with-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, accessKey: accessKeyInput }),
                });
                const data = await res.json();
                if (res.ok && data.username) {
                    localStorage.setItem('hush_session', JSON.stringify(data));
                    setIsLoggedIn(true);
                } else {
                    alert(data.error || 'АККАУНТ НЕ НАЙДЕН ИЛИ КЛЮЧ НЕВЕРЕН');
                }
            } catch (err) {
                console.error(err);
                alert('СЕРВЕР НЕДОСТУПЕН');
            }
        } else {
            if (!password) return alert('ВВЕДИТЕ ПАРОЛЬ');
            try {
                const encryptedKey = localStorage.getItem(`hush_vault_${username}`);
                if (encryptedKey) {
                    const decrypted = await CryptoHelper.decryptPrivateKey(encryptedKey, password);
                    if (!decrypted) {
                        alert('НЕВЕРНЫЙ ПАРОЛЬ ДЛЯ РАСШИФРОВКИ КЛЮЧА');
                        return;
                    }
                }

                const res = await fetch('http://localhost:3001/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await res.json();
                if (res.ok && data.username) {
                    localStorage.setItem('hush_session', JSON.stringify(data));
                    sessionStorage.setItem('hush_pass', password);
                    setIsLoggedIn(true);
                } else {
                    alert(data.error || 'ОШИБКА ВХОДА');
                }
            } catch (err) {
                console.error(err);
                alert('СЕРВЕР НЕДОСТУПЕН');
            }
        }
    };

    const handleRegister = async () => {
        if (!username || !password) return alert('ВВЕДИТЕ ЛОГИН И ПАРОЛЬ');
        try {
            const res = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, gender, age: Number(age) || 0, location }),
            });
            const data = await res.json();
            if (res.ok && data.accessKey) {
                const keys = await CryptoHelper.createNewKeys();
                await saveEncryptedKey(username, password, keys.privateKeyJwk);

                await fetch('http://localhost:3001/api/users/update', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, publicKey: keys.publicKeyPem })
                });

                setAccessKey(data.accessKey);
                setRegisteredUsername(data.username);
                setShowAccessKey(true);
            } else {
                alert(data.error || 'ОШИБКА РЕГИСТРАЦИИ');
            }
        } catch (err) {
            console.error(err);
            alert('СЕРВЕР НЕДОСТУПЕН');
        }
    };

    const handleCopyKey = () => {
        navigator.clipboard.writeText(accessKey);
        alert('КЛЮЧ СКОПИРОВАН. СОХРАНИТЕ ЕГО!');
    };

    const handleAfterRegister = () => {
        setIsRegistering(false);
        setShowAccessKey(false);
        setUsername(registeredUsername);
        setUseAccessKeyLogin(true);
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
                    <button style={logoutBtn} onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}>
                        TERMINATE_SESSION
                    </button>
                </div>
                {userData.username ? <Chat username={userData.username} /> : null}
            </div>
        );
    }

    if (showAccessKey) {
        return (
            <div style={authContainerStyle}>
                <div style={authCardStyle}>
                    <h1 style={authTitleStyle}>КЛЮЧ ДОСТУПА</h1>
                    <p style={authSubtitleStyle}>СОХРАНИТЕ ЕГО. ОН ПОКАЗЫВАЕТСЯ ТОЛЬКО ОДИН РАЗ</p>
                    <div style={keyBoxStyle}>
                        <code style={keyTextStyle}>{accessKey}</code>
                    </div>
                    <button style={mainBtnStyle} onClick={handleCopyKey}>СКОПИРОВАТЬ КЛЮЧ</button>
                    <button style={{ ...mainBtnStyle, background: '#111', color: '#22d3ee', marginTop: '10px' }} onClick={handleAfterRegister}>Я СОХРАНИЛ, ВОЙТИ</button>
                </div>
            </div>
        );
    }

    return (
        <div style={authContainerStyle}>
            <div style={authCardStyle}>
                <h1 style={authTitleStyle}>{isRegistering ? 'СОЗДАТЬ АККАУНТ' : 'ВХОД'}</h1>
                <p style={authSubtitleStyle}>
                    {isRegistering ? 'АНАРХИЧНАЯ РЕГИСТРАЦИЯ' : useAccessKeyLogin ? 'ВХОД ПО КЛЮЧУ ДОСТУПА' : 'ВХОД ПО ПАРОЛЮ'}
                </p>

                <div style={formStyle}>
                    <input style={inputStyle} placeholder="ЛОГИН" value={username} onChange={(e) => setUsername(e.target.value)} />

                    {isRegistering ? (
                        <>
                            <input style={inputStyle} type="password" placeholder="ПАРОЛЬ" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select style={{ ...inputStyle, flex: 1 }} value={gender} onChange={e => setGender(e.target.value)}>
                                    <option value="не указан">ПОЛ</option>
                                    <option value="мужской">МУЖСКОЙ</option>
                                    <option value="женский">ЖЕНСКИЙ</option>
                                </select>
                                <input style={{ ...inputStyle, width: '100px' }} placeholder="ВОЗРАСТ" type="number" value={age} onChange={e => setAge(e.target.value)} />
                            </div>
                            <select style={inputStyle} value={location} onChange={e => setLocation(e.target.value)}>
                                <option value="не_указано">ЛОКАЦИЯ</option>
                                <option value="россия">РОССИЯ</option>
                                <option value="европа">ЕВРОПА</option>
                                <option value="азия">АЗИЯ</option>
                                <option value="америка">АМЕРИКА</option>
                                <option value="африка">АФРИКА</option>
                                <option value="океания">ОКЕАНИЯ</option>
                            </select>
                        </>
                    ) : useAccessKeyLogin ? (
                        <input style={inputStyle} placeholder="КЛЮЧ ДОСТУПА" value={accessKeyInput} onChange={(e) => setAccessKeyInput(e.target.value)} />
                    ) : (
                        <input style={inputStyle} type="password" placeholder="ПАРОЛЬ" value={password} onChange={(e) => setPassword(e.target.value)} />
                    )}

                    <button style={mainBtnStyle} onClick={isRegistering ? handleRegister : handleLogin}>
                        {isRegistering ? 'СОЗДАТЬ' : 'ВОЙТИ'}
                    </button>

                    {!isRegistering && (
                        <p style={switchStyle} onClick={() => setUseAccessKeyLogin(!useAccessKeyLogin)}>
                            {useAccessKeyLogin ? 'ВОЙТИ ПО ПАРОЛЮ' : 'ВОЙТИ ПО КЛЮЧУ ДОСТУПА'}
                        </p>
                    )}

                    <p style={switchStyle} onClick={() => { setIsRegistering(!isRegistering); setUseAccessKeyLogin(false); }}>
                        {isRegistering ? 'УЖЕ ЕСТЬ АККАУНТ? ВОЙТИ' : 'СОЗДАТЬ НОВЫЙ АККАУНТ'}
                    </p>
                </div>
            </div>
        </div>
    );
};

const containerStyle: React.CSSProperties = { padding: '40px', background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: '"Inter", sans-serif' };
const headerArea: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1000px', marginBottom: '30px' };
const logoStyle: React.CSSProperties = { fontSize: '14px', letterSpacing: '5px', color: '#22d3ee', fontWeight: '900' };
const logoutBtn: React.CSSProperties = { background: 'transparent', border: '1px solid #1a1a1a', color: '#333', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', transition: '0.3s' };
const authContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff', fontFamily: '"Inter", sans-serif' };
const authCardStyle: React.CSSProperties = { width: '100%', maxWidth: '400px', textAlign: 'center', padding: '20px' };
const authTitleStyle: React.CSSProperties = { fontSize: '32px', color: '#22d3ee', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '10px' };
const authSubtitleStyle: React.CSSProperties = { fontSize: '12px', color: '#444', letterSpacing: '3px', fontWeight: 'bold', marginBottom: '50px' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle: React.CSSProperties = { background: '#080808', border: '1px solid #1a1a1a', padding: '18px', borderRadius: '14px', color: '#22d3ee', fontSize: '15px', outline: 'none', fontWeight: 'bold', width: '100%', boxSizing: 'border-box' };
const mainBtnStyle: React.CSSProperties = { background: '#22d3ee', color: '#000', border: 'none', padding: '20px', borderRadius: '14px', cursor: 'pointer', fontWeight: '900', fontSize: '14px', marginTop: '15px' };
const switchStyle: React.CSSProperties = { fontSize: '11px', color: '#444', cursor: 'pointer', marginTop: '25px', fontWeight: 'bold' };
const keyBoxStyle: React.CSSProperties = { background: '#080808', border: '1px solid #22d3ee', padding: '20px', borderRadius: '14px', marginBottom: '20px', wordBreak: 'break-all' };
const keyTextStyle: React.CSSProperties = { color: '#22d3ee', fontSize: '14px', fontFamily: 'monospace' };

export default App;