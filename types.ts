
export type DotState = boolean[]; // Array of 6 booleans representing dots 1-6

export interface BrailleCharacter {
  kana: string;
  dots: DotState;
  unicode: string;
}

export enum LessonType {
  BASICS = '基礎',
  VOWELS = '母音',
  CONSONANTS = '子音',
  DAKUON = '濁音・半濁音',
  YOON = '拗音',
  NUMBERS = '数字',
  ALPHABET = 'アルファベット',
  BUSINESS = 'ビジネス点字の決まり'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}
