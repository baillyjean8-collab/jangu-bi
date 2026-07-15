'use strict';

// Registre en memoire des invites approuves a publier leur camera/micro
// dans un direct. Cle: liveId, valeur: Set d'userId approuves.
const approvedGuests = new Map();

function approve(liveId, userId) {
  if (!approvedGuests.has(liveId)) approvedGuests.set(liveId, new Set());
  approvedGuests.get(liveId).add(String(userId));
}

function isApproved(liveId, userId) {
  const set = approvedGuests.get(liveId);
  return !!set && set.has(String(userId));
}

function revoke(liveId, userId) {
  const set = approvedGuests.get(liveId);
  if (set) set.delete(String(userId));
}

function clear(liveId) {
  approvedGuests.delete(liveId);
}

module.exports = { approve, isApproved, revoke, clear };
