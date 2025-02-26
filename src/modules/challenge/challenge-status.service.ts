import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';

type Filled = {
  word: number;
  position: number;
};

type ChallengeSnapshot = {
  locks: Array<number>;
  filled: Array<Filled>;
};

@Injectable()
export class ChallengeStatusService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  public async getSnapshot(challengeId: string): Promise<ChallengeSnapshot> {
    const locks = await this.#getLocks(challengeId);
    const filled = await this.#getFilled(challengeId);

    return { locks, filled };
  }

  public async addLock(challengeId: string, word: number): Promise<void> {
    const currentLocks = await this.#getLocks(challengeId);
    const key = this.#getLockKey(challengeId);
    await this.cacheManager.set(key, [...currentLocks, word]);
  }

  public async removeLock(challengeId: string, lock: number): Promise<void> {
    const currentLocks = await this.#getLocks(challengeId);
    const key = this.#getLockKey(challengeId);

    await this.cacheManager.set(
      key,
      currentLocks.filter((l) => l !== lock),
    );
  }

  public async addFilled(challengeId: string, filled: Filled): Promise<void> {
    const currentFilled = await this.#getFilled(challengeId);
    const key = this.#getFilledKey(challengeId);
    await this.cacheManager.set(key, [...currentFilled, filled]);
  }

  public async removeFilled(
    challengeId: string,
    position: number,
  ): Promise<void> {
    const currentFilled = await this.#getFilled(challengeId);
    const key = this.#getFilledKey(challengeId);
    await this.cacheManager.set(
      key,
      currentFilled.filter((f) => f.position !== position),
    );
  }

  public async deleteChallenge(challengeId: string): Promise<void> {
    const lockKey = this.#getLockKey(challengeId);
    const filledKey = this.#getFilledKey(challengeId);

    await this.cacheManager.del(lockKey);
    await this.cacheManager.del(filledKey);
  }

  #getLockKey(challengeId: string): string {
    return `challenge-locks:${challengeId}`;
  }

  #getFilledKey(challengeId: string): string {
    return `challenge-filled:${challengeId}`;
  }

  async #getLocks(challengeId: string): Promise<number[]> {
    const key = this.#getLockKey(challengeId);
    const cachedLocks = await this.cacheManager.get<number[]>(key);
    return cachedLocks ?? [];
  }

  async #getFilled(challengeId: string): Promise<Filled[]> {
    const filledKey = this.#getFilledKey(challengeId);
    const cachedFilled = await this.cacheManager.get<Filled[]>(filledKey);
    return cachedFilled ?? [];
  }
}
