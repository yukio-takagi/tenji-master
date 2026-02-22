
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

// 子音の加点規則
export const CONSONANT_DOTS: Record<string, DotState> = {
  'か': [false, false, false, false, false, true], // 6
  'さ': [false, false, false, false, true, true],  // 5,6
  'た': [false, false, true, false, true, false],  // 3,5
  'な': [false, false, true, false, false, false], // 3
  'は': [false, false, true, false, false, true],  // 3,6
  'ま': [false, false, true, false, true, true],   // 3,5,6
  'ら': [false, false, false, false, true, false], // 5
};

// 記号（前置符・特殊符）
export const MARKERS = {
  YOON: [false, false, false, true, false, false],      // 4
  DAKUON: [false, false, false, false, true, false],    // 5
  HANDAKUON: [false, false, false, false, false, true], // 6
  YOON_DAKUON: [false, false, false, true, true, false], // 4,5
  YOON_HANDAKUON: [false, false, false, true, false, true], // 4,6
  NUMBER_SIGN: [false, false, true, true, true, true],    // 3,4,5,6 (数符)
  TSUNAGI_FU: [false, false, true, false, false, true],  // 3,6 (つなぎ符)
};

// 数字 (1-0 は a-j と同じドットパターン)
export const NUMBERS: Record<string, DotState> = {
  '1': [true, false, false, false, false, false], // 1
  '2': [true, true, false, false, false, false],  // 1,2
  '3': [true, false, false, true, false, false],  // 1,4
  '4': [true, false, false, true, true, false],   // 1,4,5
  '5': [true, false, false, false, true, false],  // 1,5
  '6': [true, true, false, true, false, false],   // 1,2,4
  '7': [true, true, false, true, true, false],    // 1,2,4,5
  '8': [true, true, false, false, true, false],   // 1,2,5
  '9': [false, true, false, true, false, false],  // 2,4
  '0': [false, true, false, true, true, false],   // 2,4,5
};

export const generateBrailleMap = () => {
  const map: Record<string, DotState[]> = {};

  // 1. 清音 (あ〜ら行)
  const rows = [
    { kana: 'あいうえお', prefix: null },
    { kana: 'かきくけこ', prefix: 'か' },
    { kana: 'さしすせそ', prefix: 'さ' },
    { kana: 'たちつてと', prefix: 'た' },
    { kana: 'なにぬねの', prefix: 'な' },
    { kana: 'はひふへほ', prefix: 'は' },
    { kana: 'まみむめも', prefix: 'ま' },
    { kana: 'らりるれろ', prefix: 'ら' },
  ];

  rows.forEach(({ kana, prefix }) => {
    const vowelKeys = ['あ', 'い', 'う', 'え', 'お'];
    for (let i = 0; i < 5; i++) {
      const vDots = VOWELS[vowelKeys[i]];
      if (!prefix) {
        map[kana[i]] = [vDots];
      } else {
        const cDots = CONSONANT_DOTS[prefix];
        map[kana[i]] = [vDots.map((d, idx) => d || cDots[idx])];
      }
    }
  });

  // 2. 特殊な清音（独立構成）
  map['や'] = [[false, false, true, true, false, false]]; // 3,4
  map['ゆ'] = [[false, false, true, true, false, true]];  // 3,4,6
  map['よ'] = [[false, false, true, true, true, false]];  // 3,4,5
  map['わ'] = [[false, false, true, false, false, false]]; // 3
  map['を'] = [[false, false, true, false, true, false]];  // 3,5
  map['ん'] = [[false, false, true, false, true, true]];   // 3,5,6

  // 3. 濁音・半濁音 (2マス構成)
  const dakuonRows = [
    { row: 'かきくけこ', daku: 'がぎぐげご' },
    { row: 'さしすせそ', daku: 'ざじずぜぞ' },
    { row: 'たちつてと', daku: 'だぢづでど' },
    { row: 'はひふへほ', daku: 'ばびぶべぼ' },
  ];
  dakuonRows.forEach(({ row, daku }) => {
    for (let i = 0; i < 5; i++) {
      map[daku[i]] = [MARKERS.DAKUON, map[row[i]][0]];
    }
  });
  
  const handakuonRow = { row: 'はひふへほ', han: 'ぱぴぷぺぽ' };
  for (let i = 0; i < 5; i++) {
    map[handakuonRow.han[i]] = [MARKERS.HANDAKUON, map[handakuonRow.row[i]][0]];
  }

  // 4. 拗音、拗濁音、拗半濁音 (2マス構成)
  const yoonGroups = [
    { base: 'かきくけこ', daku: 'がぎぐげご', yoon: ['きゃ', 'きゅ', 'きょ'], dyoon: ['ぎゃ', 'ぎゅ', 'ぎょ'] },
    { base: 'さしすせそ', daku: 'ざじずぜぞ', yoon: ['しゃ', 'しゅ', 'しょ'], dyoon: ['じゃ', 'じゅ', 'じょ'] },
    { base: 'たちつてと', daku: 'だぢづでど', yoon: ['ちゃ', 'ちゅ', 'ちょ'], dyoon: ['ぢゃ', 'ぢゅ', 'ぢょ'] },
    { base: 'なにぬねの', daku: '', yoon: ['にゃ', 'にゅ', 'にょ'], dyoon: [] },
    { base: 'はひふへほ', daku: 'ばびぶべぼ', yoon: ['ひゃ', 'ひゅ', 'ひょ'], dyoon: ['びゃ', 'びゅ', 'びょ'], pyoon: ['ぴゃ', 'ぴゅ', 'ぴょ'] },
    { base: 'まみむめも', daku: '', yoon: ['みゃ', 'みゅ', 'みょ'], dyoon: [] },
    { base: 'らりるれろ', daku: '', yoon: ['りゃ', 'りゅ', 'りょ'], dyoon: [] },
  ];

  yoonGroups.forEach(({ base, yoon, dyoon, pyoon }) => {
    map[yoon[0]] = [MARKERS.YOON, map[base[0]][0]];
    map[yoon[1]] = [MARKERS.YOON, map[base[2]][0]];
    map[yoon[2]] = [MARKERS.YOON, map[base[4]][0]];

    if (dyoon && dyoon.length > 0) {
      map[dyoon[0]] = [MARKERS.YOON_DAKUON, map[base[0]][0]];
      map[dyoon[1]] = [MARKERS.YOON_DAKUON, map[base[2]][0]];
      map[dyoon[2]] = [MARKERS.YOON_DAKUON, map[base[4]][0]];
    }

    if (pyoon && pyoon.length > 0) {
      map[pyoon[0]] = [MARKERS.YOON_HANDAKUON, map[base[0]][0]];
      map[pyoon[1]] = [MARKERS.YOON_HANDAKUON, map[base[2]][0]];
      map[pyoon[2]] = [MARKERS.YOON_HANDAKUON, map[base[4]][0]];
    }
  });

  // 5. 特殊な音
  map['ー'] = [[false, true, false, false, true, false]]; // 2,5
  map['っ'] = [[false, true, false, false, false, false]]; // 2

  // 6. 数字 (数符はアプリ側で自動挿入するため、ここでは数字単体のみ)
  Object.keys(NUMBERS).forEach(n => {
    map[n] = [NUMBERS[n]];
  });

  return map;
};

export const KANA_BRAILLE_MAP = generateBrailleMap();

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
