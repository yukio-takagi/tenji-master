
import { GoogleGenAI, Type } from "@google/genai";
import { QuizLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BRAILLE_REFERENCE_TABLE = `
【日本点字（6点）公式リファレンス】
1 4
2 5
3 6

あ: 1 / い: 1-2 / う: 1-4 / え: 1-2-4 / お: 2-4
か行: +6 / さ行: +5-6 / た行: +3-5 / な行: +3 / は行: +3-6 / ま行: +3-5-6 / ら行: +5
数字: 1=a, 2=b, 3=c, 4=d, 5=e, 6=f, 7=g, 8=h, 9=i, 0=j
数符: 3-4-5-6点
つなぎ符: 3-6点 (数字の後に「あ・ら行」「や・ゆ・よ・わ」が続く場合に必要)

【日本点字（6点）構成ルール】
・濁音: 5点 + 清音
・半濁音: 6点 + 清音
・拗音: 4点 + [あ・う・お段の文字]
・拗濁音: 4-5点 + [あ・う・お段の文字]
・拗半濁音: 4-6点 + [あ・う・お段の文字]
・促音(っ): 2点
・長音(ー): 2-5点
※拗音の例: 「じょ」は拗濁音符(4-5点)と「そ」の組み合わせ。
`;

export const getTutorExplanation = async (topic: string) => {
  const prompt = `あなたは点字講師です。正確なリファレンスに基づき、「${topic}」について初心者に分かりやすく解説してください。
  ${BRAILLE_REFERENCE_TABLE}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "解説の取得に失敗しました。";
  }
};

export const generateQuiz = async (level: QuizLevel) => {
  let levelInstruction = "";
  if (level === QuizLevel.BEGINNER) {
    levelInstruction = "初級：あ〜ら行の清音、および数字単体(1-9)の読み書きに限定してください。";
  } else if (level === QuizLevel.INTERMEDIATE) {
    levelInstruction = "中級：濁音、半濁音、拗音、長音（ー）、促音（っ）を中心に、少し複雑な単語を出題してください。";
  } else {
    levelInstruction = "上級：全範囲。特にビジネス用語（至急、弊社、見積など）や、「数字＋単位（例：100円、5個）」のような、つなぎ符(3点)の知識を問う実践的な問題を出してください。";
  }

  const prompt = `点字学習のための練習問題を【厳守：10問】作成してください。

  【最重要：回答形式のルール】
  1. questionType="braille" の場合の question フィールド、および optionType="braille" の場合の options 配列の各要素には、点字に変換したい「ひらがな・数字の文字列」【のみ】を入れてください。
     ❌ 絶対に禁止: "1 4 2 5 3 6" (ドット番号の列記), "あさ（点字）", "「100えん」"
     ✅ 正解: "あさ", "100えん", "3"
  2. options 配列には【必ず4つの異なる単語】を入れてください。余計な空白、記号、カッコ、説明は一切含めないでください。
  3. 【重複の絶対禁止】: 4つの選択肢は、ひらがな表記・意味・点字に変換した際の外見のすべてにおいて、互いに完全に異なるものにしてください。
  4. 選択肢の正解（answer）は、必ずoptions配列の中の1つと「文字単位で完全に」一致させてください。
  5. 1番目（インデックス0）を常に正解にする必要はありません。ランダムな位置に正解を配置してください。

  難易度設定：${levelInstruction}
  
  以下のタイプを混合してください：
  - 点字を読み取る問題 (questionType="braille", optionType="text")
  - テキストに合う点字構成を選ぶ問題 (questionType="text", optionType="braille")
  - ルール・知識問題 (questionType="text", optionType="text")
  
  出力はJSONのみ。10個のオブジェクトを含む配列を返してください。

  ${BRAILLE_REFERENCE_TABLE}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              questionType: { type: Type.STRING, enum: ["text", "braille"] },
              optionType: { type: Type.STRING, enum: ["text", "braille"] },
            },
            required: ["question", "options", "answer", "explanation", "questionType", "optionType"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Quiz generation error:", error);
    return [];
  }
};
