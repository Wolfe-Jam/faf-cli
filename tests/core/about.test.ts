import { describe, test, expect } from 'bun:test';
import { aboutFromYaml, isAboutFaf, REPRESENTS_RE } from '../../src/core/about.js';

describe('BRAKE: about is a repo role, not an app_type', () => {
  test('aboutFromYaml reads represents + source_score from the about: block', () => {
    const yaml = `project:\n  name: x\nabout:\n  represents: Wolfe-Jam/xai-faf-rag\n  source_score: 50\n`;
    expect(aboutFromYaml(yaml)).toEqual({
      represents: 'Wolfe-Jam/xai-faf-rag',
      sourceScore: 50,
    });
  });

  test('app_type: about without about: block is not About', () => {
    const yaml = `app_type: about\nproject:\n  name: x\n`;
    expect(aboutFromYaml(yaml)).toBeNull();
  });

  test('missing source_score → sourceScore -1', () => {
    const yaml = `about:\n  represents: owner/repo\n`;
    expect(aboutFromYaml(yaml)?.sourceScore).toBe(-1);
  });

  test('isAboutFaf requires represents', () => {
    expect(isAboutFaf({ about: { represents: 'a/b' } })).toBe(true);
    expect(isAboutFaf({ about: { represents: '' } })).toBe(false);
    expect(isAboutFaf({ about: {} })).toBe(false);
    expect(isAboutFaf({})).toBe(false);
  });

  test('REPRESENTS_RE is owner/repo', () => {
    expect(REPRESENTS_RE.test('Wolfe-Jam/xai-faf-rag')).toBe(true);
    expect(REPRESENTS_RE.test('noslash')).toBe(false);
  });
});
