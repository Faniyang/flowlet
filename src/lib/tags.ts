export interface ParsedNote {
  note: string;
  tags: string[];
}

const TAG_REGEX = /#([^\s#]+)/g;

export function extractTags(raw: string): ParsedNote {
  const seen = new Set<string>();
  for (const match of raw.matchAll(TAG_REGEX)) {
    const tag = match[1].trim();
    if (tag) seen.add(tag);
  }
  const note = raw.replace(TAG_REGEX, '').replace(/\s+/g, ' ').trim();
  return {
    note,
    tags: Array.from(seen),
  };
}

export function formatNoteWithTags(note: string, tags: string[]): string {
  const parts: string[] = [];
  if (note.trim()) parts.push(note.trim());
  for (const tag of tags) {
    if (tag.trim()) parts.push(`#${tag.trim()}`);
  }
  return parts.join(' ');
}
