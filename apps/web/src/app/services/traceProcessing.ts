import {
  HyperionAction,
  HyperionReceipt,
  toNumeric,
} from "../types/blockchain";

const toNumber = toNumeric;

export const getRepeatChunkLength = (receivers: string[]) => {
  const total = receivers.length;
  if (total < 2) {
    return total;
  }
  for (let length = 1; length <= total / 2; length++) {
    if (total % length !== 0) {
      continue;
    }
    let matches = true;
    for (let i = length; i < total; i++) {
      if (receivers[i] !== receivers[i % length]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return length;
    }
  }
  return total;
};

type SplitInfo = {
  actionOrdinal: number;
  receiptGlobalSequences: Set<number>;
  minReceiptGlobalSequence: number;
  maxReceiptGlobalSequence: number;
};

const claimNotificationOrdinals = (
  baseOrdinal: number,
  receiptCount: number,
  usedOrdinals: Set<number>,
) => {
  const ordinals = [baseOrdinal];
  for (let i = 1; i < receiptCount; i++) {
    let candidate = baseOrdinal + 1;
    while (usedOrdinals.has(candidate)) candidate++;
    usedOrdinals.add(candidate);
    ordinals.push(candidate);
  }
  return ordinals;
};

export const processTraces = (actions: HyperionAction[]) => {
  const sortedActions = [...actions].sort(
    (a, b) => toNumber(a.global_sequence) - toNumber(b.global_sequence),
  );

  const usedOrdinals = new Set<number>();
  for (const action of sortedActions) {
    usedOrdinals.add(toNumber(action.action_ordinal));
  }

  const ordinalOwner = new Map<number, number>();
  const splitMap = new Map<number, SplitInfo[]>();
  const processedTraces: HyperionAction[] = [];

  const registerOrdinals = (primaryOrdinal: number, ordinals: number[]) => {
    for (const ordinal of ordinals) {
      ordinalOwner.set(ordinal, primaryOrdinal);
    }
  };

  for (const action of sortedActions) {
    const receipts = action.receipts || [];
    const receivers = receipts.map(
      (receipt: HyperionReceipt) =>
        receipt.receiver?.toString?.() ?? String(receipt.receiver),
    );
    const chunkLength = getRepeatChunkLength(receivers);
    const splitCount =
      chunkLength > 0 ? Math.floor(receipts.length / chunkLength) : 1;
    const baseOrdinal = toNumber(action.action_ordinal);

    if (splitCount <= 1 || receipts.length === 0) {
      const ordinals = claimNotificationOrdinals(
        baseOrdinal,
        receipts.length,
        usedOrdinals,
      );
      const newTrace = { ...action, action_ordinals: ordinals };
      registerOrdinals(baseOrdinal, ordinals);
      processedTraces.push(newTrace);
      continue;
    }

    const splitInfos: SplitInfo[] = [];
    let lastClaimedOrdinal = baseOrdinal - 1;

    for (let i = 0; i < splitCount; i++) {
      let chunkOrdinal = lastClaimedOrdinal + 1;
      while (usedOrdinals.has(chunkOrdinal)) chunkOrdinal++;
      usedOrdinals.add(chunkOrdinal);

      const chunkReceipts = receipts.slice(
        i * chunkLength,
        (i + 1) * chunkLength,
      );
      const chunkOrdinals = claimNotificationOrdinals(
        chunkOrdinal,
        chunkReceipts.length,
        usedOrdinals,
      );
      lastClaimedOrdinal = chunkOrdinals[chunkOrdinals.length - 1];

      const chunkGlobalSequences = chunkReceipts.map((receipt: HyperionReceipt) =>
        toNumber(receipt.global_sequence),
      );
      const minReceiptGlobalSequence = Math.min(...chunkGlobalSequences);
      const maxReceiptGlobalSequence = Math.max(...chunkGlobalSequences);

      const newTrace = {
        ...action,
        receipts: chunkReceipts,
        action_ordinal: chunkOrdinal,
        global_sequence:
          chunkReceipts[0]?.global_sequence ?? action.global_sequence,
        action_ordinals: chunkOrdinals,
      };
      registerOrdinals(chunkOrdinal, chunkOrdinals);
      processedTraces.push(newTrace);
      splitInfos.push({
        actionOrdinal: chunkOrdinal,
        receiptGlobalSequences: new Set(chunkGlobalSequences),
        minReceiptGlobalSequence,
        maxReceiptGlobalSequence,
      });
    }

    splitMap.set(baseOrdinal, splitInfos);
  }

  for (const trace of processedTraces) {
    let creatorOrdinal = toNumber(trace.creator_action_ordinal);
    if (!creatorOrdinal) {
      continue;
    }

    if (splitMap.has(creatorOrdinal)) {
      const splitInfos = splitMap.get(creatorOrdinal) || [];
      const actionGlobalSequence = toNumber(trace.global_sequence);

      let matched = splitInfos.find((splitInfo) =>
        splitInfo.receiptGlobalSequences.has(actionGlobalSequence),
      );

      if (!matched) {
        matched = splitInfos.find(
          (splitInfo) =>
            actionGlobalSequence >= splitInfo.minReceiptGlobalSequence &&
            actionGlobalSequence <= splitInfo.maxReceiptGlobalSequence,
        );
      }

      if (!matched) {
        matched = splitInfos[0];
      }

      if (matched && matched.actionOrdinal !== creatorOrdinal) {
        trace.creator_action_ordinal = matched.actionOrdinal;
        creatorOrdinal = matched.actionOrdinal;
      }
    }

    const ownerPrimary = ordinalOwner.get(creatorOrdinal);
    if (ownerPrimary !== undefined && ownerPrimary !== creatorOrdinal) {
      trace.creator_action_ordinal = ownerPrimary;
    }
  }

  processedTraces.sort(
    (a, b) => toNumber(a.global_sequence) - toNumber(b.global_sequence),
  );

  return processedTraces;
};
