// styles/chatStyles.ts
import React from 'react';

export const mainLayoutStyle: React.CSSProperties = {
    display: 'flex',
    height: '680px',
    width: '1000px',
    margin: '0 auto',
    background: '#000',
    border: '1px solid #1a1a1a',
    borderRadius: '24px',
    overflow: 'hidden',
    color: '#fff',
    fontFamily: 'Inter, sans-serif'
};

export const sidebarStyle: React.CSSProperties = {
    width: '280px',
    borderRight: '1px solid #1a1a1a',
    display: 'flex',
    flexDirection: 'column'
};

export const profileAreaStyle: React.CSSProperties = {
    padding: '30px 20px',
    borderBottom: '1px solid #1a1a1a',
    textAlign: 'center'
};

export const avatarMainStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: '#111',
    margin: '0 auto',
    border: '2px solid #22d3ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#22d3ee',
    overflow: 'hidden'
};

export const nicknameDisplayStyle: React.CSSProperties = {
    fontSize: '20px',
    color: '#22d3ee',
    fontWeight: '900',
    marginTop: '15px'
};

export const bioDisplayStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#555',
    marginTop: '6px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontWeight: 'bold'
};

export const listHeaderStyle: React.CSSProperties = {
    padding: '15px 20px',
    fontSize: '11px',
    color: '#333',
    fontWeight: 'bold',
    letterSpacing: '2px'
};

export const chatItemStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
    borderBottom: '1px solid #050505',
    background: isActive ? 'rgba(34, 211, 238, 0.15)' : 'transparent'
});

export const avatarMiniStyle: React.CSSProperties = {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: '#111',
    border: '1px solid #222',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#22d3ee'
};

export const chatWindowStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#000'
};

export const searchWrapperStyle: React.CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid #1a1a1a',
    position: 'relative'
};

export const inputRecipientStyle: React.CSSProperties = {
    width: '100%',
    background: '#080808',
    border: '1px solid #1a1a1a',
    padding: '14px 18px',
    borderRadius: '12px',
    color: '#22d3ee',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
};

export const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '70px',
    left: '20px',
    right: '20px',
    background: '#080808',
    border: '1px solid #22d3ee',
    borderRadius: '12px',
    zIndex: 10
};

export const resItemStyle: React.CSSProperties = {
    padding: '15px',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '1px solid #1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
};

export const msgBoxStyle: React.CSSProperties = {
    flex: 1,
    padding: '30px',
    overflowY: 'auto'
};

export const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '200px',
    color: '#1a1a1a',
    fontSize: '16px',
    letterSpacing: '6px',
    fontWeight: '900'
};

export const bubbleStyle = (isMe: boolean): React.CSSProperties => ({
    padding: '14px 20px',
    borderRadius: '16px',
    maxWidth: '350px',
    fontSize: '15px',
    lineHeight: '1.6',
    wordWrap: 'break-word',
    background: isMe ? '#22d3ee' : '#111',
    color: isMe ? '#000' : '#fff',
    fontWeight: isMe ? 'bold' : 'normal'
});

export const avatarStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    overflow: 'hidden',
    flexShrink: 0
};

export const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
};

export const avatarPlaceholderStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111',
    color: '#22d3ee',
    fontWeight: 'bold'
};

export const sendBarStyle: React.CSSProperties = {
    padding: '25px',
    display: 'flex',
    gap: '15px',
    borderTop: '1px solid #1a1a1a'
};

export const msgInputStyle: React.CSSProperties = {
    flex: 1,
    background: '#080808',
    border: '1px solid #1a1a1a',
    padding: '16px 20px',
    borderRadius: '14px',
    color: '#fff',
    outline: 'none',
    fontSize: '15px'
};

export const sendBtnStyle: React.CSSProperties = {
    padding: '0 30px',
    background: '#22d3ee',
    color: '#000',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    fontWeight: '900'
};