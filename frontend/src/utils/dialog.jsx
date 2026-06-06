import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// SVG Icons helper
const Icon = ({ type, className = "w-12 h-12" }) => {
  switch (type) {
    case 'success':
      return (
        <svg className={`${className} text-emerald-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'error':
      return (
        <svg className={`${className} text-rose-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={`${className} text-amber-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'confirm':
    case 'question':
      return (
        <svg className={`${className} text-indigo-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className={`${className} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// Custom Modal Component
const ModalContainer = ({ title, message, type, confirmText = "OK", cancelText = "Batal", isConfirm = false, onResolve }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = (value) => {
    setIsOpen(false);
    setTimeout(() => {
      onResolve(value);
    }, 200); // Wait for transition
  };

  return (
    <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      {/* Glassmorphic Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
        onClick={() => !isConfirm && handleClose(true)}
      />
      
      {/* Modal Card */}
      <div className={`relative bg-white/90 dark:bg-slate-900/90 border border-white/20 rounded-2xl p-6 shadow-2xl max-w-sm w-full backdrop-blur-xl transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 animate-bounce">
            <Icon type={type} />
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
            {title || (type === 'success' ? 'Sukses' : type === 'error' ? 'Kesalahan' : 'Informasi')}
          </h3>
          
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium whitespace-pre-line">
            {message}
          </p>
          
          <div className="flex gap-3 w-full justify-center">
            {isConfirm && (
              <button
                onClick={() => handleClose(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all active:scale-[0.98]"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => handleClose(true)}
              className={`px-6 py-2.5 text-white text-xs font-semibold rounded-xl transition-all active:scale-[0.98] ${
                isConfirm ? 'flex-1' : 'w-32'
              } ${
                type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100' :
                type === 'error' ? 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-100' :
                type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-100' :
                'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Container & Store
let toastRoot = null;
let toastContainerEl = null;

const ToastList = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleAdd = (e) => {
      const newToast = e.detail;
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration || 3000);
    };

    window.addEventListener('pbj-add-toast', handleAdd);
    return () => window.removeEventListener('pbj-add-toast', handleAdd);
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[999999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex items-center gap-3 animate-slide-in-right transition-all duration-300"
          style={{
            animation: 'pbj-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <div className="shrink-0">
            <Icon type={t.type} className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{t.message}</p>
          </div>
          <button 
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="text-slate-400 hover:text-slate-600 text-xs shrink-0 font-bold ml-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

// Inject custom Toast animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pbj-slide-in {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// Dialog API Object
export const dialog = {
  alert(message, title = 'Pemberitahuan', type = 'info') {
    return new Promise((resolve) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      
      const onResolve = (val) => {
        root.unmount();
        document.body.removeChild(container);
        resolve(val);
      };

      root.render(
        <ModalContainer 
          title={title} 
          message={message} 
          type={type} 
          onResolve={onResolve} 
        />
      );
    });
  },

  success(message, title = 'Sukses') {
    return this.alert(message, title, 'success');
  },

  error(message, title = 'Kesalahan') {
    return this.alert(message, title, 'error');
  },

  warning(message, title = 'Peringatan') {
    return this.alert(message, title, 'warning');
  },

  confirm(message, title = 'Konfirmasi', type = 'question') {
    return new Promise((resolve) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      const onResolve = (val) => {
        root.unmount();
        document.body.removeChild(container);
        resolve(val);
      };

      root.render(
        <ModalContainer 
          title={title} 
          message={message} 
          type={type} 
          isConfirm={true} 
          onResolve={onResolve} 
        />
      );
    });
  },

  toast(message, type = 'success', duration = 3000) {
    if (typeof window === 'undefined') return;
    
    // Lazy mount Toast Container
    if (!toastContainerEl) {
      toastContainerEl = document.createElement('div');
      toastContainerEl.id = 'pbj-toast-root';
      document.body.appendChild(toastContainerEl);
      toastRoot = createRoot(toastContainerEl);
      toastRoot.render(<ToastList />);
    }

    const event = new CustomEvent('pbj-add-toast', {
      detail: {
        id: Math.random().toString(36).substring(2, 9),
        message,
        type,
        duration
      }
    });
    window.dispatchEvent(event);
  }
};

export default dialog;
