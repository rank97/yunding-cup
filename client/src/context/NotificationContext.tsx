import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  HelpCircle, 
  Trash2, 
  Lock, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
}

interface ConfirmDialogOptions {
  title?: string;
  message: string | ReactNode;
  type?: 'danger' | 'warning' | 'info' | 'purple' | 'success';
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
}

interface AlertDialogOptions {
  title?: string;
  message: string | ReactNode;
  type?: 'error' | 'warning' | 'info' | 'success';
  confirmText?: string;
  icon?: ReactNode;
}

interface NotificationContextType {
  showToast: (message: string, type?: NotificationType, duration?: number) => void;
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  confirmModal: (options: ConfirmDialogOptions | string) => Promise<boolean>;
  alertModal: (options: AlertDialogOptions | string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Confirm Modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  // Alert Modal state
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertDialogOptions;
    resolve: () => void;
  } | null>(null);

  // Toast handler
  const showToast = useCallback((message: string, type: NotificationType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (msg: string, dur = 3000) => showToast(msg, 'success', dur),
    error: (msg: string, dur = 4000) => showToast(msg, 'error', dur),
    warning: (msg: string, dur = 3500) => showToast(msg, 'warning', dur),
    info: (msg: string, dur = 3000) => showToast(msg, 'info', dur),
  };

  // Confirm Modal handler
  const confirmModal = useCallback((opts: ConfirmDialogOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const options: ConfirmDialogOptions = typeof opts === 'string' ? { message: opts } : opts;
      setConfirmState({
        isOpen: true,
        options: {
          title: options.title || '操作确认',
          message: options.message,
          type: options.type || 'purple',
          confirmText: options.confirmText || '确定执行',
          cancelText: options.cancelText || '取消',
          icon: options.icon,
        },
        resolve,
      });
    });
  }, []);

  // Alert Modal handler
  const alertModal = useCallback((opts: AlertDialogOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const options: AlertDialogOptions = typeof opts === 'string' ? { message: opts } : opts;
      setAlertState({
        isOpen: true,
        options: {
          title: options.title || '系统提示',
          message: options.message,
          type: options.type || 'info',
          confirmText: options.confirmText || '我知道了',
          icon: options.icon,
        },
        resolve,
      });
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  const handleAlertClose = () => {
    if (alertState) {
      alertState.resolve();
      setAlertState(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, toast, confirmModal, alertModal }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let bgStyle = 'bg-slate-900/90 border-slate-700/80 text-slate-100';
          let icon = <Info className="w-4 h-4 text-cyan-400 shrink-0" />;

          if (t.type === 'success') {
            bgStyle = 'bg-slate-900/95 border-emerald-500/50 text-emerald-100 shadow-emerald-500/10';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
          } else if (t.type === 'error') {
            bgStyle = 'bg-slate-900/95 border-rose-500/50 text-rose-100 shadow-rose-500/10';
            icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
          } else if (t.type === 'warning') {
            bgStyle = 'bg-slate-900/95 border-amber-500/50 text-amber-100 shadow-amber-500/10';
            icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-2.5 text-xs font-sans animate-in slide-in-from-top-3 fade-in duration-200 ${bgStyle}`}
            >
              {icon}
              <div className="flex-1 font-medium leading-relaxed break-words">{t.message}</div>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Cyber Confirm Modal */}
      {confirmState && confirmState.isOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border-purple-500/40 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  confirmState.options.type === 'danger'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/20'
                    : confirmState.options.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/20'
                    : confirmState.options.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                    : 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/20'
                }`}
              >
                {confirmState.options.icon || (
                  confirmState.options.type === 'danger' ? (
                    <Trash2 className="w-5 h-5" />
                  ) : confirmState.options.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <HelpCircle className="w-5 h-5" />
                  )
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <h3 className="font-extrabold text-base text-slate-100">
                  {confirmState.options.title}
                </h3>
                <div className="text-xs text-slate-300 leading-relaxed">
                  {confirmState.options.message}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="btn-secondary px-4 py-2 text-xs"
              >
                {confirmState.options.cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`px-4 py-2 text-xs rounded-lg font-bold transition-all shadow-md ${
                  confirmState.options.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : confirmState.options.type === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-amber-500/30'
                    : 'btn-primary'
                }`}
              >
                {confirmState.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cyber Alert Modal */}
      {alertState && alertState.isOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border-purple-500/40 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  alertState.options.type === 'error'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/20'
                    : alertState.options.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/20'
                    : alertState.options.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-lg shadow-cyan-500/20'
                }`}
              >
                {alertState.options.icon || (
                  alertState.options.type === 'error' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : alertState.options.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : alertState.options.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <h3 className="font-extrabold text-base text-slate-100">
                  {alertState.options.title}
                </h3>
                <div className="text-xs text-slate-300 leading-relaxed">
                  {alertState.options.message}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleAlertClose}
                className="btn-primary px-5 py-2 text-xs"
              >
                {alertState.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
