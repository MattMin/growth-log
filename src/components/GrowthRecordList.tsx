'use client';

import { GrowthRecord, MeasureType } from '@/lib/types';
import { getMeasureTypeLabel, getMeasureTypeUnit, calculatePercentile, calculateAgeInMonths } from '@/lib/growth-standards';
import { useState } from 'react';

interface GrowthRecordListProps {
  records: GrowthRecord[];
  birthDate: string;
  gender: 'male' | 'female';
  standard: string;
  onEdit: (record: GrowthRecord) => void;
  onDelete: (recordName: string) => void;
}

export default function GrowthRecordList({ records, birthDate, gender, standard, onEdit, onDelete }: GrowthRecordListProps) {
  const [activeType, setActiveType] = useState<MeasureType>('weight');

  const types: MeasureType[] = ['weight', 'height', 'headCircumference'];

  const filteredRecords = records.filter(r => {
    if (activeType === 'weight') return r.weight != null;
    if (activeType === 'height') return r.height != null;
    return r.headCircumference != null;
  });

  const getValue = (record: GrowthRecord): number | undefined => {
    if (activeType === 'weight') return record.weight;
    if (activeType === 'height') return record.height;
    return record.headCircumference;
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div>
      {/* Type tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-4">
        {types.map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeType === type
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {getMeasureTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Records */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p>暂无{getMeasureTypeLabel(activeType)}数据</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {filteredRecords.map(record => {
            const value = getValue(record);
            const ageMonths = calculateAgeInMonths(birthDate, record.date);
            const percentile = value != null
              ? calculatePercentile(value, ageMonths, activeType, gender, standard)
              : null;

            return (
              <div
                key={record.id || record.recordName}
                className="flex items-center justify-between py-3.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg group transition-colors"
              >
                <span className="text-gray-700 dark:text-gray-200 text-sm">
                  {formatDate(record.date)}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {value} {getMeasureTypeUnit(activeType)}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 text-sm w-12 text-right">
                    {percentile != null ? `${Math.round(percentile)}%` : '----'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(record)}
                      className="p-1 text-gray-400 hover:text-blue-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { const id = record.id || record.recordName; if (id) onDelete(id); }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
