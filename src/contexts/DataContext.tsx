'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Baby, GrowthRecord } from '@/lib/types';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  getLocalBabies,
  saveLocalBaby,
  deleteLocalBaby,
  getLocalGrowthRecords,
  saveLocalGrowthRecord,
  deleteLocalGrowthRecord,
} from '@/lib/local-storage';

const MY_BABIES_KEY = 'growth-log-my-babies';

function getMyBabyIds(): string[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(MY_BABIES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMyBabyIds(ids: string[]) {
  localStorage.setItem(MY_BABIES_KEY, JSON.stringify(ids));
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: generate a valid UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface DataContextType {
  isSupabase: boolean;
  babies: Baby[];
  loading: boolean;
  addBaby: (baby: Baby) => Promise<Baby | null>;
  updateBaby: (baby: Baby) => Promise<Baby | null>;
  removeBaby: (id: string) => Promise<void>;
  getGrowthRecords: (babyId: string) => Promise<GrowthRecord[]>;
  addGrowthRecord: (record: GrowthRecord) => Promise<GrowthRecord | null>;
  updateGrowthRecord: (record: GrowthRecord) => Promise<GrowthRecord | null>;
  removeGrowthRecord: (id: string, babyId: string) => Promise<void>;
  refreshBabies: () => Promise<void>;
  importBabyById: (babyId: string, synced: boolean) => Promise<Baby | null>;
  fetchBabyById: (babyId: string) => Promise<Baby | null>;
  getBabyAvatar: (babyId: string) => Promise<string | undefined>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isSupabase, setIsSupabase] = useState(false);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const avatarCacheRef = useRef<Map<string, string | undefined>>(new Map());
  const pendingAvatarRequestsRef = useRef<Map<string, Promise<string | undefined>>>(new Map());

  const loadBabiesFromSupabase = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return [];
    const ids = getMyBabyIds();
    if (ids.length === 0) return [];
    const { data, error } = await sb
      .from('babies')
      .select('id,name,birth_date,gender,premature_birth_date')
      .in('id', ids);
    if (error) { console.error('Failed to fetch babies:', error); return []; }
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      birthDate: row.birth_date as string,
      gender: row.gender as 'male' | 'female',
      prematureBirthDate: (row.premature_birth_date as string) || undefined,
    }));
  }, []);

  const refreshBabies = useCallback(async () => {
    if (isSupabase) {
      const list = await loadBabiesFromSupabase();
      setBabies(list);
    } else {
      setBabies(getLocalBabies());
    }
  }, [isSupabase, loadBabiesFromSupabase]);

  useEffect(() => {
    const init = async () => {
      if (isSupabaseConfigured() && getSupabase()) {
        setIsSupabase(true);
        const list = await loadBabiesFromSupabase();
        setBabies(list);
      } else {
        setIsSupabase(false);
        setBabies(getLocalBabies());
      }
      setLoading(false);
    };
    init();
  }, [loadBabiesFromSupabase]);

  const supabaseAddBaby = useCallback(async (baby: Baby): Promise<Baby | null> => {
    const sb = getSupabase();
    if (!sb) return null;
    const id = generateId();
    const row = {
      id,
      name: baby.name,
      birth_date: baby.birthDate,
      gender: baby.gender,
      premature_birth_date: baby.prematureBirthDate || null,
      avatar: baby.avatar || null,
    };
    const { error } = await sb.from('babies').insert(row);
    if (error) { console.error('Failed to add baby:', error); return null; }
    const ids = getMyBabyIds();
    ids.push(id);
    saveMyBabyIds(ids);
    return { ...baby, id };
  }, []);

  const supabaseUpdateBaby = useCallback(async (baby: Baby): Promise<Baby | null> => {
    const sb = getSupabase();
    if (!sb || !baby.id) return null;
    const row = {
      name: baby.name,
      birth_date: baby.birthDate,
      gender: baby.gender,
      premature_birth_date: baby.prematureBirthDate || null,
      avatar: baby.avatar || null,
    };
    const { error } = await sb.from('babies').update(row).eq('id', baby.id);
    if (error) { console.error('Failed to update baby:', error); return null; }
    return baby;
  }, []);

  const supabaseRemoveBaby = useCallback(async (id: string) => {
    // Soft-delete: only remove from local list, don't delete from DB
    const ids = getMyBabyIds().filter(i => i !== id);
    saveMyBabyIds(ids);
  }, []);

  const supabaseGetGrowthRecords = useCallback(async (babyId: string): Promise<GrowthRecord[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data, error } = await sb
      .from('growth_records')
      .select('*')
      .eq('baby_id', babyId)
      .order('date', { ascending: true });
    if (error) { console.error('Failed to fetch records:', error); return []; }
    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      babyId: row.baby_id as string,
      date: row.date as string,
      weight: (row.weight as number) ?? undefined,
      height: (row.height as number) ?? undefined,
      headCircumference: (row.head_circumference as number) ?? undefined,
    }));
  }, []);

  const supabaseAddGrowthRecord = useCallback(async (record: GrowthRecord): Promise<GrowthRecord | null> => {
    const sb = getSupabase();
    if (!sb) return null;
    const id = generateId();
    const row = {
      id,
      baby_id: record.babyId,
      date: record.date,
      weight: record.weight ?? null,
      height: record.height ?? null,
      head_circumference: record.headCircumference ?? null,
    };
    const { error } = await sb.from('growth_records').insert(row);
    if (error) { console.error('Failed to add record:', error); return null; }
    return { ...record, id };
  }, []);

  const supabaseUpdateGrowthRecord = useCallback(async (record: GrowthRecord): Promise<GrowthRecord | null> => {
    const sb = getSupabase();
    if (!sb || !record.id) return null;
    const row = {
      date: record.date,
      weight: record.weight ?? null,
      height: record.height ?? null,
      head_circumference: record.headCircumference ?? null,
    };
    const { error } = await sb.from('growth_records').update(row).eq('id', record.id);
    if (error) { console.error('Failed to update record:', error); return null; }
    return record;
  }, []);

  const supabaseRemoveGrowthRecord = useCallback(async (id: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('growth_records').delete().eq('id', id);
    if (error) console.error('Failed to delete record:', error);
  }, []);

  const getBabyAvatar = useCallback(async (babyId: string): Promise<string | undefined> => {
    if (!babyId) return undefined;

    if (avatarCacheRef.current.has(babyId)) {
      return avatarCacheRef.current.get(babyId);
    }

    if (!isSupabase) {
      const avatar = babies.find((baby) => (baby.id || baby.recordName) === babyId)?.avatar;
      avatarCacheRef.current.set(babyId, avatar);
      return avatar;
    }

    const existingRequest = pendingAvatarRequestsRef.current.get(babyId);
    if (existingRequest) return existingRequest;

    const sb = getSupabase();
    if (!sb) return undefined;

    const request = (async () => {
      const { data, error } = await sb
        .from('babies')
        .select('avatar')
        .eq('id', babyId)
        .single();

      if (error) {
        console.error('Failed to fetch avatar:', error);
        return undefined;
      }

      const avatar = (data as { avatar?: string } | null)?.avatar || undefined;
      avatarCacheRef.current.set(babyId, avatar);
      return avatar;
    })().finally(() => {
      pendingAvatarRequestsRef.current.delete(babyId);
    });

    pendingAvatarRequestsRef.current.set(babyId, request);
    return request;
  }, [isSupabase, babies]);

  // --- Public API ---

  const addBaby = useCallback(async (baby: Baby): Promise<Baby | null> => {
    if (isSupabase) {
      const saved = await supabaseAddBaby(baby);
      if (saved) {
        const babyKey = saved.id || saved.recordName;
        if (babyKey) avatarCacheRef.current.set(babyKey, saved.avatar);
        await refreshBabies();
      }
      return saved;
    }
    const saved = saveLocalBaby(baby);
    setBabies(getLocalBabies());
    return saved;
  }, [isSupabase, supabaseAddBaby, refreshBabies]);

  const updateBaby = useCallback(async (baby: Baby): Promise<Baby | null> => {
    if (isSupabase) {
      const saved = await supabaseUpdateBaby(baby);
      if (saved) {
        const babyKey = saved.id || saved.recordName;
        if (babyKey) avatarCacheRef.current.set(babyKey, saved.avatar);
        await refreshBabies();
      }
      return saved;
    }
    const saved = saveLocalBaby(baby);
    setBabies(getLocalBabies());
    return saved;
  }, [isSupabase, supabaseUpdateBaby, refreshBabies]);

  const removeBaby = useCallback(async (id: string) => {
    if (isSupabase) {
      await supabaseRemoveBaby(id);
      avatarCacheRef.current.delete(id);
      await refreshBabies();
    } else {
      deleteLocalBaby(id);
      setBabies(getLocalBabies());
    }
  }, [isSupabase, supabaseRemoveBaby, refreshBabies]);

  const getGrowthRecords = useCallback(async (babyId: string): Promise<GrowthRecord[]> => {
    if (isSupabase) return supabaseGetGrowthRecords(babyId);
    return getLocalGrowthRecords(babyId);
  }, [isSupabase, supabaseGetGrowthRecords]);

  const addGrowthRecord = useCallback(async (record: GrowthRecord): Promise<GrowthRecord | null> => {
    if (isSupabase) return supabaseAddGrowthRecord(record);
    return saveLocalGrowthRecord(record);
  }, [isSupabase, supabaseAddGrowthRecord]);

  const updateGrowthRecord = useCallback(async (record: GrowthRecord): Promise<GrowthRecord | null> => {
    if (isSupabase) return supabaseUpdateGrowthRecord(record);
    return saveLocalGrowthRecord(record);
  }, [isSupabase, supabaseUpdateGrowthRecord]);

  const removeGrowthRecord = useCallback(async (id: string) => {
    if (isSupabase) {
      await supabaseRemoveGrowthRecord(id);
    } else {
      deleteLocalGrowthRecord(id);
    }
  }, [isSupabase, supabaseRemoveGrowthRecord]);

  const fetchBabyById = useCallback(async (babyId: string): Promise<Baby | null> => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('babies').select('*').eq('id', babyId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      birthDate: data.birth_date,
      gender: data.gender,
      prematureBirthDate: data.premature_birth_date || undefined,
      avatar: data.avatar || undefined,
    };
  }, []);

  const importBabyById = useCallback(async (babyId: string, synced: boolean): Promise<Baby | null> => {
    const sb = getSupabase();
    if (!sb) return null;

    const baby = await fetchBabyById(babyId);
    if (!baby) return null;

    if (synced) {
      // Just add the baby's ID to our local list — shares the same DB row
      const ids = getMyBabyIds();
      if (!ids.includes(babyId)) {
        ids.push(babyId);
        saveMyBabyIds(ids);
      }
      await refreshBabies();
      return baby;
    } else {
      // Independent copy: create new baby + copy all records with new IDs
      const newBabyId = generateId();
      const newBabyRow = {
        id: newBabyId,
        name: baby.name,
        birth_date: baby.birthDate,
        gender: baby.gender,
        premature_birth_date: baby.prematureBirthDate || null,
        avatar: baby.avatar || null,
      };
      const { error: babyError } = await sb.from('babies').insert(newBabyRow);
      if (babyError) { console.error('Failed to copy baby:', babyError); return null; }

      // Copy growth records
      const { data: sourceRecords } = await sb
        .from('growth_records')
        .select('*')
        .eq('baby_id', babyId);
      if (sourceRecords && sourceRecords.length > 0) {
        const newRecords = sourceRecords.map((r: Record<string, unknown>) => ({
          id: generateId(),
          baby_id: newBabyId,
          date: r.date,
          weight: r.weight,
          height: r.height,
          head_circumference: r.head_circumference,
        }));
        const { error: recError } = await sb.from('growth_records').insert(newRecords);
        if (recError) console.error('Failed to copy records:', recError);
      }

      const ids = getMyBabyIds();
      ids.push(newBabyId);
      saveMyBabyIds(ids);
      await refreshBabies();
      return { ...baby, id: newBabyId };
    }
  }, [fetchBabyById, refreshBabies]);

  return (
    <DataContext.Provider value={{
      isSupabase,
      babies,
      loading,
      addBaby,
      updateBaby,
      removeBaby,
      getGrowthRecords,
      addGrowthRecord,
      updateGrowthRecord,
      removeGrowthRecord,
      refreshBabies,
      importBabyById,
      fetchBabyById,
      getBabyAvatar,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
