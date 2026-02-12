
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BRAILLE_REFERENCE_TABLE = `
【日本点字（6点）公式リファレンス：ビジネス点字検定準拠】

■ 基本構造 (1マス)
配置図：
1 4
2 5
3 6

■ 母音（すべての基本となる点）
あ: 1
い: 1-2
う: 1-4
え: 1-2-4
お: 2-4

■ 子音（加点ルール：あ〜ら行）
※「母音の点」に以下の「子音の点」を足し合わせたものが、その行の文字になる。
か行: +6
さ行: +5-6
た行: +3-5
な行: +3
は行: +3-6
ま行: +3-5-6
ら行: +5

【重要：加算済みの完成形リスト】
・か行：か(1,6), き(1,2,6), く(1,4,6),け(1,2,4,6), こ(2,4,6)
・さ行：さ(1,5,6), し(1,2,5,6), す(1,4,5,6), せ(1,2,4,5,6), そ(2,4,5,6)
・た行：た(1,3,5), ち(1,2,3,5), つ(1,3,4,5), て(1,2,3,4,5), と(2,3,4,5)
・な行：な(1,3), に(1,2,3), ぬ(1,3,4), ね(1,2,3,4), の(2,3,4)
・は行：は(1,3,6), ひ(1,2,3,6), ふ(1,3,4,6), へ(1,2,3,4,6), ほ(2,3,4,6)
・ま行：ま(1,3,5,6), み(1,2,3,5,6), む(1,3,4,5,6), め(1,2,3,4,5,6), も(2,3,4,5,6)
・ら行：ら(1,5), り(1,2,5), る(1,4,5), れ(1,2,4,5), ろ(2,4,5)

■ 独立構成文字
や: 3-4 / ゆ: 3-4-6 / よ: 3-4-5
わ: 3 / を: 3-5 / ん: 3-5-6

■ 特殊な音 (1マス)
・促音（っ）: 2点
・長音（ー）: 2-5点

■ 2マス構成の組み立て規則
1. 濁音（が・ば等）: [濁音符 5点] ＋ [清音の文字]
   例：が = [5] ＋ [か(1,6)]
2. 半濁音（ぱ・ぴ等）: [半濁音符 6点] ＋ [は行の文字]
   例：ぱ = [6] ＋ [は(1,3,6)]
3. 拗音（きゃ・しゅ・ちょ等）: [拗音符 4点] ＋ [その行の「あ・う・お」段の文字]
   例：きゃ = [4] ＋ [か(1,6)]
   例：きゅ = [4] ＋ [く(1,4,6)]
   例：きょ = [4] ＋ [こ(2,4,6)]
4. 拗濁音（ぎゃ・じゅ等）: [拗濁音符 4,5点] ＋ [その行の「あ・う・お」段の文字]
   例：ぎゃ = [4,5] ＋ [か(1,6)]
   例：じゅ = [4,5] ＋ [す(1,4,5,6)]
5. 拗半濁音（ぴゃ・ぴゅ等）: [拗半濁音符 4,6点] ＋ [は行の「あ・う・お」段の文字]
   例：ぴゃ = [4,6] ＋ [は(1,3,6)]
   例：ぴゅ = [4,6] ＋ [ふ(1,3,4,6)]

■ 前置符の一覧
1. 拗音符: 4点
2. 濁音符: 5点
3. 半濁音符: 6点
4. 拗濁音符: 4-5点
5. 拗半濁音符: 4-6点
`;

export const getTutorExplanation = async (topic: string) => {
  const prompt = `あなたは点字講師です。
  以下の正確なリファレンスに基づき、「${topic}」について初心者に分かりやすく解説してください。
  
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

export const generateQuiz = async (topic: string) => {
  const prompt = `ビジネス点字検定3級レベルのクイズを3問作成してください。
  
  以下の3つのタイプを必ず含めてください：
  1. 【点字を読み取る問題】 questionType="braille", optionType="text"
     questionには「ひらがな（例：きゅうきゅう）」を入れます。アプリ側でこれを点字画像に変換します。
     optionsには選択肢としての「ひらがな」を入れます。
  2. 【点字の構成を選ぶ問題】 questionType="text", optionType="braille"
     questionには「『コーヒー』の正しい点字構成はどれですか？」のようなテキストを入れます。
     optionsには、正解と紛らわしい誤答の「ひらがな（例：こーひー、こひー、ごひー）」を入れます。アプリ側でこれらを点字で表示します。
  3. 【ルール・知識問題】 questionType="text", optionType="text"
     点字のドット番号や前置符のルールに関する知識問題です。

  ${BRAILLE_REFERENCE_TABLE}
  
  【条件】
  - 3級合格に必須の「濁音」「拗音」「長音」「促音」を積極的に出題してください。
  - **重要：options配列内での正解（answer）の位置を必ずランダムにしてください。**
  - 出力はJSONのみ。`;

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
    console.error(error);
    return [];
  }
};
