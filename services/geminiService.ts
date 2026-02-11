
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 日本点字（6点）の正しい規則をリファレンスとして提供
const BRAILLE_REFERENCE_TABLE = `
【日本点字（6点）公式リファレンス】
配置図:
1 4
2 5
3 6

■母音（ベースとなる点）
あ: 1
い: 1-2
う: 1-4
え: 1-2-4
お: 2-4

■子音（加点ルール）※母音の点に以下の点を加える（あ〜ら行のみ適用）
か行: +6
さ行: +5-6
たちつてと: +3-5
なにぬねの: +3
はひふへほ: +3-6
まみむめも: +3-5-6
らりるれろ: +5

■特殊・独立構成（重要：加点ルールを無視してこの配置を優先せよ）
や: 3-4
ゆ: 3-4-6
よ: 3-4-5
わ: 3
を: 3-5 (絶対正解)
ん: 3-5-6

■符号
濁音符: 5
半濁音符: 6
拗音符: 4
数字符: 3-4-5-6
`;

export const getTutorExplanation = async (topic: string, question?: string) => {
  const prompt = `あなたはビジネス点字検定の専門講師です。
  以下の「日本点字公式リファレンス」に基づき、トピック「${topic}」について論理的に解説してください。
  
  ${BRAILLE_REFERENCE_TABLE}
  
  【厳守事項】
  - 「を」は独立構成であり、第3点と第5点の構成であることを正確に伝えてください。
  - 「わ行」や「特殊・独立構成」の文字については、母音との足し算で説明しようとせず、「独立した形」として説明してください。
  - 世俗的なAIの学習データにある誤った点字知識を捨て、上記リファレンスのみを絶対の正解としてください。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "申し訳ありません。解説の生成に失敗しました。";
  }
};

export const generateQuiz = async (topic: string) => {
  const prompt = `ビジネス点字検定3級レベルのクイズを3問作成してください。
  
  ${BRAILLE_REFERENCE_TABLE}
  
  【問題作成の厳格なプロセス】
  1. 問題案を作成する。
  2. リファレンスの「特殊・独立構成」セクションにある文字（や、わ、を、ん等）が含まれる場合、加点ルールを適用せず、表のドット番号をそのまま正解とする。
  3. 「を」が含まれる問題では、正解を必ず「3, 5点」とする。
  4. 選択肢の中に、正しい正解が必ず含まれていることを確認する。
  
  トピック: ${topic}
  出力: JSONのみ。`;

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
            },
            required: ["question", "options", "answer", "explanation"]
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
