import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, X, Send, Bot, User, Phone, MessageCircle,
  HelpCircle, ExternalLink, Sparkles, CheckCircle2, ChevronDown,
  Clock, Shield, ArrowUpRight
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api';

interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
}

export default function LiveChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Settings from admin or default
  const [config, setConfig] = useState({
    enabled: true,
    title: 'Infiniforge Live Support',
    subtitle: 'Typically replies in under 5 minutes',
    greeting: 'Hello! 👋 How can our cloud architecture team assist you today?',
    primaryColor: '#6366f1',
    position: 'bottom_right',
    whatsappNumber: '+919876543210',
    agentName: 'Alex (Cloud Specialist)',
    agentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    supportHours: '24/7 Mon - Sun',
    slaHours: '2 Hours',
  });

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load live settings from platform
  useEffect(() => {
    let isMounted = true;
    adminApi.settings().then(res => {
      if (isMounted && res.data?.data) {
        const d = res.data.data;
        setConfig(prev => ({
          ...prev,
          enabled: d.enable_chat_widget !== false,
          title: d.chat_widget_title || prev.title,
          subtitle: d.chat_widget_subtitle || prev.subtitle,
          greeting: d.chat_widget_greeting || prev.greeting,
          primaryColor: d.chat_widget_primary_color || prev.primaryColor,
          position: d.chat_widget_position || prev.position,
          whatsappNumber: d.chat_widget_whatsapp_number || prev.whatsappNumber,
          agentName: d.chat_widget_agent_name || prev.agentName,
          agentAvatar: d.chat_widget_agent_avatar || prev.agentAvatar,
          supportHours: d.support_hours || prev.supportHours,
          slaHours: d.support_sla_hours || prev.slaHours,
        }));
      }
    }).catch(() => {
      // Graceful fallback to default config
    });
    return () => { isMounted = false; };
  }, []);

  // Initialize initial greeting once opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([
        {
          id: 'welcome-1',
          sender: 'agent',
          text: config.greeting,
          timestamp: now,
        },
      ]);
    }
  }, [isOpen, config.greeting, messages.length]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  if (!config.enabled) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: now,
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Dynamic automated AI assistant reply
    setTimeout(() => {
      setIsTyping(false);
      const lower = userText.toLowerCase();
      let reply = "Thank you for reaching out! A cloud engineer has received your message and is reviewing your inquiry. Feel free to connect directly on WhatsApp for expedited support.";

      if (lower.includes('price') || lower.includes('cost') || lower.includes('plan') || lower.includes('quote')) {
        reply = "Our pricing is structured with transparent wholesale and retail tiers in ₹ INR! You can check our live catalog in the Marketplace or contact us on WhatsApp for high-volume custom quotes.";
      } else if (lower.includes('license') || lower.includes('software') || lower.includes('key')) {
        reply = "Software license keys are generated instantly upon order confirmation. You can access your activation keys, portal login, and downloads directly in your dashboard.";
      } else if (lower.includes('reseller') || lower.includes('margin') || lower.includes('wholesale')) {
        reply = "Resellers enjoy discounted wholesale rates (15-30% margin), wallet auto-debits, white-label storefronts, and multi-tenant customer management. Register your reseller account anytime!";
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const whatsappClean = config.whatsappNumber.replace(/[^0-9]/g, '');
  const isLeft = config.position === 'bottom_left';

  return (
    <div className={`fixed bottom-6 ${isLeft ? 'left-6' : 'right-6'} z-50 font-sans select-none print:hidden`}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-2xl shadow-indigo-600/40 hover:scale-105 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
          aria-label="Open Live Chat"
        >
          {/* Pulsing online ring */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
          </span>

          <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />

          {/* Hover Tooltip */}
          <div className={`absolute ${isLeft ? 'left-16' : 'right-16'} bottom-2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
            Need Help? Chat with us live! 👋
          </div>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="relative w-80 sm:w-96 h-[530px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-900/90 via-slate-900 to-violet-950 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={config.agentAvatar}
                  alt={config.agentName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  {config.title}
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {config.subtitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Badges */}
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
            {whatsappClean && (
              <a
                href={`https://wa.me/${whatsappClean}?text=Hello%20Infiniforge%20Support,%20I%20need%20assistance.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap transition-colors shrink-0"
              >
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 whitespace-nowrap shrink-0">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>SLA: {config.slaHours}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 whitespace-nowrap shrink-0">
              <Shield className="w-3 h-3 text-slate-400" />
              <span>{config.supportHours}</span>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/30">
            {messages.map((msg) => {
              const isAgent = msg.sender === 'agent';
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isAgent ? 'justify-start' : 'justify-end'}`}
                >
                  {isAgent && (
                    <img
                      src={config.agentAvatar}
                      alt="Agent"
                      className="w-6 h-6 rounded-full object-cover shrink-0 mb-1"
                    />
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                      isAgent
                        ? 'bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/60'
                        : 'bg-indigo-600 text-white rounded-br-xs'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className={`text-[9px] mt-1 text-right ${isAgent ? 'text-slate-400' : 'text-indigo-200'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <img
                  src={config.agentAvatar}
                  alt="Agent"
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
                <div className="px-3.5 py-2 rounded-2xl bg-slate-800 border border-slate-700/60 rounded-bl-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ / WhatsApp CTA footer */}
          <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-[10px] text-slate-500">Live Agent Standby</span>
            {whatsappClean && (
              <a
                href={`https://wa.me/${whatsappClean}?text=Hello%20Infiniforge%20Support`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 text-[10px]"
              >
                Direct WhatsApp <ArrowUpRight className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything or request support..."
              className="flex-1 bg-slate-900 text-white placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
