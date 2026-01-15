import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatbotPage.css';
import MarkdownTypewriter from 'markdown-typewriter-react';
import remarkGfm from 'remark-gfm';

export default function ChatbotPage({ postsData, averages }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchChats(); }, []);

  const fetchChats = async () => {
    const res = await fetch('http://localhost:5000/api/chats');
    const data = await res.json();
    setChats(data);
  };

  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!input.trim()) return;

    // Use 'content' to match the Backend schema
    const userMessage = { role: 'user', content: input };
    
    setInput(""); 
    setActiveChat(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), userMessage]
    }));
    setLoading(true);
    setIsStreaming(false);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeChat?._id, query: userMessage.content }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      setActiveChat(data);
      setIsStreaming(true); 
      fetchChats(); 
    } catch (err) {
      console.error("Chat failed", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    await fetch(`http://localhost:5000/api/chats/${id}`, { method: 'DELETE' });
    if (activeChat?._id === id) setActiveChat(null);
    fetchChats();
  };

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="chat-page-container">
      {/* SIDEBAR */}
      <aside className="chat-sidebar">
        <button className="new-chat-btn" onClick={() => setActiveChat(null)}>+ New Chat</button>
        <div className="search-box">
          <input placeholder="Search chats..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="chat-history">
          {filteredChats.map(chat => (
            <div 
              key={chat._id} 
              className={`history-item ${activeChat?._id === chat._id ? 'active' : ''}`} 
              onClick={() => {
                  setActiveChat(chat);
                  setIsStreaming(false); 
              }}
            >               
              <span>{chat.title}</span>
              <button className="delete-btn" onClick={(e) => deleteChat(chat._id, e)}>🗑️</button>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CHAT WINDOW */}
      <main className="chat-main">
        <div className="messages-container">
          {!activeChat && <div className="welcome-screen">✨ How can I optimize your strategy today?</div>}
          
          {activeChat?.messages?.map((m, i) => {
  const isAi = m.role === 'assistant';
  const isLastMessage = i === activeChat.messages.length - 1;
  
  // SAFE GUARD: Ensure content is a string and not null/undefined
  const safeContent = String(m.content || m.text || ""); 

  return (
    <div key={i} className={`message-wrapper ${m.role}`}>
      <div className="message-bubble">
        {isAi ? (
          (isLastMessage && isStreaming) ? (
            <MarkdownTypewriter 
              markdown={safeContent} // Always a string now
              delay={5} 
              remarkPlugins={[remarkGfm]} 
            />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {safeContent}
            </ReactMarkdown>
          )
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {safeContent}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
})}


          {loading && <div className="message-wrapper assistant"><div className="message-bubble">Typing...</div></div>}
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(e); }}
              placeholder="Ask Oracle"
            />
            <button onClick={handleSend} disabled={loading}>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}