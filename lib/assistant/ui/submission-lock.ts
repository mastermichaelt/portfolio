export type SubmissionLockState = {
  inFlight: boolean;
  ownerId: string | null;
};

export function tryAcquireSubmissionLock(
  lock: SubmissionLockState,
  createOwnerId: () => string,
): { acquired: true; ownerId: string } | { acquired: false } {
  if (lock.inFlight) {
    return { acquired: false };
  }
  const ownerId = createOwnerId();
  lock.inFlight = true;
  lock.ownerId = ownerId;
  return { acquired: true, ownerId };
}

/** Release only when this owner still holds the lock (not superseded by clear + new submit). */
export function releaseSubmissionLock(
  lock: SubmissionLockState,
  ownerId: string,
): void {
  if (lock.ownerId !== ownerId) {
    return;
  }
  lock.inFlight = false;
  lock.ownerId = null;
}

/** Clear conversation — immediate release so a new submit can start. */
export function forceReleaseSubmissionLock(lock: SubmissionLockState): void {
  lock.inFlight = false;
  lock.ownerId = null;
}
