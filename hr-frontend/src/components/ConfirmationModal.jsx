import React from 'react';
import { AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'update', // 'create' | 'update' | 'delete' | 'success'
  confirmText,
  cancelText
}) => {
  if (!isOpen) return null;

  const getThemeConfig = () => {
    switch (type) {
      case 'create':
      case 'success':
        return {
          icon: <CheckCircle2 size={28} />,
          iconBg: 'bg-emerald-50 text-emerald-500',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10',
          defaultConfirmText: type === 'success' ? 'OK' : 'Simpan',
          singleBtn: type === 'success' || !onConfirm,
        };
      case 'delete':
        return {
          icon: <AlertTriangle size={28} />,
          iconBg: 'bg-red-50 text-red-500',
          confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-500/10',
          defaultConfirmText: 'Hapus',
          singleBtn: false,
        };
      case 'update':
      default:
        return {
          icon: <HelpCircle size={28} />,
          iconBg: 'bg-orange-50 text-orange-500',
          confirmBtn: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/20',
          defaultConfirmText: 'Ya, Simpan',
          singleBtn: false,
        };
    }
  };

  const theme = getThemeConfig();
  const displayConfirmText = confirmText || theme.defaultConfirmText;
  const displayCancelText = cancelText || 'Batal';
  const isSingleBtn = theme.singleBtn;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 flex flex-col items-center text-center space-y-4 animate-scale-up">
        <div className={`p-3 rounded-full ${theme.iconBg}`}>
          {theme.icon}
        </div>
        
        <div className="space-y-1.5 w-full">
          <h3 className="text-base font-extrabold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-400 font-semibold leading-relaxed px-2 whitespace-pre-line">{message}</p>
        </div>
        
        <div className={isSingleBtn ? "w-full pt-2" : "grid grid-cols-2 gap-2.5 w-full pt-2"}>
          {!isSingleBtn && (
            <button
              type="button"
              onClick={onClose}
              className="bg-red-50/80 hover:bg-red-100 active:scale-95 text-red-600 border border-red-200 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer w-full"
            >
              {displayCancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`text-white font-bold text-xs py-2.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer w-full ${theme.confirmBtn}`}
          >
            {displayConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
