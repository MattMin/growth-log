'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import { Baby, GrowthRecord, MeasureType } from '@/lib/types';
import { AVAILABLE_STANDARDS } from '@/lib/growth-standards';
import GrowthRecordList from '@/components/GrowthRecordList';
import GrowthRecordForm from '@/components/GrowthRecordForm';
import GrowthChart from '@/components/GrowthChart';
import CsvImport from '@/components/CsvImport';

type ViewMode = 'list' | 'chart';

export default function BabyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const babyId = params.id as string;
  const { babies, getGrowthRecords, addGrowthRecord, updateGrowthRecord, removeGrowthRecord } = useData();

  const [baby, setBaby] = useState<Baby | null>(null);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [standard, setStandard] = useState('WHO');
  const [chartType, setChartType] = useState<MeasureType>('weight');
  const [showSettings, setShowSettings] = useState(false);

  const loadRecords = useCallback(async () => {
    const data = await getGrowthRecords(babyId);
    setRecords(data);
  }, [babyId, getGrowthRecords]);

  useEffect(() => {
    const found = babies.find(b => (b.id || b.recordName) === babyId);
    if (found) {
      setBaby(found);
      loadRecords().then(() => setLoading(false));
    } else {
      router.replace('/dashboard');
    }
  }, [babies, babyId, router, loadRecords]);

  const handleSaveRecord = async (record: GrowthRecord) => {
    if (record.id || record.recordName) {
      await updateGrowthRecord(record);
    } else {
      await addGrowthRecord(record);
    }
    await loadRecords();
    setShowRecordForm(false);
    setEditingRecord(null);
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('确定要删除此记录吗？')) {
      await removeGrowthRecord(id, babyId);
      await loadRecords();
    }
  };

  const handleCsvImport = async (importedRecords: GrowthRecord[]) => {
    for (const record of importedRecords) {
      await addGrowthRecord(record);
    }
    await loadRecords();
    setShowCsvImport(false);
  };

  const handleCsvExport = () => {
    if (records.length === 0) return;
    const header = 'Date,Weight (kg),Height (cm),Head Circumference (cm)';
    const rows = records
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(r => {
        const w = r.weight != null ? r.weight : '';
        const h = r.height != null ? r.height : '';
        const hc = r.headCircumference != null ? r.headCircumference : '';
        return `${r.date},${w},${h},${hc}`;
      });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baby?.name || 'growth'}-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !baby) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const measureTypes: MeasureType[] = ['weight', 'height', 'headCircumference'];
  const measureLabels: Record<MeasureType, string> = {
    weight: '体重',
    height: '身高',
    headCircumference: '头围',
  };

  return (
    <div>
      {/* Baby info header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{baby.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {baby.gender === 'male' ? '男孩' : '女孩'} · 出生于 {baby.birthDate}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'chart'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            📊 曲线
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            📋 数据
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleCsvExport}
            disabled={records.length === 0}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-30"
            title="导出CSV"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
            </svg>
          </button>
          <button
            onClick={() => setShowCsvImport(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            title="导入CSV"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={() => { setEditingRecord(null); setShowRecordForm(true); }}
            className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">选项</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">生长标准</span>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              {AVAILABLE_STANDARDS.map(s => (
                <button
                  key={s}
                  onClick={() => setStandard(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    standard === s
                      ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">性别</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {baby.gender === 'male' ? '男孩' : '女孩'}
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      {viewMode === 'chart' ? (
        <div>
          {/* Chart type selector - thumbnail style */}
          <div className="flex gap-3 justify-center mb-4">
            {measureTypes.map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  chartType === type
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                }`}
              >
                {measureLabels[type]}
              </button>
            ))}
          </div>

          {/* Standard selector - bottom tabs style */}
          <div className="flex gap-1 justify-center mb-6">
            {AVAILABLE_STANDARDS.map(s => (
              <button
                key={s}
                onClick={() => setStandard(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  standard === s
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <GrowthChart
              records={records}
              birthDate={baby.birthDate}
              gender={baby.gender}
              standard={standard}
              measureType={chartType}
              babyName={baby.name}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
          <GrowthRecordList
            records={records}
            birthDate={baby.birthDate}
            gender={baby.gender}
            standard={standard}
            onEdit={record => { setEditingRecord(record); setShowRecordForm(true); }}
            onDelete={handleDeleteRecord}
          />
        </div>
      )}

      {/* Forms */}
      {showRecordForm && (
        <GrowthRecordForm
          babyId={babyId}
          record={editingRecord}
          onSave={handleSaveRecord}
          onCancel={() => { setShowRecordForm(false); setEditingRecord(null); }}
        />
      )}

      {showCsvImport && (
        <CsvImport
          babyId={babyId}
          onImport={handleCsvImport}
          onCancel={() => setShowCsvImport(false)}
        />
      )}
    </div>
  );
}
