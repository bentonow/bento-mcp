export type BentoSequence = {
  id?: string;
  prefix_id?: string;
  attributes?: {
    id?: string;
    prefix_id?: string;
    name?: string;
  };
};

type GetSequences = () => Promise<BentoSequence[] | null | undefined>;

type ResolveSequenceIdInput = {
  sequenceId?: string;
  sequenceName?: string;
  getSequences: GetSequences;
};

function normalizeName(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase();
}

export function isSequenceId(value: string | undefined): boolean {
  const trimmed = value?.trim();
  return Boolean(trimmed);
}

export function getSequenceId(sequence: BentoSequence): string | null {
  const candidates = [
    sequence.id,
    sequence.attributes?.id,
    sequence.prefix_id,
    sequence.attributes?.prefix_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return null;
}

export async function resolveSequenceId({
  sequenceId,
  sequenceName,
  getSequences,
}: ResolveSequenceIdInput): Promise<string | null> {
  const normalizedSequenceId = sequenceId?.trim();
  if (normalizedSequenceId) {
    return normalizedSequenceId;
  }

  const normalizedSequenceName = normalizeName(sequenceName);
  if (!normalizedSequenceName) {
    return null;
  }

  const sequences = await getSequences();
  if (!sequences || sequences.length === 0) {
    return null;
  }

  const match = sequences.find(
    (sequence) =>
      normalizeName(sequence.attributes?.name) === normalizedSequenceName,
  );

  if (!match) {
    return null;
  }

  return getSequenceId(match);
}
