'use client';

import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Baby } from '@/lib/types';
import BabyCard from '@/components/BabyCard';
import BabyForm from '@/components/BabyForm';
import ImportById from '@/components/ImportById';

export default function DashboardPage() {
  const { babies, loading, addBaby, updateBaby, removeBaby, isSupabase, getBabyAvatar } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);
  const [showImportById, setShowImportById] = useState(false);

  const handleSave = async (baby: Baby) => {
    if (baby.id || baby.recordName) {
      await updateBaby(baby);
    } else {
      await addBaby(baby);
    }
    setShowForm(false);
    setEditingBaby(null);
  };

  const handleEdit = (baby: Baby) => {
    setEditingBaby(baby);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const msg = isSupabase
      ? '确定要移除这个宝宝吗？数据不会从云端删除，以后可以通过ID重新导入。'
      : '确定要删除这个宝宝的所有数据吗？此操作不可撤销。';
    if (confirm(msg)) {
      await removeBaby(id);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">我的宝宝</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportById(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            title="通过ID导入"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={() => { setEditingBaby(null); setShowForm(true); }}
            className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {babies.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">👶</div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">还没有添加宝宝</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-500 dark:text-blue-400 font-medium"
          >
            添加第一个宝宝
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {babies.map(baby => (
            <BabyCard
              key={baby.id || baby.recordName}
              baby={baby}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showCopyId={isSupabase}
              loadAvatar={isSupabase ? getBabyAvatar : undefined}
            />
          ))}
        </div>
      )}

      {showForm && (
        <BabyForm
          baby={editingBaby}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingBaby(null); }}
        />
      )}

      {showImportById && (
        <ImportById
          onImported={() => setShowImportById(false)}
          onCancel={() => setShowImportById(false)}
        />
      )}
    </div>
  );
}
