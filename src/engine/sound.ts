/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { IODevice, CachedLoader, fetchArrayBuffer } from './io';
import { DataArchive } from './archive';
import { MusicPlaylist, MusicTrack } from './playlist';
import { Vector } from 'vector2d';
import { Core } from './core';

/**
 * Sound loder class interface
 */
export interface SoundLoader {
  fetch(source: string): Promise<AudioBuffer>;
}

/**
 * Sound Effect
 */
export interface SoundEffect {
  context: AudioBuffer;
  volume?: number;
  position?: Vector;
  repeat?: boolean;
  done?: Function;
  block?: boolean;
}

/**
 * Sound Node Map
 */
export interface SoundNodes {
  [Key: string]: GainNode;
}

/**
 * Sound Loader Base
 */
export abstract class BaseSoundLoader extends CachedLoader<AudioBuffer> {
  protected readonly engine: Core;

  public constructor(engine: Core) {
    super();
    this.engine = engine;
  }

  protected async load(source: string, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    return this.fetchResource(source, async (): Promise<AudioBuffer> => {
      const audioBuffer = await this.engine.sound.context.decodeAudioData(arrayBuffer);
      return audioBuffer;
    });
  }
}

/**
 * Sound Loader: Http
 */
export class HttpSoundLoader extends BaseSoundLoader implements SoundLoader {
  public async fetch(source: string): Promise<AudioBuffer> {
    return super.fetchResource(source, async (): Promise<AudioBuffer> => {
      const arrayBuffer = await fetchArrayBuffer(source);
      return this.load(source, arrayBuffer);
    });
  }
}

/**
 * Sound Loader: Archive
 */
export class DataArchiveSoundLoader extends BaseSoundLoader implements SoundLoader {
  protected archive: DataArchive;

  public constructor(engine: Core, archive: DataArchive) {
    super(engine);
    this.archive = archive;
  }

  public async fetch(source: string): Promise<AudioBuffer> {
    return super.fetchResource(source, async (): Promise<AudioBuffer> => {
      const arrayBuffer = await this.archive.extract(source, 'arraybuffer') as ArrayBuffer;
      return this.load(source, arrayBuffer);
    });
  }
}

/**
 * Sound Device
 */
export class SoundOutput extends IODevice {
  public readonly playlist: MusicPlaylist = new MusicPlaylist();
  public readonly context: AudioContext = new AudioContext();
  private readonly mainGainNode: GainNode = this.context.createGain();
  private readonly sfxGainNode: GainNode = this.context.createGain();
  private readonly guiGainNode: GainNode = this.context.createGain();
  private readonly soundQueue: Map<string, SoundEffect[]> = new Map();
  private readonly musicElement: HTMLAudioElement = document.createElement('audio');
  private musicGainNode: GainNode = this.context.createGain();
  private sfxNodes: SoundEffect[] = [];
  private position: Vector = new Vector(0, 0);
  private muted: boolean = false;

  protected nodes: SoundNodes = {
    sfx: this.sfxGainNode,
    music: this.musicGainNode,
    gui: this.guiGainNode
  };

  /**
   * Creates instance
   */
  public constructor(engine: Core) {
    super(engine);
    this.muted = engine.configuration.sound.muted;
  }

  /**
   * Destroys instance
   */
  public destroy(): void {
    this.clear();
  }

  /**
   * Clears states
   */
  public clear(): void {
    this.musicElement.pause();
    this.musicElement.src = '';
    this.playlist.clear();
    this.position = new Vector(0, 0);
  }

  /**
   * Updates contextual audio
   */
  public onUpdate(): void {
    this.context.listener.setPosition(
      this.position.x,
      this.position.y,
      0
    );
  }

  /**
   * Initializes sound output
   */
  public async init(): Promise<void> {
    console.debug('SoundOutput::init()', this);

    this.mainGainNode.connect(this.context.destination);

    this.playlist.on('stop', (): void => this.pauseMusic(true));
    this.playlist.on('pause', (state): void => this.pauseMusic(state));
    this.playlist.on('play', (index: number, track: MusicTrack): void => this.playMusic(track));

    this.musicGainNode = this.createMediaGainNode(this.musicElement);
    this.musicGainNode.connect(this.mainGainNode);
    this.musicGainNode.gain.value = this.engine.configuration.sound.musicVolume;
    this.nodes.music = this.musicGainNode;

    this.sfxGainNode.connect(this.mainGainNode);
    this.sfxGainNode.gain.value = this.engine.configuration.sound.sfxVolume;

    this.guiGainNode.connect(this.mainGainNode);
    this.guiGainNode.gain.value = this.engine.configuration.sound.guiVolume;

    this.musicElement.addEventListener('ended', (): void => {
      if (!this.playlist.paused) {
        this.playlist.next();
      }
    });

    this.setMuted(this.muted);
  }

  /**
   * Convert to string (for debugging)
   */
  public toString(): string {
    const status = `${this.context.state} ${this.context.sampleRate}hz ${this.context.currentTime.toFixed(1)}s`;
    const volumes = `Volume: ${this.mainGainNode.gain.value.toFixed(1)} / ${this.sfxGainNode.gain.value.toFixed(1)} / ${this.musicGainNode.gain.value.toFixed(1)}`;
    const music = `Music: ${this.playlist.toString()}`;
    const sfx = `SFX: ${this.sfxNodes.length} active`;

    return `${status}\n - ${volumes}\n - ${music}\n - ${sfx}`;
  }

  /**
   * Try to restore sound context
   */
  public restoreSound(): void {
    if (this.context.state === 'suspended') {
      // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
      this.context.resume()
        .catch((e): void => console.warn(e));
    }
  }

  /**
   * Creates new media gain node
   */
  public createMediaGainNode(media: any, volume: number = 1.0): GainNode {
    const source = this.context.createMediaElementSource(media);
    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(this.mainGainNode);
    source.connect(gainNode);
    return gainNode;
  }

  /**
   * Plays sound effect
   */
  public playSfx(sound: SoundEffect, node: string, queue?: string): void {
    if (queue) {
      this.playSfxQueued(sound, node, queue);
    } else {
      if (sound.block) {
        const found = this.sfxNodes.find(s => s.context === sound.context);
        if (found) {
          return;
        }
      }
      this.playSfxDirect(sound, node);
    }
  }

  /**
   * Queues a sound effect playback
   */
  protected playSfxQueued(sound: SoundEffect, node: string, queueName: string): void {
    const originalDone = sound.done || ((): void => {});

    if (!this.soundQueue.has(queueName)) {
      this.soundQueue.set(queueName, []);
    }

    const next = (): void => {
      const queue = this.soundQueue.get(queueName) as SoundEffect[];
      if (queue.length > 0) {
        this.playSfxDirect(queue[0], node);
      }
    };

    sound.done = (...args: any[]): void => {
      const queue = this.soundQueue.get(queueName) as SoundEffect[];
      const found = queue.findIndex((iter): boolean => iter === sound);
      if (found !== -1) {
        queue.splice(found, 1);
      }

      next();

      originalDone(...args);
    };

    const queue = this.soundQueue.get(queueName) as SoundEffect[];
    queue.push(sound);

    if (queue.length === 1) {
      next();
    }
  }

  /**
   * Plays sound effect immediately
   */
  protected playSfxDirect(sound: SoundEffect, node: string): void {
    console.debug('SoundOutput::_playSfx()', sound);

    const connectNode = this.nodes[node] || this.mainGainNode;
    const gainNode = this.context.createGain();
    gainNode.gain.value = sound.volume || this.engine.configuration.sound.sfxVolume;
    gainNode.connect(connectNode);

    const source = this.context.createBufferSource();
    source.buffer = sound.context;

    if (sound.position) {
      const panner = this.context.createPanner();
      panner.panningModel = 'HRTF';
      panner.maxDistance = 100000;
      panner.refDistance = 1000;
      panner.setPosition(sound.position.x, sound.position.y, 0);

      panner.connect(gainNode);
      source.connect(panner);
    } else {
      source.connect(gainNode);
    }

    this.sfxNodes.push(sound);

    source.addEventListener('ended', (): void => {
      const foundIndex = this.sfxNodes
        .findIndex((s: SoundEffect): boolean => s === sound);

      this.sfxNodes.splice(foundIndex, 1);

      if (typeof sound.done === 'function') {
        sound.done();
      }
    });

    source.start(0);
  }

  /**
   * Plays music track
   */
  private playMusic(track: MusicTrack): void {
    console.info('SoundOutput::playMusic()', track);

    this.musicElement.pause();
    this.musicElement.currentTime = 0;
    this.musicElement.src = track.source;
    this.musicElement.play()
      .catch((e: Error): void => console.warn('SoundOuput::playMusic()', e));
  }

  /**
   * Toggles music pause state
   */
  public pauseMusic(state: boolean = true): void {
    if (state) {
      this.musicElement.pause();
    } else {
      this.musicElement.play()
        .catch((e: Error): void => console.warn('SoundOuput::pauseMusic()', e));
    }
  }

  /**
   * Gets playlist
   */
  public getPlaylist(): MusicPlaylist {
    return this.playlist;
  }

  /**
   * Gets muted state
   */
  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Toggles muted state
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;

    this.mainGainNode.gain.value = this.muted ? 0.0 : 1.0;  // FIXME
  }

  /**
   * Sets main volume
   */
  public setVolume(volume: number, node?: string): void {
    if (this.muted) {
      return;
    }

    const ctx = this.nodes[node!] || this.mainGainNode;
    const val = Math.max(0.0, Math.min(1.0, volume));
    ctx.gain.value = val;
  }

  /**
   * Gets main volume
   */
  public getVolume(node?: string): number {
    const ctx = this.nodes[node!] || this.mainGainNode;
    return ctx.gain.value;
  }

  /**
   * Sets audio context position
   */
  public setContextPosition(position: Vector): void {
    this.position = position;
  }
}
