
export type DotState = boolean[]; // Array of 6 booleans representing dots 1-6

export interface BrailleCharacter {
  kana: string;
  dotsList: DotState[]; 
  unicode: string;
}

export enum LessonType {
  BASICS = '基礎',
  VOWELS = '母音',
  CONSONANTS = '子音',
  DAKUON = '濁音・半濁音',
  YOON = '拗音',
  SPECIAL = '特殊な音（長音・促音）',
  NUMBERS = '数字',
  ALPHABET = 'アルファベット',
  BUSINESS = 'ビジネス点字の決まり'
}

export enum QuizLevel {
  BEGINNER = 'レベル1: 初級 (基礎・数字)',
  INTERMEDIATE = 'レベル2: 中級 (特殊音・長音)',
  ADVANCED = 'レベル3: 上級 (ビジネス・複合)'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  questionType: 'text' | 'braille';
  optionType: 'text' | 'braille';
}
