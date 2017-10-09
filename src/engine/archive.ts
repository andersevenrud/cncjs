/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import JSZip, { OutputType } from 'jszip';
import EventEmitter from 'eventemitter3';
import { fetchArrayBufferXHR } from './io';

export type DataArchiveType = ArrayBuffer | Blob | string | number[];


/**
 * Data archive
 */
export class DataArchive extends EventEmitter {
  private readonly source: string;
  private readonly type: string;
  private archive?: JSZip;
  private readonly cache: Map<string, any> = new Map();
  private readonly busy: Map<string, Promise<any>> = new Map();

  public constructor(source: string, type: string = 'zip') {
    super();
    this.source = source;
    this.type = type;
  }

  /**
   * Clears cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Fetches the data archive
   */
  public async fetch(): Promise<void> {
    const zip = new JSZip();
    const arrayBuffer = await fetchArrayBufferXHR(this.source, this);
    const blob = new Blob([arrayBuffer], { type: 'application/zip' });

    this.archive = await zip.loadAsync(blob);
  }

  /**
   * Extracts file from archive
   */
  private async extractFile(filename: string, type: OutputType): Promise<DataArchiveType> {
    const result = await this.archive!
      .file(filename)
      .async(type);

    this.cache.set(filename, result);

    return result;
  }

  /**
   * Extract from archive
   */
  public async extract(filename: string, type: OutputType): Promise<DataArchiveType> {
    if (this.cache.has(filename)) {
      return this.cache.get(filename);
    }

    if (this.busy.has(filename)) {
      return this.busy.get(filename);
    }

    const promise = this.extractFile(filename, type);
    this.busy.set(filename, promise);

    console.debug('DataArchive::extract()', filename);

    let result;
    try {
      result = await promise;
    } catch (e) {
      console.error(e);
    } finally {
      this.busy.delete(filename);
    }

    return result as DataArchiveType;
  }
}
