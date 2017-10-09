/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { DataArchive } from './archive';
import { CachedLoader, fetchImage } from './io';

export interface ImageLoader {
  fetch(source: string): Promise<HTMLImageElement>;
}

/**
 * Image Loader: Http
 */
export class HttpImageLoader extends CachedLoader<HTMLImageElement> implements ImageLoader {
  /**
   * Fetches image
   */
  public async fetch(source: string): Promise<HTMLImageElement> {
    return super.fetchResource(source, (): Promise<HTMLImageElement> => fetchImage(source));
  }
}

/**
 * Image Loader: Archive
 */
export class DataArchiveImageLoader extends CachedLoader<HTMLImageElement> implements ImageLoader {
  protected archive: DataArchive;

  public constructor(archive: DataArchive) {
    super();
    this.archive = archive;
  }

  /**
   * Fetches image
   */
  public async fetch(source: string): Promise<HTMLImageElement> {
    return super.fetchResource(source, async (): Promise<HTMLImageElement> => {
      const blob: Blob = await this.archive.extract(source, 'blob') as Blob;
      const url = URL.createObjectURL(blob);
      const image = await fetchImage(url);
      URL.revokeObjectURL(url);
      return image;
    });
  }
}
