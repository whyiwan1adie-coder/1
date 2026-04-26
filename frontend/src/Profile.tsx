import { useState } from 'react';
import { UserData } from './App';

interface ProfileProps {
    user: UserData;
    onUpdate: (newData: UserData) => void;
}

export const Profile = ({ user, onUpdate }: ProfileProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UserData>({ ...user });
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/users/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    avatar: formData.photo
                }),
            });

            if (!response.ok) throw new Error('Ошибка сохранения');

            onUpdate(formData);
            setIsEditing(false);
            alert('Профиль обновлен!');
        } catch {
            alert('Не удалось сохранить данные');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <h2 style={labelTopStyle}>Личность</h2>

            <div style={avatarContainerStyle}>
                <div style={avatarCircleStyle}>
                    {formData.photo ? (
                        <img src={formData.photo} style={imgStyle} alt="Avatar" />
                    ) : (
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '40px' }}>{user.username[0].toUpperCase()}</span>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div style={formStyle}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Ссылка на фото (URL)</label>
                        <input
                            style={inputStyle}
                            placeholder="https://example.com/photo.jpg"
                            value={formData.photo || ''}
                            onChange={e => setFormData({ ...formData, photo: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleSave} disabled={isLoading} style={{ ...btnStyle, background: '#fff', color: '#000' }}>
                            {isLoading ? '...' : 'Сохранить'}
                        </button>
                        <button onClick={() => setIsEditing(false)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Отмена</button>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    <p style={nameStyle}>{user.username}</p>
                    <div style={keyBoxStyle}>
                        <p style={keyLabelStyle}>Hush Private Key</p>
                        <code style={keyCodeStyle}>{user.encryptionKey}</code>
                    </div>
                    <button onClick={() => setIsEditing(true)} style={editBtnStyle}>Изменить настройки</button>
                </div>
            )}
        </div>
    );
};

const containerStyle: React.CSSProperties = { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '40px', borderRadius: '40px' };
const labelTopStyle: React.CSSProperties = { fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#22d3ee', marginBottom: '30px', textAlign: 'center' };
const avatarContainerStyle: React.CSSProperties = { textAlign: 'center', marginBottom: '30px' };
const avatarCircleStyle: React.CSSProperties = { width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(45deg, #7c3aed, #22d3ee)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid rgba(255, 255, 255, 0.1)' };
const imgStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle: React.CSSProperties = { fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginLeft: '10px' };
const inputStyle: React.CSSProperties = { padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' };
const btnStyle: React.CSSProperties = { flex: 1, padding: '15px', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' };
const nameStyle: React.CSSProperties = { fontSize: '32px', fontWeight: '900', marginBottom: '10px', fontStyle: 'italic' };
const keyBoxStyle: React.CSSProperties = { marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', textAlign: 'left' };
const keyLabelStyle: React.CSSProperties = { fontSize: '10px', color: '#64748b', marginBottom: '8px' };
const keyCodeStyle: React.CSSProperties = { wordBreak: 'break-all', color: '#22d3ee', fontSize: '11px', fontFamily: 'monospace' };
const editBtnStyle: React.CSSProperties = { marginTop: '30px', background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px', width: '100%', borderRadius: '15px', cursor: 'pointer' };