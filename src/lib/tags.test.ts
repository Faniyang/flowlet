import { describe, expect, it } from 'vitest';
import { extractTags, formatNoteWithTags } from './tags';

describe('tags', () => {
  it('extracts deduplicated hashtags and cleans note whitespace', () => {
    expect(extractTags('和同事 #聚餐 火锅 #团建')).toEqual({
      note: '和同事 火锅',
      tags: ['聚餐', '团建'],
    });
    expect(extractTags('#聚餐 午饭 #聚餐')).toEqual({
      note: '午饭',
      tags: ['聚餐'],
    });
    expect(extractTags('纯备注无标签')).toEqual({
      note: '纯备注无标签',
      tags: [],
    });
    expect(extractTags('#旅行 #美食')).toEqual({
      note: '',
      tags: ['旅行', '美食'],
    });
  });

  it('formats note and tags back to editable text', () => {
    expect(formatNoteWithTags('午饭', ['聚餐', '同事'])).toBe('午饭 #聚餐 #同事');
    expect(formatNoteWithTags('', ['旅行'])).toBe('#旅行');
    expect(formatNoteWithTags('咖啡', [])).toBe('咖啡');
  });
});
