'use client';

import { Baby } from '@/lib/types';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface BabyCardProps {
  baby: Baby;
  onEdit: (baby: Baby) => void;
  onDelete: (id: string) => void;
  showCopyId?: boolean;
  loadAvatar?: (babyId: string) => Promise<string | undefined>;
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

export default function BabyCard({ baby, onEdit, onDelete, showCopyId, loadAvatar }: BabyCardProps) {
  const age = calculateAge(baby.birthDate);
  const correctedAge = baby.prematureBirthDate
    ? calculateCorrectedAge(baby.birthDate, baby.prematureBirthDate)
    : null;

  const babyKey = baby.id || baby.recordName || '';
  const [offsetX, setOffsetX] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isVerticalRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(baby.avatar);
  const [shouldLoadAvatar, setShouldLoadAvatar] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const ACTION_WIDTH = 140;

  useEffect(() => {
    setAvatarSrc(baby.avatar);
  }, [baby.avatar, baby.id, baby.recordName]);

  useEffect(() => {
    if (avatarSrc || !babyKey || !loadAvatar) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadAvatar(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoadAvatar(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [avatarSrc, babyKey, loadAvatar]);

  useEffect(() => {
    if (!shouldLoadAvatar || avatarSrc || !babyKey || !loadAvatar) return;

    let active = true;
    loadAvatar(babyKey).then((loadedAvatar) => {
      if (active && loadedAvatar) {
        setAvatarSrc(loadedAvatar);
      }
    });

    return () => {
      active = false;
    };
  }, [shouldLoadAvatar, avatarSrc, babyKey, loadAvatar]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentXRef.current = swiped ? -ACTION_WIDTH : 0;
    isDraggingRef.current = false;
    isVerticalRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    if (!isDraggingRef.current && !isVerticalRef.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
        isVerticalRef.current = true;
        return;
      }
      if (Math.abs(dx) > 5) {
        isDraggingRef.current = true;
      }
    }

    if (isVerticalRef.current) return;
    if (!isDraggingRef.current) return;

    const newX = currentXRef.current + dx;
    const clamped = Math.max(-ACTION_WIDTH, Math.min(0, newX));
    setOffsetX(clamped);
  };

  const handleTouchEnd = () => {
    if (isVerticalRef.current) return;
    if (offsetX < -ACTION_WIDTH / 2) {
      setOffsetX(-ACTION_WIDTH);
      setSwiped(true);
    } else {
      setOffsetX(0);
      setSwiped(false);
    }
    isDraggingRef.current = false;
  };

  const closeSwiped = () => {
    setOffsetX(0);
    setSwiped(false);
  };

  const handleCopyId = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!babyKey) return;
    try {
      await navigator.clipboard.writeText(babyKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = babyKey;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div ref={cardRef} className="relative overflow-hidden rounded-2xl">
      {/* Action buttons behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch" style={{ width: ACTION_WIDTH }}>
        <button
          onClick={() => { closeSwiped(); onEdit(baby); }}
          className="flex-1 flex items-center justify-center bg-blue-500 text-white text-sm font-medium"
        >
          编辑
        </button>
        <button
          onClick={() => { closeSwiped(); if (babyKey) onDelete(babyKey); }}
          className="flex-1 flex items-center justify-center bg-red-500 text-white text-sm font-medium"
        >
          删除
        </button>
      </div>

      {/* Swipeable card */}
      <div
        className="relative bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-transform duration-150 ease-out"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link href={`/dashboard/baby/${babyKey}`} className="block">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 dark:from-blue-900 dark:to-pink-900 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt={baby.name} className="w-full h-full object-cover" />
              ) : (
                baby.gender === 'male' ? '👦' : '👧'
              )}
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
            {showCopyId && babyKey && (
              <button
                onClick={handleCopyId}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 dark:text-gray-500 flex-shrink-0"
                title="复制宝宝ID"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
