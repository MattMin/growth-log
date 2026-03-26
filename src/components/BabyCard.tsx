'use client';

import { Baby } from '@/lib/types';
import Link from 'next/link';

interface BabyCardProps {
  baby: Baby;
  onEdit: (baby: Baby) => void;
  onDelete: (recordName: string) => void;
}

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} 年`);
  if (months > 0) parts.push(`${months} 月`);
  parts.push(`${days} 天`);
  return parts.join(' ');
}

function calculateCorrectedAge(birthDate: string, prematureBirthDate: string): string | null {
  const actual = new Date(birthDate);
  const expected = new Date(prematureBirthDate);
  const diffDays = Math.floor((expected.getTime() - actual.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return null;
  
  const now = new Date();
  const correctedDate = new Date(now.getTime() - diffDays * 24 * 60 * 60 * 1000);
  const correctedBirth = new Date(birthDate);
  
  let years = correctedDate.getFullYear() - correctedBirth.getFullYear();
  let months = correctedDate.getMonth() - correctedBirth.getMonth();
  let days = correctedDate.getDate() - correctedBirth.getDate();

  // Adjust for premature time
  const totalCorrectedDays = Math.floor((now.getTime() - actual.getTime()) / (1000 * 60 * 60 * 24)) - diffDays;
  if (totalCorrectedDays < 0) return '尚未到预产期';

  if (days < 0) {
    months--;
    const lastMonth = new Date(correctedDate.getFullYear(), correctedDate.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years}年`);
  if (months > 0) parts.push(`${months}月`);
  parts.push(`${days}天`);
  return parts.join('');
}

export default function BabyCard({ baby, onEdit, onDelete }: BabyCardProps) {
  const age = calculateAge(baby.birthDate);
  const correctedAge = baby.prematureBirthDate
    ? calculateCorrectedAge(baby.birthDate, baby.prematureBirthDate)
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <Link href={`/dashboard/baby/${baby.recordName}`} className="block">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 dark:from-blue-900 dark:to-pink-900 flex items-center justify-center text-2xl flex-shrink-0">
            {baby.gender === 'male' ? '👦' : '👧'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
              {baby.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{age}</p>
            {correctedAge && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                校正年龄：{correctedAge}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(baby); }}
          className="flex-1 text-sm py-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          编辑
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (baby.recordName) onDelete(baby.recordName); }}
          className="flex-1 text-sm py-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  );
}
