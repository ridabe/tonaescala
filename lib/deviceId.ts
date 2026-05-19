import * as Crypto from 'expo-crypto';
import { appStorage } from './storage';

const DEVICE_ID_KEY = 'tne_device_id';

export async function getOrCreateDeviceId(): Promise<string> {
  let id = await appStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await appStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
