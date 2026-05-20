import React, { useState, useEffect, useRef } from 'react';
import './FicheReview.css';

const FicheReview = () => {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [isNewChat, setIsNewChat] = useState(false); // Nouvelle discussion

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [conversation]);

  const handleSubmit = async (e, reset = false) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input, time: new Date().toLocaleTimeString() };
    setConversation((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/repondre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, reset }), // ➕ reset flag
      });

     const data = await response.json();
const botResponse = data.answer || data.message || 'Une erreur est survenue.';

const botMessage = {
  sender: 'assistant',
  text: botResponse,
  time: new Date().toLocaleTimeString(),
  pdfUrl: data.pdfUrl || null  // ✅ On ajoute le lien PDF s'il existe
};

setConversation((prev) => [...prev, botMessage]);

    } catch (err) {
      setConversation((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Erreur de connexion au serveur.',
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
      setIsNewChat(false); // Une fois envoyé, on repasse à faux
    }
  };

  const handleResetConversation = () => {
    setConversation([]);
    setIsNewChat(true);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        🤖 Assistant RH intelligent
        <button className="reset-btn" onClick={handleResetConversation}>
          Nouvelle conversation
        </button>
      </div>

      <div className="chat-box">
      {conversation.map((msg, index) => (
  <div key={index} className={`chat-message ${msg.sender}`}>
    <div className="message-text">
      {msg.text}
      <div className="timestamp">{msg.time}</div>

      {msg.pdfUrl && (
        <div className="download-link">
          📄 <a href={`http://localhost:5000${msg.pdfUrl}`} target="_blank" rel="noopener noreferrer">
            Télécharger la fiche RH
          </a>
        </div>
      )}
    </div>
  </div>
))}
        {loading && (
          <div className="chat-message assistant">
            <div className="message-text typing">L'assistant écrit...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => handleSubmit(e, isNewChat)} // ➕ passer isNewChat à true une seule fois
      >
        <input
          type="text"
          placeholder="Posez une question RH (ex : quelles sont les formations suivies par Amel ?)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>Envoyer</button>
      </form>
    </div>
  );
};

export default FicheReview;
