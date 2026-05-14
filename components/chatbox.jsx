"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ChatBox() {
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([
        { role: "bot", content: "Xin chào! Tôi có thể giúp gì cho bạn?" }
    ]);
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat]);

    const sendMessage = async () => {
        if (!message.trim()) return;

        const userMsg = { role: "user", content: message };
        setChat(prev => [...prev, userMsg]);
        setMessage("");
        setIsTyping(true);

        try {
            const userId = user?.id || "guest";
            console.log(userId, message);
            const res = await fetch("http://localhost:8000/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message,
                    session_id: userId // 🔥 dùng supabase user id
                })
            });

            const dataRes = await res.json();

            const botMsg = {
                role: "bot",
                content: dataRes.reply || "Xin lỗi, tôi gặp sự cố kỹ thuật."
            };

            setChat(prev => [...prev, botMsg]);
        } catch (error) {
            setChat(prev => [...prev, {
                role: "bot",
                content: "Không thể kết nối với server chatbot."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="chatbot-container">
            {/* 🔥 TOGGLE BUTTON */}
            <button
                className={`chatbot-toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? "✕" : "💬"}
            </button>

            {/* 🔥 CHAT WINDOW */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-status-dot"></div>
                        <h3>Hỗ trợ trực tuyến</h3>
                    </div>

                    <div className="chatbot-messages">
                        {chat.map((msg, i) => (
                            <div key={i} className={`chat-bubble ${msg.role}`}>
                                <div className="bubble-content">{msg.content}</div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="chat-bubble bot typing">
                                <div className="bubble-content">...</div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="chatbot-input">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Nhập tin nhắn..."
                        />
                        <button onClick={sendMessage}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
}