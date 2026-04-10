import React, { useState } from 'react';
import { X, Mail, MessageSquare, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils';
import { shareService, SharePayload } from '../services/shareServices';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    id: string;
    number: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
  };
  onPreparePdf: () => Promise<{ base64: string; fileName: string }>;
}

export function ShareModal({ isOpen, onClose, invoiceData, onPreparePdf }: ShareModalProps) {
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state with props when modal opens or data changes
  React.useEffect(() => {
    if (isOpen) {
      setRecipient(channel === 'email' ? (invoiceData.customerEmail || '') : (invoiceData.customerPhone || ''));
      setMessage(`Sehr geehrte(r) ${invoiceData.customerName},\n\nanbei erhalten Sie Ihre Rechnung ${invoiceData.number}.\n\nMit freundlichen Grüßen\nIhr Reisebüro`);
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, channel, invoiceData.customerEmail, invoiceData.customerPhone, invoiceData.customerName, invoiceData.number]);

  if (!isOpen) return null;

  const handleSend = async () => {
    setIsSending(true);
    setIsPreparing(true);
    setStatus('idle');
    
    try {
      // 1. Prepare PDF lazily
      const fileData = await onPreparePdf();
      setIsPreparing(false);

      // 2. Send to API
      const payload: SharePayload = {
        channel,
        invoiceId: invoiceData.id,
        invoiceNumber: invoiceData.number,
        customerName: invoiceData.customerName,
        customerEmail: channel === 'email' ? recipient : invoiceData.customerEmail,
        customerPhone: channel === 'whatsapp' ? recipient : invoiceData.customerPhone,
        message,
        fileName: fileData.fileName,
        fileBase64: fileData.base64,
      };

      await shareService.sendInvoice(payload);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 2000);
    } catch (error: any) {
      setIsPreparing(false);
      setStatus('error');
      setErrorMessage(error.message || 'Ein Fehler ist beim Senden aufgetreten.');
    } finally {
      setIsSending(false);
    }
  };

  const handleChannelChange = (newChannel: 'email' | 'whatsapp') => {
    setChannel(newChannel);
    setRecipient(newChannel === 'email' ? (invoiceData.customerEmail || '') : (invoiceData.customerPhone || ''));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Rechnung teilen</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Erfolgreich gesendet!</h4>
                <p className="text-sm text-zinc-500">Die Rechnung wurde erfolgreich übermittelt.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Channel Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleChannelChange('email')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    channel === 'email' 
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600" 
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  <Mail size={24} />
                  <span className="font-bold text-xs">E-Mail</span>
                </button>
                <button
                  onClick={() => handleChannelChange('whatsapp')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    channel === 'whatsapp' 
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600" 
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  <MessageSquare size={24} />
                  <span className="font-bold text-xs">WhatsApp</span>
                </button>
              </div>

              {/* Recipient Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {channel === 'email' ? 'Empfänger E-Mail' : 'Empfänger Telefon'}
                </label>
                <input
                  type={channel === 'email' ? 'email' : 'tel'}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={channel === 'email' ? 'max@mustermann.de' : '+49 123 456789'}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nachricht</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm resize-none"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-xl text-xs border border-red-100 dark:border-red-900/20">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || !recipient}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      <span>{isPreparing ? 'PDF wird erstellt...' : 'Wird gesendet...'}</span>
                    </div>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Senden</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
