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

export function getAllFilesRecursive(directory: File, pathSegments: string[] = []): MegaFileItem[] {
  if (!directory.directory || !directory.children) {
    return [];
  }

  const files: MegaFileItem[] = [];

  for (const child of Object.values(directory.children)) {
    const childFile = child as File;

    if (childFile.directory) {
      // Recursively get files from subdirectories
      const subFiles = getAllFilesRecursive(childFile, [...pathSegments, childFile.name || '']);
      files.push(...subFiles);
    } else if (childFile.name && childFile.name.toLowerCase().endsWith('.mp4')) {
      const pathString = pathSegments.join('/');
      const parsed = parseFileInfo(childFile.name, pathString);
      files.push({
        ...parsed,
        file: childFile,
      });
    }
  }

  return files;
}

export function getRecentlyAddedMovies(directory: File, limit: number = 20): MegaFileItem[] {
  const allFiles = getAllFilesRecursive(directory);
  // Treat 'unknown' as movies unless they have episode info
  const movies = allFiles.filter(item =>
    item.mediaType === 'movie' ||
    (item.mediaType === 'unknown' && !item.episodeInfo)
  );

  // Sort by timestamp (most recent first) and limit
  return movies
    .sort((a, b) => (b.file.timestamp || 0) - (a.file.timestamp || 0))
    .slice(0, limit);
}

export function getRecentlyAddedEpisodes(directory: File, limit: number = 20): MegaFileItem[] {
  const allFiles = getAllFilesRecursive(directory);
  const episodes = allFiles.filter(item => item.mediaType === 'tv');

  // Sort by timestamp (most recent first) and limit
  return episodes
    .sort((a, b) => (b.file.timestamp || 0) - (a.file.timestamp || 0))
    .slice(0, limit);
}
