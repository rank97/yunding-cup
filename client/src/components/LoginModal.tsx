import React, { useState, useEffect } from 'react';
import { X, Lock, User as UserIcon, Shield } from 'lucide-react';
import { authApi } from '../services/api';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('user');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 每次打开弹窗时重置所有状态，默认回归登录界面并清除所有历史错误
  useEffect(() => {
    if (isOpen) {
      setIsRegister(false);
      setUsername('user');
      setPassword('123456');
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMode = (registerMode: boolean) => {
    setIsRegister(registerMode);
    setErrorMsg(null);
    if (registerMode) {
      setUsername('');
      setPassword('');
    } else {
      setUsername('user');
      setPassword('123456');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      setLoading(true);
      if (isRegister) {
        await authApi.register({ username, password });
        // 自动登录
        const res = await authApi.login({ username, password });
        localStorage.setItem('satoken', res.token);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await authApi.login({ username, password });
        localStorage.setItem('satoken', res.token);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-2xl border-purple-500/40 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="font-extrabold text-base text-slate-100">
              {isRegister ? '注册主办方账号 (独立办赛)' : '主办方 / 超管登录'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">用户名</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">密码</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {isRegister && (
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-300 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <span>🛡️</span> 注册提示：
              </div>
              <div className="text-slate-400">
                新注册账号默认为 <span className="text-purple-300 font-bold">赛事主办方</span> 权限，系统将自动分配专属独立办赛空间与标准积分规则。超级管理员仅限系统内置 admin 账号。
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 mt-2"
          >
            {loading ? '正在处理...' : isRegister ? '确认注册并进入' : '立即登录'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
          {isRegister ? '已有账号？' : '首次使用系统？'}
          <button
            type="button"
            onClick={() => handleToggleMode(!isRegister)}
            className="text-purple-400 hover:text-purple-300 font-semibold ml-1 underline"
          >
            {isRegister ? '去登录' : '创建新账号'}
          </button>
        </div>
      </div>
    </div>
  );
};
