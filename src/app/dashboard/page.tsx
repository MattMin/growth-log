'use client';

import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Baby } from '@/lib/types';
import BabyCard from '@/components/BabyCard';
import BabyForm from '@/components/BabyForm';

export default function DashboardPage() {
  const { babies, loading, addBaby, updateBaby, removeBaby } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);

  const handleSave = async (baby: Baby) => {
    if (baby.recordName) {
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

  const handleDelete = async (recordName: string) => {
    if (confirm('确定要删除这个宝宝的所有数据吗？此操作不可撤销。')) {
      await removeBaby(recordName);
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
        <button
          onClick={() => { setEditingBaby(null); setShowForm(true); }}
          className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
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
              key={baby.recordName}
              baby={baby}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
    </div>
  );
}
