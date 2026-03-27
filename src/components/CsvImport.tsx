'use client';

import { useRef, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { GrowthRecord } from '@/lib/types';

interface CsvImportProps {
  babyId: string;
  onImport: (records: GrowthRecord[]) => void | Promise<void>;
  onCancel: () => void;
}

export default function CsvImport({ babyId, onImport, onCancel }: CsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<GrowthRecord[]>([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const records: GrowthRecord[] = [];
          for (const row of results.data as Record<string, string>[]) {
            const date = row['Date'];
            if (!date) continue;

            // Parse date - handle various formats
            let parsedDate: string;
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
              parsedDate = d.toISOString().split('T')[0];
            } else {
              continue; // Skip invalid dates
            }

            const weight = parseFloat(row['Weight (kg)']);
            const height = parseFloat(row['Height (cm)']);
            const head = parseFloat(row['Head Circumference (cm)']);

            if (isNaN(weight) && isNaN(height) && isNaN(head)) continue;

            records.push({
              babyId,
              date: parsedDate,
              weight: isNaN(weight) ? undefined : weight,
              height: isNaN(height) ? undefined : height,
              headCircumference: isNaN(head) ? undefined : head,
            });
          }

          if (records.length === 0) {
            setError('未找到有效数据。请确保CSV文件包含正确的列标题：Date, Weight (kg), Height (cm), Head Circumference (cm)');
            return;
          }

          setPreview(records);
        } catch {
          setError('解析CSV文件失败，请检查文件格式');
        }
      },
      error: () => {
        setError('读取文件失败');
      },
    });
  };

  const handleImport = async () => {
    if (preview.length === 0 || importing) return;
    setImporting(true);
    try {
      await onImport(preview);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onCancel} className="text-blue-500 dark:text-blue-400">取消</button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">导入数据</h2>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || importing}
            className="text-blue-500 dark:text-blue-400 font-semibold disabled:opacity-40"
          >
            {importing ? '导入中...' : `导入 (${preview.length})`}
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              请选择CSV文件，要求包含以下列：
            </p>
            <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-200">
              Date, Weight (kg), Height (cm), Head Circumference (cm)
            </code>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-3 w-full text-sm text-gray-600 dark:text-gray-300
                file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600
                dark:file:bg-blue-900/30 dark:file:text-blue-400
                file:cursor-pointer"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {preview.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                预览 ({preview.length} 条记录)
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {preview.slice(0, 20).map((r, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-500 dark:text-gray-400 py-1">
                    <span>{r.date}</span>
                    <div className="flex gap-3">
                      {r.weight != null && <span>{r.weight} kg</span>}
                      {r.height != null && <span>{r.height} cm</span>}
                      {r.headCircumference != null && <span>头围 {r.headCircumference} cm</span>}
                    </div>
                  </div>
                ))}
                {preview.length > 20 && (
                  <p className="text-xs text-gray-400 text-center pt-2">
                    ... 还有 {preview.length - 20} 条记录
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
