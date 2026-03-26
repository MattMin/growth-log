'use client';

import { GrowthRecord } from '@/lib/types';
import { useState, useEffect } from 'react';

interface GrowthRecordFormProps {
  babyId: string;
  record?: GrowthRecord | null;
  onSave: (record: GrowthRecord) => void;
  onCancel: () => void;
}

export default function GrowthRecordForm({ babyId, record, onSave, onCancel }: GrowthRecordFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');

  useEffect(() => {
    if (record) {
      setDate(record.date);
      setWeight(record.weight?.toString() || '');
      setHeight(record.height?.toString() || '');
      setHeadCircumference(record.headCircumference?.toString() || '');
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      recordName: record?.recordName,
      babyId,
      date,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      headCircumference: headCircumference ? parseFloat(headCircumference) : undefined,
    });
  };

  const hasValue = weight || height || headCircumference;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onCancel} className="text-blue-500 dark:text-blue-400">取消</button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {record ? '编辑记录' : '新增记录'}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={!hasValue}
            className="text-blue-500 dark:text-blue-400 font-semibold disabled:opacity-40"
          >
            完成
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 dark:text-gray-500">日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex items-center gap-3">
              <span className="text-xl">⚖️</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 dark:text-gray-500">体重 (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="例: 3.5"
                  className="w-full bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex items-center gap-3">
              <span className="text-xl">📏</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 dark:text-gray-500">身高 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder="例: 50.0"
                  className="w-full bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex items-center gap-3">
              <span className="text-xl">📐</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 dark:text-gray-500">头围 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={headCircumference}
                  onChange={e => setHeadCircumference(e.target.value)}
                  placeholder="例: 34.0"
                  className="w-full bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
