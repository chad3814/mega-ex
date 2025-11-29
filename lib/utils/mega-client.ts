'use client';

import { File } from 'megajs';
import { parseFileInfo, ParsedFileInfo } from './file-parser';

export interface MegaFileItem extends ParsedFileInfo {
  url: string;
  size: number;
}

export interface MegaDirectoryItem {
  name: string;
  url: string;
  type: 'directory';
}

export type MegaItem = MegaFileItem | MegaDirectoryItem;

export async function processMegaUrl(url: string, path?: string): Promise<MegaItem[]> {
  try {
    const file = File.fromURL(url);

    await new Promise<void>((resolve, reject) => {
      file.loadAttributes((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    if (file.directory) {
      return processDirectory(file, url, path || '');
    } else {
      const items: MegaItem[] = [];
      if (file.name && file.name.toLowerCase().endsWith('.mp4')) {
        const parsed = parseFileInfo(file.name, '');
        items.push({
          ...parsed,
          url,
          size: file.size || 0,
        });
      }
      return items;
    }
  } catch (error) {
    console.error('Error processing mega URL:', error);
    throw error;
  }
}

function processDirectory(directory: File, baseUrl: string, currentPath: string): MegaItem[] {
  const items: MegaItem[] = [];

  if (!directory.children) return items;

  const children = Object.values(directory.children);

  for (const child of children) {
    const childNode = child as File;

    if (childNode.directory) {
      // Build the path for this subdirectory
      const childPath = currentPath ? `${currentPath}/${childNode.name}` : childNode.name;

      items.push({
        name: childNode.name || 'Unnamed',
        url: childPath || '',
        type: 'directory',
      });
    } else if (childNode.name && childNode.name.toLowerCase().endsWith('.mp4')) {
      const parsed = parseFileInfo(childNode.name, currentPath);
      items.push({
        ...parsed,
        url: childNode.name || '',
        size: childNode.size || 0,
      });
    }
  }

  return items;
}

export function isMegaDirectory(item: MegaItem): item is MegaDirectoryItem {
  return 'type' in item && item.type === 'directory';
}

export function isMegaFile(item: MegaItem): item is MegaFileItem {
  return !('type' in item);
}
