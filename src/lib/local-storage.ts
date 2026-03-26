// Local storage fallback when CloudKit is not configured
import { Baby, GrowthRecord } from './types';

const BABIES_KEY = 'growth-log-babies';
const RECORDS_KEY = 'growth-log-records';

function generateId(): string {
  return crypto.randomUUID();
}

export function getLocalBabies(): Baby[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BABIES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveLocalBaby(baby: Baby): Baby {
  const babies = getLocalBabies();
  if (baby.recordName) {
    const idx = babies.findIndex(b => b.recordName === baby.recordName);
    if (idx >= 0) babies[idx] = baby;
    else babies.push(baby);
  } else {
    baby.recordName = generateId();
    babies.push(baby);
  }
  localStorage.setItem(BABIES_KEY, JSON.stringify(babies));
  return baby;
}

export function deleteLocalBaby(recordName: string): void {
  const babies = getLocalBabies().filter(b => b.recordName !== recordName);
  localStorage.setItem(BABIES_KEY, JSON.stringify(babies));
  // Also delete associated growth records
  const records = getLocalGrowthRecords(recordName);
  if (records.length) {
    const allRecords = getAllLocalGrowthRecords().filter(r => r.babyId !== recordName);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords));
  }
}

function getAllLocalGrowthRecords(): GrowthRecord[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(RECORDS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getLocalGrowthRecords(babyId: string): GrowthRecord[] {
  return getAllLocalGrowthRecords()
    .filter(r => r.babyId === babyId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function saveLocalGrowthRecord(record: GrowthRecord): GrowthRecord {
  const all = getAllLocalGrowthRecords();
  if (record.recordName) {
    const idx = all.findIndex(r => r.recordName === record.recordName);
    if (idx >= 0) all[idx] = record;
    else all.push(record);
  } else {
    record.recordName = generateId();
    all.push(record);
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
  return record;
}

export function deleteLocalGrowthRecord(recordName: string): void {
  const all = getAllLocalGrowthRecords().filter(r => r.recordName !== recordName);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}
