'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Baby, GrowthRecord } from '@/lib/types';
import {
  configureCloudKit,
  setupAuth,
  saveBaby as cloudSaveBaby,
  fetchBabies as cloudFetchBabies,
  deleteBaby as cloudDeleteBaby,
  saveGrowthRecord as cloudSaveGrowthRecord,
  fetchGrowthRecords as cloudFetchGrowthRecords,
  deleteGrowthRecord as cloudDeleteGrowthRecord,
} from '@/lib/cloudkit';
import {
  getLocalBabies,
  saveLocalBaby,
  deleteLocalBaby,
  getLocalGrowthRecords,
  saveLocalGrowthRecord,
  deleteLocalGrowthRecord,
} from '@/lib/local-storage';

interface DataContextType {
  isCloudKitAvailable: boolean;
  isAuthenticated: boolean;
  userName: string | null;
  babies: Baby[];
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  addBaby: (baby: Baby) => Promise<Baby | null>;
  updateBaby: (baby: Baby) => Promise<Baby | null>;
  removeBaby: (recordName: string) => Promise<void>;
  getGrowthRecords: (babyId: string) => Promise<GrowthRecord[]>;
  addGrowthRecord: (record: GrowthRecord) => Promise<GrowthRecord | null>;
  updateGrowthRecord: (record: GrowthRecord) => Promise<GrowthRecord | null>;
  removeGrowthRecord: (recordName: string, babyId: string) => Promise<void>;
  refreshBabies: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isCloudKitAvailable, setIsCloudKitAvailable] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize CloudKit or fallback to local storage
  useEffect(() => {
    const init = async () => {
      try {
        configureCloudKit();
        const user = await setupAuth();
        if (user) {
          setIsCloudKitAvailable(true);
          setIsAuthenticated(true);
          setUserName(user.nameComponents?.givenName || 'User');
          const cloudBabies = await cloudFetchBabies();
          setBabies(cloudBabies);
        } else {
          // Use local storage
          setIsCloudKitAvailable(false);
          setIsAuthenticated(true); // Auto-auth for local mode
          setBabies(getLocalBabies());
        }
      } catch {
        setIsCloudKitAvailable(false);
        setIsAuthenticated(true);
        setBabies(getLocalBabies());
      }
      setLoading(false);
    };
    init();
  }, []);

  const signIn = useCallback(async () => {
    if (isCloudKitAvailable) {
      const user = await setupAuth();
      if (user) {
        setIsAuthenticated(true);
        setUserName(user.nameComponents?.givenName || 'User');
        const cloudBabies = await cloudFetchBabies();
        setBabies(cloudBabies);
      }
    } else {
      setIsAuthenticated(true);
      setBabies(getLocalBabies());
    }
  }, [isCloudKitAvailable]);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setUserName(null);
    setBabies([]);
  }, []);

  const refreshBabies = useCallback(async () => {
    if (isCloudKitAvailable) {
      const cloudBabies = await cloudFetchBabies();
      setBabies(cloudBabies);
    } else {
      setBabies(getLocalBabies());
    }
  }, [isCloudKitAvailable]);

  const addBaby = useCallback(async (baby: Baby): Promise<Baby | null> => {
    if (isCloudKitAvailable) {
      const saved = await cloudSaveBaby(baby);
      if (saved) {
        await refreshBabies();
        return saved;
      }
      return null;
    }
    const saved = saveLocalBaby(baby);
    setBabies(getLocalBabies());
    return saved;
  }, [isCloudKitAvailable, refreshBabies]);

  const updateBaby = useCallback(async (baby: Baby): Promise<Baby | null> => {
    if (isCloudKitAvailable) {
      const saved = await cloudSaveBaby(baby);
      if (saved) {
        await refreshBabies();
        return saved;
      }
      return null;
    }
    const saved = saveLocalBaby(baby);
    setBabies(getLocalBabies());
    return saved;
  }, [isCloudKitAvailable, refreshBabies]);

  const removeBaby = useCallback(async (recordName: string) => {
    if (isCloudKitAvailable) {
      await cloudDeleteBaby(recordName);
      await refreshBabies();
    } else {
      deleteLocalBaby(recordName);
      setBabies(getLocalBabies());
    }
  }, [isCloudKitAvailable, refreshBabies]);

  const getGrowthRecords = useCallback(async (babyId: string): Promise<GrowthRecord[]> => {
    if (isCloudKitAvailable) {
      return cloudFetchGrowthRecords(babyId);
    }
    return getLocalGrowthRecords(babyId);
  }, [isCloudKitAvailable]);

  const addGrowthRecord = useCallback(async (record: GrowthRecord): Promise<GrowthRecord | null> => {
    if (isCloudKitAvailable) {
      return cloudSaveGrowthRecord(record);
    }
    return saveLocalGrowthRecord(record);
  }, [isCloudKitAvailable]);

  const updateGrowthRecord = useCallback(async (record: GrowthRecord): Promise<GrowthRecord | null> => {
    if (isCloudKitAvailable) {
      return cloudSaveGrowthRecord(record);
    }
    return saveLocalGrowthRecord(record);
  }, [isCloudKitAvailable]);

  const removeGrowthRecord = useCallback(async (recordName: string) => {
    if (isCloudKitAvailable) {
      await cloudDeleteGrowthRecord(recordName);
    } else {
      deleteLocalGrowthRecord(recordName);
    }
  }, [isCloudKitAvailable]);

  return (
    <DataContext.Provider value={{
      isCloudKitAvailable,
      isAuthenticated,
      userName,
      babies,
      loading,
      signIn,
      signOut,
      addBaby,
      updateBaby,
      removeBaby,
      getGrowthRecords,
      addGrowthRecord,
      updateGrowthRecord,
      removeGrowthRecord,
      refreshBabies,
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
