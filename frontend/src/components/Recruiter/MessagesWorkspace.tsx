import React, { useState } from 'react';
import { Send, Phone, Video, MoreVertical } from 'lucide-react';

const MessagesWorkspace: React.FC = () => {
    const [selectedChat, setSelectedChat] = useState<number | null>(1);
    const [messageInput, setMessageInput] = useState('');

    const chats = [
        { id: 1, name: 'Alice Walker', role: 'Frontend Architect', avatar: 'A', unread: 2, online: true },
        { id: 2, name: 'John Doe', role: 'UI Engineer', avatar: 'J', unread: 0, online: false },
        { id: 3, name: 'Sarah Connor', role: 'Full Stack Dev', avatar: 'S', unread: 0, online: true }
    ];

    const [currentMessages, setCurrentMessages] = useState([
        { id: 101, sender: 'Alice Walker', text: 'Hi! I saw you shortlisted me for the Frontend Architect role. I would love to learn more.', time: '10:30 AM', isMine: false },
        { id: 102, sender: 'You', text: 'Hello Alice! Yes, your profile looks fantastic. Are you available for a quick chat tomorrow?', time: '10:45 AM', isMine: true },
        { id: 103, sender: 'Alice Walker', text: 'Absolutely. Does 2 PM PST work for you?', time: '11:00 AM', isMine: false }
    ]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        const newMessage = {
            id: Date.now(),
            sender: 'You',
            text: messageInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMine: true
        };

        setCurrentMessages([...currentMessages, newMessage]);
        setMessageInput('');
    };

    return (
        <div className="workspace-split-layout">
            {/* Left Pane: Inbox */}
            <div className="workspace-list-pane">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Messages</h2>
                </div>
                <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat.id)}
                            style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                background: selectedChat === chat.id ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                borderLeft: selectedChat === chat.id ? '3px solid var(--primary-color)' : '3px solid transparent'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #ec4899)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                                    {chat.avatar}
                                </div>
                                {chat.online && <div style={{ position: 'absolute', bottom: 2, right: 2, width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', border: '2px solid var(--bg-card)' }}></div>}
                            </div>
                            <div style={{ flexGrow: 1 }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                    {chat.name}
                                    {chat.unread > 0 && <span style={{ background: 'var(--primary-color)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem' }}>{chat.unread}</span>}
                                </h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {chat.role}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Pane: Chat Window */}
            <div className="workspace-detail-pane" style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #ec4899)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                                    {chats.find(c => c.id === selectedChat)?.avatar}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{chats.find(c => c.id === selectedChat)?.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Available</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)' }}>
                                <Phone size={20} style={{ cursor: 'pointer' }} />
                                <Video size={20} style={{ cursor: 'pointer' }} />
                                <MoreVertical size={20} style={{ cursor: 'pointer' }} />
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div style={{ flexGrow: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {currentMessages.map(msg => (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMine ? 'flex-end' : 'flex-start' }}>
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        borderBottomRightRadius: msg.isMine ? '4px' : '16px',
                                        borderBottomLeftRadius: !msg.isMine ? '4px' : '16px',
                                        background: msg.isMine ? 'var(--primary-color)' : 'var(--bg-card)',
                                        color: msg.isMine ? 'white' : 'var(--text-primary)',
                                        border: msg.isMine ? 'none' : '1px solid var(--border)',
                                        lineHeight: 1.4
                                    }}>
                                        {msg.text}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{msg.time}</span>
                                </div>
                            ))}
                        </div>

                        {/* Fixed Send Bar */}
                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message..."
                                    style={{ flexGrow: 1, padding: '12px 20px', borderRadius: '30px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '1rem' }}
                                />
                                <button type="submit" disabled={!messageInput.trim()} style={{ padding: '12px 24px', borderRadius: '30px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', opacity: messageInput.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                    <Send size={18} /> Send
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Select a conversation to start chatting.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesWorkspace;
