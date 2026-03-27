'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';

interface ImportByIdProps {
  onImported: () => void;
  onCancel: () => void;
}

export default function ImportById({ onImported, onCancel }: ImportByIdProps) {
  const { importBabyById, fetchBabyById, isSupabase } = useData();
  const [babyId, setBabyId] = useState('');
  const [synced, setSynced] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewName, setPreviewName] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handlePreview = async () => {
    if (!babyId.trim()) return;
    setError('');
    setLoading(true);
    const baby = await fetchBabyById(babyId.trim());
    setLoading(false);
    if (baby) {
      setPreviewName(baby.name);
    } else {
      setError('未找到该ID对应的宝宝数据');
      setPreviewName(null);
    }
  };

  const handleImport = async () => {
    if (!babyId.trim()) return;
    setError('');
    setLoading(true);
    const result = await importBabyById(babyId.trim(), synced);
    setLoading(false);
    if (result) {
      onImported();
    } else {
      setError('导入失败，请检查ID是否正确');
    }
  };

  if (!isSupabase) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onCancel} className="text-blue-500 dark:text-blue-400">关闭</button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">通过ID导入</h2>
            <div className="w-10" />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            此功能需要配置 Supabase 后才能使用
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onCancel} className="text-blue-500 dark:text-blue-400">取消</button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">通过ID导入</h2>
          <button
            onClick={handleImport}
            disabled={loading || !previewName}
            className="text-blue-500 dark:text-blue-400 font-semibold disabled:opacity-40"
          >
            {loading ? '导入中...' : '导入'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">宝宝ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={babyId}
                onChange={e => { setBabyId(e.target.value); setPreviewName(null); setError(''); }}
                placeholder="粘贴宝宝ID"
                className="flex-1 bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handlePreview}
                disabled={loading || !babyId.trim()}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-40"
              >
                {loading ? '...' : '查找'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {previewName && (
            <>
              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-xl text-sm">
                找到宝宝：<strong>{previewName}</strong>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-3">同步模式</label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={synced}
                      onChange={() => setSynced(true)}
                      className="mt-1 accent-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">同步数据</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        与原宝宝数据保持同步，双方修改会相互影响
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={!synced}
                      onChange={() => setSynced(false)}
                      className="mt-1 accent-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">独立副本</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        复制一份独立数据，以后修改互不影响
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
