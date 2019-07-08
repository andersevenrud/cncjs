/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import EventEmitter from 'eventemitter3';

/**
 * Music track interface;
 */
export interface MusicTrack {
  source: string;
  title?: string;
  name?: string;
}

/**
 * Music Playlist
 */
export class MusicPlaylist extends EventEmitter {
  private list: MusicTrack[] = [];
  private shuffle: boolean = false;
  private loop: boolean = true;
  private currentIndex: number = -1;
  private isPaused: boolean = false;

  public constructor(list: MusicTrack[] = []) {
    super();
    this.setList(list);
  }

  /**
   * Convert to string (for debugging)
   */
  public toString(): string {
    const status = this.isPaused ? 'paused' : 'playing';
    const name = String(this.current ? this.current.title : undefined);
    const opts = [
      this.shuffle ? 'shuffle' : '',
      this.loop ? 'loop' : ''
    ].filter((item: any): boolean => !!item).join(' ');
    return `${status} (${opts}) "${name}" (${this.currentIndex + 1}/${this.list.length})`;
  }

  /**
   * Gets current index
   */
  public get index(): number {
    return this.currentIndex;
  }

  /**
   * Gets current size
   */
  public get size(): number {
    return this.list.length;
  }

  /**
   * Gets current track
   */
  public get current(): MusicTrack | undefined {
    return this.list[this.currentIndex];
  }

  /**
   * Gets paused state
   */
  public get paused(): boolean {
    return this.isPaused;
  }

  /**
   * Play current track
   */
  public play(track?: string): void {
    console.debug('MusicPlaylist::play()');

    this.isPaused = false;

    if (this.currentIndex !== -1) {
      this.emit('pause', false);
    } else {
      const foundIndex = track
        ? this.list.findIndex((item): boolean => item.name === track)
        : -1;

      if (foundIndex === -1) {
        this.next();
      } else {
        this.setIndex(foundIndex);
      }
    }
  }

  /**
   * Set paused state
   */
  public pause(state: boolean = true): void {
    console.debug('MusicPlaylist::pause()', state);

    this.isPaused = state;
    this.emit('pause', state);
  }

  /**
   * Play next track
   */
  public next(): void {
    console.debug('MusicPlaylist::next()');

    let newIndex = this.currentIndex + 1;
    if (newIndex > this.list.length - 1) {
      newIndex = this.loop ? 0 : -1;
    }

    this.setIndex(newIndex);
  }

  /**
   * Play previous track
   */
  public prev(): void {
    console.debug('MusicPlaylist::prev()');

    let newIndex = this.currentIndex - 1;
    if (newIndex < 0) {
      newIndex = this.loop ? this.list.length - 1 : -1;
    }

    this.setIndex(newIndex);
  }

  /**
   * Clears tracks
   */
  public clear(): void {
    console.debug('MusicPlaylist::clear()');

    this.currentIndex = -1;
    this.list = [];

    this.emit('stop');
  }

  /**
   * Sets track index
   */
  private setIndex(index: number): void {
    if (this.list[index]) {
      this.emit('play', this.currentIndex, this.list[index]);
      this.currentIndex = index;
    } else {
      this.currentIndex = -1;
    }
  }

  /**
   * Sets list
   */
  public setList(list: MusicTrack[] = []): void {
    console.debug('MusicPlaylist::setList()', list);

    this.clear();
    this.list = list;
  }
}
