'use client';

import { Baby } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';

interface BabyFormProps {
  baby?: Baby | null;
  onSave: (baby: Baby) => void;
  onCancel: () => void;
}

export default function BabyForm({ baby, onSave, onCancel }: BabyFormProps) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [prematureBirthDate, setPrematureBirthDate] = useState('');
  const [isPremature, setIsPremature] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (baby) {
      setName(baby.name);
      setBirthDate(baby.birthDate);
      setGender(baby.gender);
      setAvatar(baby.avatar);
      if (baby.prematureBirthDate) {
        setIsPremature(true);
        setPrematureBirthDate(baby.prematureBirthDate);
      }
    }
  }, [baby]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Crop to square from center
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        setAvatar(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: baby?.id,
      recordName: baby?.recordName,
      name,
      birthDate,
      gender,
      prematureBirthDate: isPremature ? prematureBirthDate : undefined,
      avatar,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onCancel} className="text-blue-500 dark:text-blue-400">取消</button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {baby ? '编辑宝宝' : '添加宝宝'}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={!name || !birthDate}
            className="text-blue-500 dark:text-blue-400 font-semibold disabled:opacity-40"
          >
            完成
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar upload */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 dark:from-blue-900 dark:to-pink-900 flex items-center justify-center text-3xl overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all relative group"
            >
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                gender === 'male' ? '👦' : '👧'
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">姓名</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="宝宝的名字"
                className="w-full bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none text-base"
                required
              />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">出生日期</label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none text-base"
                required
              />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">性别</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    gender === 'male'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  👦 男孩
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    gender === 'female'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  👧 女孩
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isPremature}
                onChange={e => setIsPremature(e.target.checked)}
                className="w-5 h-5 rounded accent-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-200">早产儿</span>
            </label>
            {isPremature && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">预产期</label>
                <input
                  type="date"
                  value={prematureBirthDate}
                  onChange={e => setPrematureBirthDate(e.target.value)}
                  className="w-full bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none text-base"
                />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
