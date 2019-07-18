/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { Box, Animation, Sprite }  from '../../engine';
import { GameMapEntity, GameMapEntityAnimation } from './mapentity';
import { MIXGrid, MIXStructure, MIXStructureAnimation } from '../mix';
import { CELL_SIZE } from '../physics';
import { spriteFromName } from '../sprites';
import { BibEntity } from './bib';
import { Vector } from 'vector2d';

const DAMAGE_SUFFIX = ['', '-Damaged', '-Destroyed'];

/**
 * Structure Entity
 */
export class StructureEntity extends GameMapEntity {
  public readonly properties: MIXStructure = this.engine.mix.structures.get(this.data.name) as MIXStructure;
  protected zIndex: number = 1;
  protected directions: number = 8;
  protected dimension: Vector = new Vector(24, 24);
  protected animation: string = 'Idle';
  protected bibOffset: number = 0;
  protected bib?: BibEntity;
  protected constructing: boolean = true;
  protected repairSprite?: Sprite;
  protected repairAnimation?: Animation;
  protected overlaySprite?: Sprite;
  protected overlayAnimation?: Animation;
  protected constructionSprite?: Sprite;
  protected constructionAnimation?: Animation;
  protected reportDestroy?: string = 'CRUMBLE';
  protected occupy?: MIXGrid = {
    name: '',
    grid: [['x']]
  };

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'structure'
    };
  }

  public async init(): Promise<void> {
    await super.init();

    const size = this.properties!.Dimensions.clone() as Vector;
    this.dimension = size.mulS(CELL_SIZE);

    const name = `${this.data.name}_Idle`;
    const anim = this.engine.mix.structureAnimations.get(name) as MIXStructureAnimation;
    if (anim) {
      // FIXME
      const damageOffset = anim.StartFrame + anim.Frames;
      this.animations.set('Idle', new GameMapEntityAnimation(name, new Vector(0, anim.StartFrame), anim.Frames, 0.1, 0));
      this.animations.set('Idle-Damaged', new GameMapEntityAnimation(name, new Vector(0, anim.StartFrame + damageOffset), anim.Frames, 0.1, 0));
      this.animations.set('Idle-Destroyed', new GameMapEntityAnimation(name, new Vector(0, anim.StartFrame + (damageOffset * 2)), 1, 0.1, 0));
    }

    if (this.data.name === 'WEAP') {
      this.overlaySprite = spriteFromName(`CONQUER.MIX/weap2.png`);
      this.overlayAnimation = new Animation('Idle', new Vector(0, 0), this.overlaySprite.frames, 0.1, false);
      this.overlap = undefined;
      await this.engine.loadArchiveSprite(this.overlaySprite);
    }

    this.repairSprite = spriteFromName('CONQUER.MIX/select.png');
    await this.engine.loadArchiveSprite(this.repairSprite);
    this.repairAnimation = new Animation('repair-animation', new Vector(0, 2), 2, 0.05);

    if (!this.isCivilian() && !this.isWall()) {
      await this.initMake();
    }

    if (this.map.isCreated()) {
      this.playSfx('constru2');
    } else {
      this.constructing = false;
    }

    if (this.properties!.HasBib) {
      const size = this.properties!.Dimensions.clone() as Vector;
      this.bib = await BibEntity.createOrCache(this.engine, size, this.map.getTheatre());
    }

    this.hitPoints = this.properties!.HitPoints;
    if (!this.data.health) {
      this.health = this.hitPoints;
    }
  }

  protected async initMake(): Promise<void> {
    const spriteName = `CONQUER.MIX/${this.data.name.toLowerCase()}make.png`;
    const sprite = spriteFromName(spriteName);

    if (sprite.frames > 0) {
      try {
        await this.engine.loadArchiveSprite(sprite);

        this.constructionSprite = sprite;
        this.constructionAnimation = new Animation(this.data.name + 'MAKE', new Vector(0, 0), sprite.frames, 0.5);
        this.constructionAnimation.once('done', () => {
          this.constructing = false;
        });
      } catch (e) {
        console.error('StructureEntity::initConstruct()', e);
      }
    }
  }

  public repair(): void {
    if (this.isRepairable()) {
      this.repairing = !this.repairing;
    }
  }

  public sell(): void {
    this.reportDestroy = undefined;

    if (this.isPlayer()) {
      this.player!.addCredits(
        this.properties.Cost / 2
      );
    }

    if (this.constructionAnimation) {
      this.constructing = true;
      this.constructionAnimation.reset();
      this.constructionAnimation.setReversed(true);
      this.constructionAnimation.once('done', () => {
        this.constructing = false;
        this.destroy();
      });
    } else {
      this.destroy();
    }

    this.engine.playArchiveSfx('SOUNDS.MIX/cashturn.wav', 'gui');
  }

  public updateWall(): void {
    if (this.sprite && this.isWall()) {
      const lastFrameIndex = this.frameOffset.y;

      const y = (true ? 0 : 16) + // FIXME
         this.getSimilarEntity(new Vector(0, -1), 1) + // top
         this.getSimilarEntity(new Vector(0, 1), 4) + // bottom
         this.getSimilarEntity(new Vector(-1, 0), 8) + // left
         this.getSimilarEntity(new Vector(1, 0), 2); // right

      if (y != lastFrameIndex) {
        this.direction = y;
        this.frameOffset.setY(y);
      }
    }
  }

  public onUpdate(deltaTime: number): void {
    const animation = this.animations.get(this.animation);
    const instance = this.constructing ? this.constructionAnimation : animation;

    if (instance) {
      instance.onUpdate();
      this.frame = instance.getFrameIndex(this.frameOffset);
    } else {
      // FIXME
      this.frame = this.frameOffset;
    }

    if (this.repairing) {
      this.repairAnimation!.onUpdate();

      // TODO: Sound
      // TODO: Check credits
      // TODO: Report credit drain
      this.health += 1;
      if (this.health >= this.hitPoints) {
        this.repairing = false;
      }
    }

    this.animation = 'Idle' + DAMAGE_SUFFIX[this.getDamageState()];
  }

  public onRender(deltaTime: number): void {
    const sprite = this.constructing ? this.constructionSprite : this.sprite;
    const context = this.map.objects.getContext();

    this.renderSprite(deltaTime, context, sprite);

    if (this.bib) {
      this.map.terrain.getContext().drawImage(this.bib.getCanvas(), this.position.x, this.position.y + this.bib.getOffset());
    }

    super.onRender(deltaTime);

    if (this.overlaySprite && !this.constructing) {
      this.renderSprite(deltaTime, this.map.overlay.getContext(), this.overlaySprite, new Vector(0, 0));// FIXME
    }

    if (this.repairing) {
      const f = this.repairAnimation!.getFrameIndex();
      const s = this.repairSprite!;
      const x = this.position.x + ((this.dimension.x / 2) - (s.size.x / 2));
      const y = this.position.y + ((this.dimension.y / 2) - (s.size.y / 2));
      s.render(f, new Vector(x, y), this.map.overlay.getContext());
    }
  }

  public getPowerProduction(): number {
    return this.properties.PowerProduction;
  }

  public getPowerDrain(): number {
    return this.properties.PowerDrain;
  }

  public getRenderBox(): Box {
    const box = this.getBox();
    if (this.bib) {
      box.y2 += CELL_SIZE;
    }

    return box;
  }

  public isSellable(): boolean {
    return this.isPlayer();
  }

  public isRepairable(): boolean {
    return this.isPlayer() && (this.health < this.hitPoints);
  }

  public isSelectable(): boolean {
    return this.properties!.Selectable;
  }

  public isStructure(): boolean {
    return true;
  }
}
