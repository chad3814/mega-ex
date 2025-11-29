import { File } from 'megajs';
import { parseFileInfo, ParsedFileInfo } from './file-parser';

export interface MegaFileItem extends ParsedFileInfo {
  file: File;
}

export interface MegaDirectoryItem {
  name: string;
  file: File;
  type: 'directory';
}

export type MegaItem = MegaFileItem | MegaDirectoryItem;

export function getDirectoryContents(directory: File, pathSegments: string[] = []): MegaItem[] {
  if (!directory.directory) {
    throw new Error('Not a directory');
  }

  // Navigate to the target directory using path segments
  let current = directory;
  for (const segment of pathSegments) {
    if (!current.children) break;

    const child = Object.values(current.children).find(
      (c) => (c as File).name === segment
    ) as File | undefined;

    if (child && child.directory) {
      current = child;
    } else {
      throw new Error(`Path not found: ${pathSegments.join('/')}`);
    }
  }

  // Get contents of the current directory
  const items: MegaItem[] = [];

  if (!current.children) return items;

  for (const child of Object.values(current.children)) {
    const childFile = child as File;

    if (childFile.directory) {
      items.push({
        name: childFile.name || 'Unnamed',
        file: childFile,
        type: 'directory',
      });
    } else if (childFile.name && childFile.name.toLowerCase().endsWith('.mp4')) {
      const pathString = pathSegments.join('/');
      const parsed = parseFileInfo(childFile.name, pathString);
      items.push({
        ...parsed,
        file: childFile,
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
