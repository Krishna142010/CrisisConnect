import Dexie, { Table } from 'dexie';
import { Incident, Resource } from '../types';

export class CrisisDatabase extends Dexie {
  incidents!: Table<Incident, string>;
  outbox!: Table<any, number>;
  resources!: Table<Resource, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('CrisisConnectDB');
    
    this.version(1).stores({
      incidents: 'id, status, triage.priority, createdAt',
      outbox: '++localId, id, synced, createdAt',
      resources: 'id, isActive',
      settings: 'key'
    });
  }
}

export const db = new CrisisDatabase();

export const saveIncident = async (incident: Incident): Promise<void> => {
  try {
    await db.incidents.put(incident);
  } catch (error) {
    console.error('Failed to save incident locally', error);
  }
};

export const getAllIncidents = async (): Promise<Incident[]> => {
  try {
    return await db.incidents.toArray();
  } catch (error) {
    console.error('Failed to get incidents', error);
    return [];
  }
};

export const saveResource = async (resource: Resource): Promise<void> => {
  try {
    await db.resources.put(resource);
  } catch (error) {
    console.error('Failed to save resource locally', error);
  }
};

export const getAllResources = async (): Promise<Resource[]> => {
  try {
    return await db.resources.toArray();
  } catch (error) {
    console.error('Failed to get resources', error);
    return [];
  }
};

export const queueOfflineReport = async (report: any): Promise<void> => {
  try {
    await db.outbox.add({
      ...report,
      synced: 0,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('Failed to queue offline report', error);
  }
};

export const getPendingSyncCount = async (): Promise<number> => {
  try {
    return await db.outbox.where('synced').equals(0).count();
  } catch (error) {
    console.error('Failed to get sync count', error);
    return 0;
  }
};

export const markSynced = async (localId: number): Promise<void> => {
  try {
    await db.outbox.update(localId, { synced: 1 });
  } catch (error) {
    console.error('Failed to mark synced', error);
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await db.incidents.clear();
    await db.outbox.clear();
    await db.resources.clear();
    await db.settings.clear();
  } catch (error) {
    console.error('Failed to clear database', error);
  }
};
