
import { DotState } from './types';

// Dot numbering logic:
// 1 4  -> index 0 3
// 2 5  -> index 1 4
// 3 6  -> index 2 5

export const VOWELS: Record<string, DotState> = {
  'あ': [true, false, false, false, false, false], // 1
  'い': [true, true, false, false, false, false],  // 1,2
  'う': [true, false, false, true, false, false],  // 1,4
  'え': [true, true, false, true, false, false],   // 1,2,4
  'お': [false, true, false, true, false, false],  // 2,4
};

// 子音の加点規則（日本点字標準）
export const CONSONANT_DOTS: Record<string, DotState> = {
  'か': [false, false, false, false, false, true], // 6
  'さ': [false, false, false, false, true, true],  // 5,6
  'た': [false, false, true, false, true, false],  // 3,5
  'な': [false, false, true, false, false, false], // 3
  'は': [false, false, true, false, false, true],  // 3,6
  'ま': [false, false, true, false, true, true],   // 3,5,6
  'ら': [false, false, false, false, true, false], // 5
};

// Logic for combining: Base Vowel dots + Consonant dots
export const generateGojuon = () => {
  const map: Record<string, DotState> = { ...VOWELS };
  
  // 1. 標準的な「母音＋子音」の加点ルールで生成
  const consonants = [
    { kana: 'かきくけこ', prefix: 'か' },
    { kana: 'さしすせそ', prefix: 'さ' },
    { kana: 'たちつてと', prefix: 'た' },
    { kana: 'なにぬねの', prefix: 'な' },
    { kana: 'はひふへほ', prefix: 'は' },
    { kana: 'まみむめも', prefix: 'ま' },
    { kana: 'らりるれろ', prefix: 'ら' },
  ];

  consonants.forEach(({ kana, prefix }) => {
    const vowelKeys = ['あ', 'い', 'う', 'え', 'お'];
    const prefixDots = CONSONANT_DOTS[prefix];
    for (let i = 0; i < 5; i++) {
      const vDots = VOWELS[vowelKeys[i]];
      const combined: DotState = vDots.map((d, idx) => d || prefixDots[idx]);
      map[kana[i]] = combined;
    }
  });

  // 2. 特殊な構成（独立配置）による上書き
  // これらは加点ルールに従わないため、個別に定義してマージする
  const specialCases: Record<string, DotState> = {
    'や': [false, false, true, true, false, false], // 3,4
    'ゆ': [false, false, true, true, false, true],  // 3,4,6
    'よ': [false, false, true, true, true, false], // 3,4,5
    'わ': [false, false, true, false, false, false], // 3
    'を': [false, false, true, false, true, false],  // 3,5 (正解に修正)
    'ん': [false, false, true, false, true, true],   // 3,5,6
  };

  return { ...map, ...specialCases };
};

export const KANA_BRAILLE_MAP = generateGojuon();

export const DOT_TO_UNICODE = (dots: DotState): string => {
  let offset = 0;
  if (dots[0]) offset += 1;
  if (dots[1]) offset += 2;
  if (dots[2]) offset += 4;
  if (dots[3]) offset += 8;
  if (dots[4]) offset += 16;
  if (dots[5]) offset += 32;
  return String.fromCharCode(0x2800 + offset);
};
