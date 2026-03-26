import { Baby, GrowthRecord } from './types';

// CloudKit JS configuration
// To use this app, you need to:
// 1. Create a CloudKit container in Apple Developer portal
// 2. Create an API token for web access
// 3. Set the environment variables below

declare global {
  interface Window {
    CloudKit: CloudKitStatic;
  }
}

interface CloudKitStatic {
  configure(options: CloudKitConfig): void;
  getDefaultContainer(): CloudKitContainer;
}

interface CloudKitConfig {
  containers: CloudKitContainerConfig[];
}

interface CloudKitContainerConfig {
  containerIdentifier: string;
  apiTokenAuth: {
    apiToken: string;
    persist: boolean;
    signInButton?: { id: string; theme: string };
    signOutButton?: { id: string; theme: string };
  };
  environment: string;
}

interface CloudKitContainer {
  setUpAuth(): Promise<CloudKitUserIdentity | null>;
  privateCloudDatabase: CloudKitDatabase;
  publicCloudDatabase: CloudKitDatabase;
  whenUserSignsIn(): Promise<CloudKitUserIdentity>;
  whenUserSignsOut(): Promise<void>;
}

interface CloudKitUserIdentity {
  userRecordName: string;
  nameComponents?: {
    givenName?: string;
    familyName?: string;
  };
  emailAddress?: string;
}

interface CloudKitDatabase {
  saveRecords(records: CloudKitRecord[]): Promise<CloudKitResponse>;
  fetchRecords(recordNames: string[]): Promise<CloudKitResponse>;
  performQuery(query: CloudKitQuery): Promise<CloudKitResponse>;
  deleteRecords(records: { recordName: string }[]): Promise<CloudKitResponse>;
}

interface CloudKitRecord {
  recordType: string;
  recordName?: string;
  fields: Record<string, { value: unknown }>;
  recordChangeTag?: string;
}

interface CloudKitQuery {
  recordType: string;
  filterBy?: Array<{
    fieldName: string;
    comparator: string;
    fieldValue: { value: unknown };
  }>;
  sortBy?: Array<{
    fieldName: string;
    ascending: boolean;
  }>;
}

interface CloudKitResponse {
  records: CloudKitResponseRecord[];
  hasErrors?: boolean;
}

interface CloudKitResponseRecord {
  recordName: string;
  recordType: string;
  fields: Record<string, { value: unknown }>;
  recordChangeTag: string;
}

let isConfigured = false;
let container: CloudKitContainer | null = null;

export function configureCloudKit(): void {
  if (isConfigured || typeof window === 'undefined' || !window.CloudKit) return;

  const containerIdentifier = process.env.NEXT_PUBLIC_CLOUDKIT_CONTAINER_ID || '';
  const apiToken = process.env.NEXT_PUBLIC_CLOUDKIT_API_TOKEN || '';
  const environment = process.env.NEXT_PUBLIC_CLOUDKIT_ENVIRONMENT || 'development';

  if (!containerIdentifier || !apiToken) {
    console.warn('CloudKit not configured: missing container ID or API token');
    return;
  }

  window.CloudKit.configure({
    containers: [{
      containerIdentifier,
      apiTokenAuth: {
        apiToken,
        persist: true,
        signInButton: { id: 'apple-sign-in-button', theme: 'black' },
        signOutButton: { id: 'apple-sign-out-button', theme: 'black' },
      },
      environment,
    }],
  });

  container = window.CloudKit.getDefaultContainer();
  isConfigured = true;
}

export function getContainer(): CloudKitContainer | null {
  return container;
}

export async function setupAuth(): Promise<CloudKitUserIdentity | null> {
  if (!container) return null;
  try {
    const userIdentity = await container.setUpAuth();
    return userIdentity;
  } catch {
    console.error('CloudKit auth setup failed');
    return null;
  }
}

export async function saveBaby(baby: Baby): Promise<Baby | null> {
  if (!container) return null;
  try {
    const record: CloudKitRecord = {
      recordType: 'Baby',
      fields: {
        name: { value: baby.name },
        birthDate: { value: new Date(baby.birthDate).getTime() },
        gender: { value: baby.gender },
        prematureBirthDate: { value: baby.prematureBirthDate ? new Date(baby.prematureBirthDate).getTime() : null },
      },
    };
    if (baby.recordName) {
      record.recordName = baby.recordName;
    }
    const response = await container.privateCloudDatabase.saveRecords([record]);
    if (response.records && response.records.length > 0) {
      return mapRecordToBaby(response.records[0]);
    }
    return null;
  } catch (e) {
    console.error('Failed to save baby:', e);
    return null;
  }
}

export async function fetchBabies(): Promise<Baby[]> {
  if (!container) return [];
  try {
    const response = await container.privateCloudDatabase.performQuery({
      recordType: 'Baby',
    });
    if (response.records) {
      return response.records.map(mapRecordToBaby);
    }
    return [];
  } catch (e) {
    console.error('Failed to fetch babies:', e);
    return [];
  }
}

export async function deleteBaby(recordName: string): Promise<boolean> {
  if (!container) return false;
  try {
    await container.privateCloudDatabase.deleteRecords([{ recordName }]);
    return true;
  } catch (e) {
    console.error('Failed to delete baby:', e);
    return false;
  }
}

export async function saveGrowthRecord(record: GrowthRecord): Promise<GrowthRecord | null> {
  if (!container) return null;
  try {
    const ckRecord: CloudKitRecord = {
      recordType: 'GrowthRecord',
      fields: {
        babyId: { value: record.babyId },
        date: { value: new Date(record.date).getTime() },
        weight: { value: record.weight ?? null },
        height: { value: record.height ?? null },
        headCircumference: { value: record.headCircumference ?? null },
      },
    };
    if (record.recordName) {
      ckRecord.recordName = record.recordName;
    }
    const response = await container.privateCloudDatabase.saveRecords([ckRecord]);
    if (response.records && response.records.length > 0) {
      return mapRecordToGrowthRecord(response.records[0]);
    }
    return null;
  } catch (e) {
    console.error('Failed to save growth record:', e);
    return null;
  }
}

export async function fetchGrowthRecords(babyId: string): Promise<GrowthRecord[]> {
  if (!container) return [];
  try {
    const response = await container.privateCloudDatabase.performQuery({
      recordType: 'GrowthRecord',
      filterBy: [{
        fieldName: 'babyId',
        comparator: 'EQUALS',
        fieldValue: { value: babyId },
      }],
      sortBy: [{
        fieldName: 'date',
        ascending: true,
      }],
    });
    if (response.records) {
      return response.records.map(mapRecordToGrowthRecord);
    }
    return [];
  } catch (e) {
    console.error('Failed to fetch growth records:', e);
    return [];
  }
}

export async function deleteGrowthRecord(recordName: string): Promise<boolean> {
  if (!container) return false;
  try {
    await container.privateCloudDatabase.deleteRecords([{ recordName }]);
    return true;
  } catch (e) {
    console.error('Failed to delete growth record:', e);
    return false;
  }
}

function mapRecordToBaby(record: CloudKitResponseRecord): Baby {
  const fields = record.fields;
  return {
    recordName: record.recordName,
    name: fields.name?.value as string || '',
    birthDate: new Date(fields.birthDate?.value as number).toISOString().split('T')[0],
    gender: (fields.gender?.value as string) === 'female' ? 'female' : 'male',
    prematureBirthDate: fields.prematureBirthDate?.value
      ? new Date(fields.prematureBirthDate.value as number).toISOString().split('T')[0]
      : undefined,
  };
}

function mapRecordToGrowthRecord(record: CloudKitResponseRecord): GrowthRecord {
  const fields = record.fields;
  return {
    recordName: record.recordName,
    babyId: fields.babyId?.value as string || '',
    date: new Date(fields.date?.value as number).toISOString().split('T')[0],
    weight: fields.weight?.value as number | undefined,
    height: fields.height?.value as number | undefined,
    headCircumference: fields.headCircumference?.value as number | undefined,
  };
}
