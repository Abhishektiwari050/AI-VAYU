import React, { useState } from 'react';
import { MessageSquare, Send, CheckCheck, Smartphone, Zap, Sparkles, Copy, Check } from 'lucide-react';
import { processMessagingBotRequest } from '../../app/api/bot/webhook/route';

export const WhatsAppBotSimulator: React.FC = () => {
  const [inputText, setInputText] = useState('VIDP');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'USER' | 'BOT'; text: string; time: string }>>([
    {
      sender: 'BOT',
      text: '✈ VAYU AUTOMATED BOT ONLINE (+1 800-VAYU-BOT)\nText any 3 or 4-letter ICAO airport code (e.g. "VIDP", "KJFK", "VABB") for instant 3-second plain-English NOTAM & weather cards!',
      time: '12:00 PM',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim().toUpperCase();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { sender: 'USER', text: userMsg, time: nowTime }]);
    setInputText('');
    setIsTyping(true);

    try {
      const botRes = await processMessagingBotRequest({
        fromNumberOrId: '+19876543210',
        messageText: userMsg,
        channel: 'WHATSAPP',
      });

      setChatMessages((prev) => [
        ...prev,
        { sender: 'BOT', text: botRes.replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'BOT', text: '✈ VAYU BOT: System temporarily offline. Retry with a valid ICAO code.', time: nowTime },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full cirrus-card p-5 sm:p-6 mb-6 font-sans border border-[#e3e8ee] shadow-md transition-all">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#e3e8ee]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0e1116] flex items-center gap-2">
              <span>WHATSAPP & TELEGRAM AUTOMATED BRIEFING BOT</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                API LIVE
              </span>
            </h3>
            <p className="text-xs text-[#5b6472]">
              Instant low-bandwidth tarmac briefing engine. Send any ICAO code to receive a 3-second plain-English summary card.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText('+1 (800) VAYU-BOT');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-3 py-1.5 rounded-full bg-white border border-[#e3e8ee] hover:bg-slate-50 text-xs font-mono text-[#0e1116] flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5b6472]" />}
            <span>+1 (800) VAYU-BOT</span>
          </button>
        </div>
      </div>

      {/* WHATSAPP INTERACTIVE SIMULATOR FRAME */}
      <div className="max-w-xl mx-auto rounded-3xl border border-[#e3e8ee] bg-[#f0f2f5] overflow-hidden shadow-lg font-sans">
        {/* Chat Top Bar */}
        <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-white font-mono">
            🛩
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">VAYU Pilot Briefing Bot</div>
            <div className="text-[10px] opacity-80">Official DGCA & FAA Verified Bot</div>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="p-4 h-[280px] overflow-y-auto space-y-3 font-sans text-xs">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl shadow-sm whitespace-pre-wrap ${
                  msg.sender === 'USER'
                    ? 'bg-[#dcf8c6] text-[#0e1116] rounded-tr-none'
                    : 'bg-white text-[#0e1116] rounded-tl-none border border-[#e3e8ee]'
                }`}
              >
                <div className="leading-relaxed font-mono">{msg.text}</div>
                <div className="text-[9px] text-[#5b6472] text-right mt-1 flex items-center justify-end gap-1">
                  <span>{msg.time}</span>
                  {msg.sender === 'USER' && <CheckCheck className="w-3 h-3 text-sky-600" />}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-[#e3e8ee] text-xs text-[#5b6472] animate-pulse">
                VAYU Bot is compiling plain-English NOTAMs...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-[#e3e8ee] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value.toUpperCase())}
            placeholder="Type ICAO code (e.g. VIDP, VABB, KJFK)..."
            className="flex-1 px-4 py-2 rounded-full border border-[#e3e8ee] text-xs font-mono text-[#0e1116] focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-full bg-[#075e54] text-white hover:bg-[#064e46] transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
