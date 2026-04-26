import { useState } from 'react';
import { UserData } from './App';

interface ProfileProps {
    user: UserData;
    onUpdate: (newData: UserData) => void;
}

export const Profile = ({ user, onUpdate }: ProfileProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UserData>({ ...user });

    const handleSave = () => {
        onUpdate(formData);
        setIsEditing(false);
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '40px',
            borderRadius: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
            <h2 style={{
                fontSize: '12px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#22d3ee',
                marginBottom: '30px',
                textAlign: 'center'
            }}>
                Личность
            </h2>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #7c3aed, #22d3ee)',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    overflow: 'hidden',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 0 30px rgba(34, 211, 238, 0.2)'
                }}>
                    {user.photo ? (
                        <img src={user.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                    ) : (
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{user.username[0].toUpperCase()}</span>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Твой никнейм</label>
                        <input
                            style={inputStyle}
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Ссылка на фото (URL)</label>
                        <input
                            style={inputStyle}
                            placeholder="https://images.com/my-photo.jpg"
                            value={formData.photo || ''}
                            onChange={e => setFormData({ ...formData, photo: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button onClick={handleSave} style={{ ...btnStyle, background: '#fff', color: '#000' }}>Сохранить</button>
                        <button onClick={() => setIsEditing(false)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Отмена</button>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    {/* ИСПРАВЛЕНО: fontStyle вместо italic */}
                    <p style={{ fontSize: '32px', fontWeight: '900', marginBottom: '10px', fontStyle: 'italic' }}>
                        {user.username}
                    </p>

                    <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '20px',
                        textAlign: 'left',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Hush Private Key</p>
                        <code style={{ wordBreak: 'break-all', color: '#22d3ee', fontSize: '11px', fontFamily: 'monospace' }}>{user.encryptionKey}</code>
                    </div>

                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            marginTop: '30px',
                            background: 'none',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '12px',
                            width: '100%',
                            borderRadius: '15px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase'
                        }}
                    >
                        Изменить настройки
                    </button>
                </div>
            )}
        </div>
    );
};

// Исправленные стили с явным указанием типов для TS
const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
};

const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginLeft: '10px'
};

const inputStyle: React.CSSProperties = {
    padding: '15px',
    borderRadius: '15px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white',
    outline: 'none'
};

const btnStyle: React.CSSProperties = {
    flex: 1,
    padding: '15px',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    fontWeight: 'bold'
};