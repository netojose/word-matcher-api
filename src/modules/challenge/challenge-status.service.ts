import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';

type Filled = {
  wordPosition: number;
  position: number;
};

type ChallengeSnapshot = {
  locks: Array<number>;
  filled: Array<Filled>;
  submitted: boolean;
};

@Injectable()
export class ChallengeStatusService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  public async getSnapshot(challengeId: string): Promise<ChallengeSnapshot> {
    const locks = await this.#getLocks(challengeId);
    const filled = await this.#getFilled(challengeId);
    const submitted = await this.#getSubmitted(challengeId);

    return { locks, filled, submitted };
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
    const key = this.#getFilledKey(challengeId);
    const currentFilled = await this.#getFilled(challengeId);

    const wordPosition = currentFilled.find(
      (c) => c.position === position,
    ).wordPosition;
    await this.removeLock(challengeId, wordPosition);

    await this.cacheManager.set(
      key,
      currentFilled.filter((f) => f.position !== position),
    );
  }

  public async submit(challengeId: string): Promise<void> {
    const key = this.#getSubmittedKey(challengeId);
    await this.cacheManager.set(key, true);
  }

  public async deleteChallenge(challengeId: string): Promise<void> {
    const lockKey = this.#getLockKey(challengeId);
    const filledKey = this.#getFilledKey(challengeId);
    const submittedKey = this.#getSubmittedKey(challengeId);

    await this.cacheManager.del(lockKey);
    await this.cacheManager.del(filledKey);
    await this.cacheManager.del(submittedKey);
  }

  #getLockKey(challengeId: string): string {
    return `challenge-locks:${challengeId}`;
  }

  #getFilledKey(challengeId: string): string {
    return `challenge-filled:${challengeId}`;
  }

  #getSubmittedKey(challengeId: string): string {
    return `challenge-submitted:${challengeId}`;
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

  async #getSubmitted(challengeId: string): Promise<boolean> {
    const key = this.#getSubmittedKey(challengeId);
    const cachedSubmitted = await this.cacheManager.get<boolean>(key);
    return cachedSubmitted ?? false;
  }
}
