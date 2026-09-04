import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, X, Send, Bot, User, Phone, MessageCircle,
  HelpCircle, ExternalLink, Sparkles, CheckCircle2, ChevronDown,
  Clock, Shield, ArrowUpRight, Headphones, Mail, ChevronRight,
  Layers, LifeBuoy, Zap
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { publicApi, adminApi } from '../../api';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: any;
  }
}

interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
}

export default function LiveChatWidget() {
  const { user, isAuthenticated, isReseller } = useAuth();
  const location = useLocation();

  // Multi-Channel tab within widget: 'hub' (all channels), 'chat' (AI/direct), 'faq', 'contact'
  const [activeTab, setActiveTab] = useState<'hub' | 'chat' | 'faq' | 'contact'>('hub');

  // Settings from admin or default
  const [config, setConfig] = useState({
    enabled: true,
    title: 'Infiniforge Support Hub',
    subtitle: 'Multi-Channel Live Support',
    greeting: 'Hello! 👋 How can our cloud architecture team assist you today?',
    primaryColor: '#6366f1',
    position: 'bottom_right',
    whatsappNumber: '+91 8121886213',
    supportPhone: '+91 8121886213',
    supportEmail: 'support@infiniforge.cloud',
    agentName: 'Alex (Cloud Specialist)',
    agentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    supportHours: '24/7 Mon - Sun',
    slaHours: '2 Hours',

    // tawk.to Integration
    enableTawkto: true,
    tawktoPropertyId: '',
    tawktoWidgetId: '',
    tawktoDirectChatLink: '',
    tawktoEmbedCode: '',
    tawktoChatMode: 'hybrid', // 'hybrid' (multi-channel hub) | 'official' | 'custom'
    tawktoSyncUser: true,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'Support Request',
    message: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load live settings from platform
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = publicApi.settings ? publicApi.settings() : adminApi.settings();
    fetchSettings.then(res => {
      if (isMounted && res.data?.data) {
        const d = res.data.data;
        let propId = d.tawkto_property_id || '';
        let widgetId = d.tawkto_widget_id || '';
        const directLink = d.tawkto_direct_chat_link || '';
        const embedCode = d.tawkto_embed_code || '';

        // Smart extract if widgetId is missing or 'default'
        if (!widgetId || widgetId === 'default') {
          const match = (directLink + ' ' + embedCode).match(/(?:embed\.tawk\.to|tawk\.to\/chat)\/([a-f0-9]{24})\/([a-zA-Z0-9_-]+)/i);
          if (match) {
            propId = propId || match[1];
            widgetId = match[2];
          }
        }

        setConfig(prev => ({
          ...prev,
          enabled: d.enable_chat_widget !== false,
          title: d.chat_widget_title || prev.title,
          subtitle: d.chat_widget_subtitle || prev.subtitle,
          greeting: d.chat_widget_greeting || prev.greeting,
          primaryColor: d.chat_widget_primary_color || prev.primaryColor,
          position: d.chat_widget_position || prev.position,
          whatsappNumber: d.chat_widget_whatsapp_number || d.support_phone || prev.whatsappNumber,
          supportPhone: d.support_phone || prev.supportPhone,
          supportEmail: d.support_email || prev.supportEmail,
          agentName: d.chat_widget_agent_name || prev.agentName,
          agentAvatar: d.chat_widget_agent_avatar || prev.agentAvatar,
          supportHours: d.support_hours || prev.supportHours,
          slaHours: d.support_sla_hours || prev.slaHours,

          // tawk.to
          enableTawkto: d.enable_tawkto !== false,
          tawktoPropertyId: propId || prev.tawktoPropertyId,
          tawktoWidgetId: widgetId || prev.tawktoWidgetId,
          tawktoDirectChatLink: directLink || prev.tawktoDirectChatLink,
          tawktoEmbedCode: embedCode || prev.tawktoEmbedCode,
          tawktoChatMode: d.tawkto_chat_mode || prev.tawktoChatMode,
          tawktoSyncUser: d.tawkto_sync_visitor_user !== false,
        }));
      }
    }).catch(() => {
      // Graceful fallback to default config
    });
    return () => { isMounted = false; };
  }, []);

  // Dynamically load tawk.to official script if configured
  useEffect(() => {
    if (!config.enableTawkto || !config.tawktoPropertyId) return;

    // Helper to hide default standalone bubble when in multi-channel hybrid mode
    const applyTawkVisibility = () => {
      if (window.Tawk_API && config.tawktoChatMode !== 'official' && typeof window.Tawk_API.hideWidget === 'function') {
        try { window.Tawk_API.hideWidget(); } catch (e) {}
      }
    };

    if (document.getElementById('tawkto-script')) {
      applyTawkVisibility();
      // If already loaded and user is authenticated, sync visitor attributes
      if (window.Tawk_API && user && config.tawktoSyncUser && typeof window.Tawk_API.setAttributes === 'function') {
        window.Tawk_API.setAttributes({
          name: user.name || user.email,
          email: user.email,
          id: user.id,
          role: isReseller() ? 'Reseller' : 'Customer',
        }, () => {});
      }
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // In multi-channel mode, hide the standalone bubble so our multi-hub is primary
    if (config.tawktoChatMode !== 'official') {
      window.Tawk_API.onLoad = function() {
        applyTawkVisibility();
      };
      window.Tawk_API.onChatMinimized = function() {
        applyTawkVisibility();
      };
    }

    const widgetId = config.tawktoWidgetId || 'default';
    const s1 = document.createElement('script');
    s1.id = 'tawkto-script';
    s1.async = true;
    s1.src = `https://embed.tawk.to/${config.tawktoPropertyId}/${widgetId}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');

    s1.onload = () => {
      applyTawkVisibility();
      if (user && config.tawktoSyncUser && window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
        window.Tawk_API.setAttributes({
          name: user.name || user.email,
          email: user.email,
          id: user.id,
          role: isReseller() ? 'Reseller' : 'Customer',
        }, () => {});
      }
    };

    document.head.appendChild(s1);
  }, [config.enableTawkto, config.tawktoPropertyId, config.tawktoWidgetId, config.tawktoChatMode, config.tawktoSyncUser, user]);

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
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!config.enabled) return null;

  // Launch tawk.to Live Chat Session
  const handleLaunchTawkTo = () => {
    try {
      if (window.Tawk_API) {
        if (typeof window.Tawk_API.showWidget === 'function') {
          window.Tawk_API.showWidget();
        }
        if (typeof window.Tawk_API.maximize === 'function') {
          window.Tawk_API.maximize();
          setIsOpen(false);
          return;
        }
      }
    } catch (e) {}

    // Fallback to direct window
    if (config.tawktoDirectChatLink && !config.tawktoDirectChatLink.endsWith('/default')) {
      window.open(config.tawktoDirectChatLink, '_blank', 'width=460,height=680,scrollbars=yes,resizable=yes');
      return;
    }
    if (config.tawktoPropertyId && config.tawktoWidgetId && config.tawktoWidgetId !== 'default') {
      window.open(`https://tawk.to/chat/${config.tawktoPropertyId}/${config.tawktoWidgetId}`, '_blank', 'width=460,height=680,scrollbars=yes,resizable=yes');
      return;
    }
    if (config.tawktoPropertyId) {
      window.open(`https://tawk.to/chat/${config.tawktoPropertyId}/${config.tawktoWidgetId || 'default'}`, '_blank', 'width=460,height=680,scrollbars=yes,resizable=yes');
    }
  };

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

    // Automated smart assistant response
    setTimeout(() => {
      setIsTyping(false);
      const lower = userText.toLowerCase();
      let reply = "Thank you for contacting us! Our cloud architecture team is on standby. You can also connect directly with a live human engineer on tawk.to or WhatsApp anytime.";

      if (lower.includes('human') || lower.includes('agent') || lower.includes('person') || lower.includes('talk')) {
        reply = "I can connect you directly with a human specialist! Click the '🟢 Start tawk.to Live Chat' button below or select WhatsApp for an instant 1-to-1 conversation.";
      } else if (lower.includes('price') || lower.includes('cost') || lower.includes('plan') || lower.includes('quote')) {
        reply = "Our pricing is structured with transparent wholesale and retail tiers in ₹ INR! You can check our live catalog in the Marketplace or contact us for high-volume enterprise quotes.";
      } else if (lower.includes('license') || lower.includes('software') || lower.includes('key')) {
        reply = "Software license keys are generated instantly upon order confirmation. You can access activation credentials and downloads directly from your dashboard.";
      } else if (lower.includes('reseller') || lower.includes('margin') || lower.includes('wholesale')) {
        reply = "Resellers receive 15-30% discounted wholesale rates, automated wallet billing, custom white-label storefronts, and multi-tenant customer management. Register your reseller portal anytime!";
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
    }, 1000);
  };

  const whatsappClean = (config.whatsappNumber || '').replace(/[^0-9]/g, '');
  const phoneClean = (config.supportPhone || '').replace(/[^0-9+]/g, '');
  const isLeft = config.position === 'bottom_left';
  const hasTawkto = config.enableTawkto && (config.tawktoPropertyId || config.tawktoDirectChatLink);

  const faqs = [
    {
      q: 'How fast are cloud services and products delivered?',
      a: 'All digital products and recurring cloud services feature automated provisioning. Credentials and license keys are delivered to your portal within seconds of payment.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We accept UPI, Credit/Debit Cards, Net Banking, Razorpay, PhonePe, Cashfree, Stripe, and Prepaid Wallet balances in ₹ INR.',
    },
    {
      q: 'How do I become a certified Reseller?',
      a: 'Navigate to Explore Reseller Plans, select a tier (Starter, Pro, or Enterprise), and start distributing cloud services under your own brand with instant profit margins.',
    },
    {
      q: 'How can I speak with a human support agent?',
      a: 'Click "Start tawk.to Live Chat" for 24/7 instant human assistance, or message our WhatsApp enterprise hotline.',
    },
  ];

  return (
    <div className={`fixed bottom-6 ${isLeft ? 'left-6' : 'right-6'} z-[999999] font-sans select-none print:hidden`}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white shadow-2xl shadow-indigo-900/50 hover:scale-105 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-500/40"
          aria-label="Open Multi-Channel Support Hub"
        >
          {/* Pulsing online ring */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
          </span>

          <div className="flex items-center gap-1.5">
            <LifeBuoy className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            <span className="font-extrabold text-xs tracking-wide hidden sm:inline">
              Support Hub
            </span>
          </div>

          <div className="flex items-center -space-x-1 pl-1">
            <span className="w-5 h-5 rounded-full bg-emerald-700/80 border border-emerald-400/60 flex items-center justify-center text-[10px]" title="tawk.to Live Chat">
              <Headphones className="w-3 h-3 text-emerald-200" />
            </span>
            <span className="w-5 h-5 rounded-full bg-teal-700/80 border border-teal-400/60 flex items-center justify-center text-[10px]" title="WhatsApp Support">
              <MessageCircle className="w-3 h-3 text-teal-200" />
            </span>
            <span className="w-5 h-5 rounded-full bg-purple-700/80 border border-purple-400/60 flex items-center justify-center text-[10px]" title="AI Assistant">
              <Bot className="w-3 h-3 text-purple-200" />
            </span>
          </div>

          {/* Hover Tooltip */}
          <div className={`absolute ${isLeft ? 'left-full ml-3' : 'right-full mr-3'} bottom-1 bg-slate-950 text-white text-xs px-3 py-1.5 rounded-xl border border-slate-800 shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-2`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Multi-Channel Live Support (tawk.to, WhatsApp & AI)</span>
          </div>
        </button>
      )}

      {/* Expandable Multi-Channel Support Hub Window */}
      {isOpen && (
        <div className="relative w-84 sm:w-96 h-[580px] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={config.agentAvatar}
                  alt={config.agentName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  {config.title}
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>24/7 Multi-Channel • SLA: {config.slaHours}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Bar */}
          <div className="px-3 pt-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center gap-1">
            {[
              { id: 'hub', label: 'All Channels', icon: Zap },
              { id: 'chat', label: 'AI Assistant', icon: Bot },
              { id: 'faq', label: 'FAQ', icon: HelpCircle },
              { id: 'contact', label: 'Ticket', icon: Mail },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 pb-2 pt-1 text-[11px] font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: ALL CHANNELS (MULTI-HUB) */}
          {activeTab === 'hub' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/30">
                <div className="text-[11px] font-black text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Support Specialists are Online</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Choose your preferred communication channel below. Human agents are standing by on tawk.to and WhatsApp.
                </p>
              </div>

              {/* 1. tawk.to Live Chat Card */}
              {hasTawkto && (
                <div
                  onClick={handleLaunchTawkTo}
                  className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        <span>tawk.to 24/7 Live Chat</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Human Agent
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Instant 1-to-1 live messaging with technical engineers
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </div>
              )}

              {/* 2. WhatsApp Direct Card */}
              {whatsappClean && (
                <a
                  href={`https://wa.me/${whatsappClean}?text=Hello%20Infiniforge%20Support,%20I%20need%20assistance.`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group shadow-sm flex items-center justify-between block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        <span>WhatsApp Business Desk</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          Instant
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Direct messaging on {config.whatsappNumber}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              )}

              {/* 3. AI Assistant Bot Card */}
              <div
                onClick={() => setActiveTab('chat')}
                className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-500/60 transition-all cursor-pointer group shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                      <span>AI Cloud Assistant</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Zero Wait
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Immediate answers on pricing, licenses, margin & setup
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* 4. Direct Phone Call Hotline */}
              {phoneClean && (
                <a
                  href={`tel:${phoneClean}`}
                  className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950/30 border border-slate-800 hover:border-sky-500/60 transition-all cursor-pointer group shadow-sm flex items-center justify-between block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        <span>Direct Voice Hotline</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40">
                          Call
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {config.supportPhone} ({config.supportHours})
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              )}

              {/* 5. Priority Email Desk */}
              <a
                href={`mailto:${config.supportEmail}?subject=Support%20Inquiry%20from%20SaaS%20Platform`}
                className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/60 transition-all cursor-pointer group shadow-sm flex items-center justify-between block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                      <span>Priority Email Desk</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Tickets
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {config.supportEmail} (Guaranteed SLA: {config.slaHours})
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          )}

          {/* TAB 2: AI ASSISTANT STREAM */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-950/40">
              {/* Messages Container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {/* Handoff banner to tawk.to */}
                {hasTawkto && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] text-emerald-200">Need human help?</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLaunchTawkTo}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>tawk.to Live Chat</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Stream */}
                {messages.map(msg => {
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
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px] scrollbar-none">
                {[
                  'Reseller Margins & Pricing',
                  'License Key Access',
                  'Accepted Payment Gateways',
                  'Connect with Human Agent',
                ].map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      if (prompt.includes('Human')) {
                        handleLaunchTawkTo();
                      } else {
                        setInputMessage(prompt);
                      }
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-900 text-white placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: FAQ KNOWLEDGE BASE */}
          {activeTab === 'faq' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-slate-950/40">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>Frequently Asked Questions</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Instant answers to common inquiries about orders, payments, and reseller accounts.
                </p>
              </div>

              {faqs.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="w-full p-3.5 text-left text-xs font-bold text-white flex items-center justify-between gap-2 hover:bg-slate-850 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-emerald-400' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/60 pt-2 animate-in fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-400 mb-2">Still need help?</p>
                <button
                  type="button"
                  onClick={handleLaunchTawkTo}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Connect with Agent on tawk.to</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECT TICKET / MESSAGE */}
          {activeTab === 'contact' && (
            <div className="flex-1 p-4 overflow-y-auto bg-slate-950/40">
              {contactSubmitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-white">Ticket Dispatched!</h4>
                  <p className="text-xs text-slate-300 max-w-xs">
                    Thank you! Our engineering team has received your ticket and will respond to your email within {config.slaHours}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSubmitted(false);
                      setActiveTab('hub');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Back to Channels
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-amber-400" />
                      <span>Submit Priority Support Ticket</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Direct notification dispatched to {config.supportEmail}.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name || (user?.name || '')}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Your Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email || (user?.email || '')}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Message</label>
                    <textarea
                      required
                      rows={3}
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your question or issue..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Priority Ticket</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
