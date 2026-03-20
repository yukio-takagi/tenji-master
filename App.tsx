
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import BrailleCell from './components/BrailleCell';
import { KANA_BRAILLE_MAP, MARKERS } from './constants';
import { LessonType, QuizQuestion, DotState, QuizLevel } from './types';
import { getTutorExplanation, generateQuiz } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('study');
  const [inputText, setInputText] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null);
  const [tutorOutput, setTutorOutput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Quiz states
  const [quizLevel, setQuizLevel] = useState<QuizLevel | null>(null);
  const [quizList, setQuizList] = useState<QuizQuestion[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // 配列をシャッフルする関数
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // 文字列の正規化：空白、改行、特殊記号、カッコ、句読点などを徹底的に排除する
  const normalizeText = (text: string): string => {
    if (!text) return '';
    // 1. カタカナをひらがなに変換
    let result = text.replace(/[\u30a1-\u30f6]/g, (match) => {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
    });
    // 2. ひらがな、数字、長音(ー)、促音(っ) 以外の文字を削除
    result = result.replace(/[^\u3041-\u30960-9ー]/g, '');
    return result.trim();
  };

  // ビジネス点字翻訳エンジン (数符・つなぎ符対応)
  const tokenizeBraille = (text: string): DotState[][] => {
    const normalized = normalizeText(text);
    const result: DotState[][] = [];
    let i = 0;
    let isInsideNumber = false;
    
    while (i < normalized.length) {
      const char = normalized[i];
      const next = normalized[i + 1];
      
      // 1. 数字の処理
      if (/[0-9]/.test(char)) {
        if (!isInsideNumber) {
          result.push([MARKERS.NUMBER_SIGN]); // 数符を挿入
          isInsideNumber = true;
        }
        if (KANA_BRAILLE_MAP[char]) {
          result.push(KANA_BRAILLE_MAP[char]);
        }
        i++;
        continue;
      }

      // 数字が終わった後の処理
      if (isInsideNumber && !/[0-9]/.test(char)) {
        isInsideNumber = false;
        // ビジネス点字ルール: 数字の直後に「あ・ら行」が続く場合は「つなぎ符(3,6点)」が必要
        const targetRows = "あいうえおらりるれろ";
        if (targetRows.includes(char)) {
          result.push([MARKERS.TSUNAGI_FU]);
        }
      }
      
      // 2. 拗音のチェック
      if (next && ['ゃ', 'ゅ', 'ょ'].includes(next)) {
        const token = char + next;
        if (KANA_BRAILLE_MAP[token]) {
          result.push(KANA_BRAILLE_MAP[token]);
          i += 2;
          continue;
        }
      }
      
      // 3. 通常文字のチェック
      if (KANA_BRAILLE_MAP[char]) {
        result.push(KANA_BRAILLE_MAP[char]);
      }
      i++;
    }
    
    return result;
  };

  const handleLessonSelect = (lesson: LessonType) => {
    setSelectedLesson(lesson);
    setTutorOutput('');
    setActiveTab('tutor');
    setLoading(true);
    getTutorExplanation(lesson).then(res => {
      setTutorOutput(res);
      setLoading(false);
    });
  };

  const handleStartQuiz = (level: QuizLevel) => {
    setQuizLevel(level);
    setLoading(true);
    setQuizList([]);
    setCurrentQuizIdx(0);
    setCorrectCount(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setQuizFinished(false);
    
    generateQuiz(level).then(res => {
      if (!res || res.length === 0) {
        setLoading(false);
        return;
      }

      const processedQuizzes = res.map((q: QuizQuestion) => {
        // 1. 正規化して重複を排除
        const uniqueOptionsMap = new Map<string, string>();
        q.options.forEach(opt => {
          const norm = normalizeText(opt);
          // 文字列が空でなく、かつまだMapになければ追加
          if (norm && !uniqueOptionsMap.has(norm)) {
            uniqueOptionsMap.set(norm, opt);
          }
        });

        let finalOptions = Array.from(uniqueOptionsMap.values());
        
        // 2. 【安全装置】もし重複排除の結果、4つ未満になってしまった場合
        if (finalOptions.length < 4) {
          // 重複を許容してでも元の options から不足分を補充する（クイズの体裁を保つため）
          const fallbackOptions = [...q.options];
          finalOptions = fallbackOptions.slice(0, 4);
          
          // 正解がリストに含まれているか確認し、なければ強制的に入れる
          if (!finalOptions.some(opt => normalizeText(opt) === normalizeText(q.answer))) {
            finalOptions[0] = q.answer;
          }
        }

        // 3. 正解が含まれているか最終確認
        if (!finalOptions.some(opt => normalizeText(opt) === normalizeText(q.answer))) {
           // 万が一正解が含まれていなかったら差し替え
           finalOptions[0] = q.answer;
        }

        // 4. シャッフル
        return {
          ...q,
          options: shuffleArray(finalOptions)
        };
      });

      setQuizList(processedQuizzes);
      setLoading(false);
    });
  };

  const handleAnswerSelect = (opt: string) => {
    if (showResult) return;
    setSelectedAnswer(opt);
    setShowResult(true);

    const currentQuiz = quizList[currentQuizIdx];
    if (normalizeText(opt) === normalizeText(currentQuiz.answer)) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuizIdx < quizList.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setQuizLevel(null);
    setQuizList([]);
    setQuizFinished(false);
  };

  const renderBrailleSequence = (text: string, size: 'sm' | 'md' = 'sm') => {
    const tokenDots = tokenizeBraille(text);
    if (tokenDots.length === 0) {
      return <div className="p-4 text-slate-300 italic">点字なし</div>;
    }

    return (
      <div className="flex flex-wrap gap-2 justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
        {tokenDots.map((cellList, i) => (
          <div key={i} className="flex gap-1 items-center">
            {cellList.map((dots, idx) => (
              <BrailleCell key={`${i}-${idx}`} dots={dots} size={size} />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 md:pt-20 bg-slate-50">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'study' && (
          <div className="space-y-8 animate-fadeIn">
            <header className="text-center">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">点字学習を始めましょう</h1>
              <p className="text-slate-500 mt-2">トピックを選んでAI講師から学びましょう</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(LessonType).map((lesson) => (
                <button 
                  key={lesson}
                  onClick={() => handleLessonSelect(lesson)}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 text-left transition-all group"
                >
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{lesson}</h3>
                  <p className="text-sm text-slate-400 group-hover:text-indigo-400">学習を開始する →</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'converter' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold">ビジネス点字翻訳</h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="ひらがなや数字を入力してください（例：100えん、3びき）"
                className="w-full h-32 p-4 border border-slate-200 rounded-xl outline-none text-lg focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 min-h-[150px] flex flex-col">
              <h3 className="text-sm font-medium text-slate-500 mb-4">プレビュー (数符・つなぎ符自動挿入)</h3>
              <div className="flex-1 flex items-center justify-center">
                {inputText.trim() ? renderBrailleSequence(inputText, 'md') : <p className="text-slate-300 italic">入力待ち...</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            {quizLevel === null ? (
              <div className="text-center space-y-8 py-10">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900">レベル別・総合力テスト</h2>
                  <p className="text-slate-500">検定3級の合格ライン（8割）を目指して10問に挑戦！</p>
                </div>
                <div className="grid gap-4">
                  {Object.values(QuizLevel).map((level) => (
                    <button 
                      key={level}
                      onClick={() => handleStartQuiz(level)}
                      className="bg-white border-2 border-slate-200 p-6 rounded-2xl font-bold text-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left flex justify-between items-center group shadow-sm active:scale-95"
                    >
                      <span>{level}</span>
                      <span className="text-indigo-500 group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : quizFinished ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6 animate-fadeIn">
                <div className="text-6xl mb-4">
                  {correctCount >= 8 ? '🎉' : correctCount >= 5 ? '👍' : '📚'}
                </div>
                <h2 className="text-3xl font-black">テスト結果</h2>
                <div className="py-8">
                  <span className="text-7xl font-black text-indigo-600">{correctCount}</span>
                  <span className="text-2xl text-slate-400 font-bold ml-2">/ 10</span>
                </div>
                <p className="text-lg font-medium text-slate-600">
                  {correctCount === 10 ? '完璧です！ビジネス点字マスター！' :
                   correctCount >= 8 ? '素晴らしい！合格ラインを突破しています。' :
                   correctCount >= 5 ? 'あと少し！間違えた箇所を復習しましょう。' :
                   'まずは基礎からもう一度学習してみましょう。'}
                </p>
                <button 
                  onClick={resetQuiz}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md"
                >
                  トップに戻る
                </button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold">AIが問題を生成中（約10秒）...</p>
              </div>
            ) : quizList.length > 0 && (
              <div className="space-y-6">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-500"
                    style={{ width: `${((currentQuizIdx + 1) / quizList.length) * 100}%` }}
                  />
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                      {quizLevel.split(':')[0]}
                    </span>
                    <span className="text-sm font-bold text-slate-400">
                      {currentQuizIdx + 1} / {quizList.length}
                    </span>
                  </div>
                  
                  <div className="mb-8">
                    {quizList[currentQuizIdx].questionType === 'braille' ? (
                      <div className="space-y-4 text-center">
                        <p className="text-lg font-medium text-slate-700">この点字を読み取ってください：</p>
                        {renderBrailleSequence(quizList[currentQuizIdx].question, 'md')}
                      </div>
                    ) : (
                      <div className="space-y-2">
                         <p className="text-xs font-bold text-slate-400 uppercase">Question</p>
                         <h3 className="text-xl font-bold leading-snug">{quizList[currentQuizIdx].question}</h3>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {quizList[currentQuizIdx].options.map((opt, i) => (
                      <button
                        key={i}
                        disabled={showResult}
                        onClick={() => handleAnswerSelect(opt)}
                        className={`w-full p-4 text-left border-2 rounded-2xl transition-all font-medium flex items-center gap-4 ${
                          showResult 
                            ? normalizeText(opt) === normalizeText(quizList[currentQuizIdx].answer)
                              ? 'border-emerald-500 bg-emerald-50' 
                              : opt === selectedAnswer 
                                ? 'border-rose-500 bg-rose-50' 
                                : 'opacity-40'
                            : 'border-slate-100 bg-slate-50 hover:border-indigo-300'
                        }`}
                      >
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 font-mono text-xs">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <div className="flex-1">
                          {quizList[currentQuizIdx].optionType === 'braille' ? (
                            renderBrailleSequence(opt, 'sm')
                          ) : (
                            <span className="text-lg">{opt}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {showResult && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-fadeIn shadow-lg">
                    <p className={`font-bold mb-2 flex items-center gap-2 ${normalizeText(selectedAnswer || '') === normalizeText(quizList[currentQuizIdx].answer) ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {normalizeText(selectedAnswer || '') === normalizeText(quizList[currentQuizIdx].answer) ? '✨ 正解！' : '❌ 不正解'}
                    </p>
                    <div className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                      <p className="font-bold text-slate-400 mb-1 text-[10px] uppercase">Explanation</p>
                      {quizList[currentQuizIdx].explanation}
                    </div>
                    <button 
                      onClick={nextQuestion}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md"
                    >
                      {currentQuizIdx < quizList.length - 1 ? '次の問題へ' : '結果を見る'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold">AI点字チューター</h2>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">解説を生成中...</p>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap">
                {tutorOutput || "学習タブからトピックを選択して、AI講師による個別の解説を聞いてみましょう。"}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
