'use client';

import { Baby } from '@/lib/types';
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (baby) {
      setName(baby.name);
      setBirthDate(baby.birthDate);
      setGender(baby.gender);
      if (baby.prematureBirthDate) {
        setIsPremature(true);
        setPrematureBirthDate(baby.prematureBirthDate);
      }
    }
  }, [baby]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      recordName: baby?.recordName,
      name,
      birthDate,
      gender,
      prematureBirthDate: isPremature ? prematureBirthDate : undefined,
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
