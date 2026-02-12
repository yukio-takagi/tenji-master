
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BrailleCell from './components/BrailleCell';
import { KANA_BRAILLE_MAP, VOWELS } from './constants';
import { LessonType, QuizQuestion, DotState } from './types';
import { getTutorExplanation, generateQuiz } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('study');
  const [inputText, setInputText] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null);
  const [tutorOutput, setTutorOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizList, setQuizList] = useState<QuizQuestion[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [showHelper, setShowHelper] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showDotNumbers, setShowDotNumbers] = useState(false);

  // 拗音（きゃ、ぎゃ等）を適切に1単位として扱うためのトークナイザー
  const tokenizeKana = (text: string): string[] => {
    const tokens: string[] = [];
    let i = 0;
    while (i < text.length) {
      const current = text[i];
      const next = text[i + 1];
      // 次の文字が小さい「ゃゅょ」なら2文字で1トークン
      if (next && ['ゃ', 'ゅ', 'ょ'].includes(next)) {
        tokens.push(current + next);
        i += 2;
      } else {
        tokens.push(current);
        i++;
      }
    }
    return tokens;
  };

  const getDotNumbersString = (dots: DotState): string => {
    const activeDots = dots
      .map((active, index) => (active ? index + 1 : null))
      .filter((n): n is number => n !== null);
    return activeDots.length > 0 ? activeDots.join(',') + '点' : 'なし';
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

  const startQuiz = (topic: string) => {
    setActiveTab('quiz_active');
    setLoading(true);
    generateQuiz(topic).then(res => {
      setQuizList(res);
      setCurrentQuizIdx(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setLoading(false);
    });
  };

  const renderBrailleSequence = (text: string, size: 'sm' | 'md' = 'sm') => {
    const tokens = tokenizeKana(text);
    return (
      <div className="flex flex-wrap gap-2 justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
        {tokens.map((token, i) => (
          <div key={i} className="flex gap-0.5">
            {(KANA_BRAILLE_MAP[token] || [[false,false,false,false,false,false]]).map((dots, idx) => (
              <BrailleCell key={idx} dots={dots} size={size} />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 md:pt-20">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'study' && (
          <div className="space-y-8 animate-fadeIn">
            <header className="text-center">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ビジネス点字検定3級への道</h1>
              <p className="text-slate-500 mt-2">論理的な構成ルールをマスターしましょう</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(LessonType).map((lesson) => (
                <button 
                  key={lesson}
                  onClick={() => handleLessonSelect(lesson)}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 text-left group flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{lesson}</h3>
                  </div>
                  <span className="text-indigo-600 font-bold opacity-20 group-hover:opacity-100 transition-all">→</span>
                </button>
              ))}
              <button 
                onClick={() => startQuiz("ビジネス点字全般")}
                className="col-span-1 md:col-span-2 bg-indigo-600 p-6 rounded-2xl text-white shadow-lg hover:bg-indigo-700 text-center font-bold text-lg transition-transform active:scale-95"
              >
                総合力テスト（読解・構成・知識）を開始
              </button>
            </div>
          </div>
        )}

        {activeTab === 'converter' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold">点字翻訳エディタ</h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="「きゃ」や「コーヒー」と入力してみてください..."
                className="w-full h-24 p-4 border border-slate-200 rounded-xl outline-none text-lg focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700">点字プレビュー（長音・促音対応）</h3>
                <button
                  onClick={() => setShowDotNumbers(!showDotNumbers)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    showDotNumbers 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400'
                  }`}
                >
                  {showDotNumbers ? 'ドット番号を表示中' : 'ドット番号を表示'}
                </button>
              </div>
              <div className="flex flex-wrap gap-8 items-start">
                {tokenizeKana(inputText).map((token, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="flex gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {(KANA_BRAILLE_MAP[token] || [[false,false,false,false,false,false]]).map((dots, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <BrailleCell dots={dots} size="sm" />
                          {showDotNumbers && (
                            <span className="text-[10px] text-indigo-500 font-mono">
                              {getDotNumbersString(dots)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="mt-2 text-xs font-bold text-slate-400">{token}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
           <div className="text-center py-20 animate-fadeIn">
             <h2 className="text-2xl font-bold mb-4">クイズを選択</h2>
             <p className="text-slate-500 mb-8">学習タブから各レッスンのクイズを開始できます。</p>
             <button 
                onClick={() => setActiveTab('study')}
                className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg"
             >
               学習メニューへ
             </button>
           </div>
        )}

        {activeTab === 'tutor' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg">🤖</div>
              <h2 className="text-xl font-bold">AI点字チューター</h2>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">論理的な解説を生成中...</p>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap">
                {tutorOutput || "左の学習メニューからトピックを選択してください。"}
                {selectedLesson && (
                  <button 
                    onClick={() => startQuiz(selectedLesson || '')}
                    className="mt-10 w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98]"
                  >
                    この項目のクイズに挑戦
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'quiz_active' && quizList.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                  Question {currentQuizIdx + 1} / {quizList.length}
                </span>
              </div>
              
              <div className="mb-8">
                {quizList[currentQuizIdx].questionType === 'braille' ? (
                  <div className="space-y-4 text-center">
                    <p className="text-lg font-medium text-slate-700">以下の点字は何と読みますか？</p>
                    {renderBrailleSequence(quizList[currentQuizIdx].question, 'md')}
                  </div>
                ) : (
                  <h3 className="text-xl font-bold leading-snug text-slate-800">{quizList[currentQuizIdx].question}</h3>
                )}
              </div>

              <div className="space-y-4">
                {quizList[currentQuizIdx].options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={showResult}
                    onClick={() => { setSelectedAnswer(opt); setShowResult(true); }}
                    className={`w-full p-4 text-left border-2 rounded-2xl transition-all font-medium flex items-center gap-4 ${
                      showResult 
                        ? opt === quizList[currentQuizIdx].answer 
                          ? 'border-emerald-500 bg-emerald-50 shadow-inner' 
                          : opt === selectedAnswer 
                            ? 'border-rose-500 bg-rose-50' 
                            : 'opacity-40 grayscale-[0.5]'
                        : 'border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-white shadow-sm'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${
                      showResult && opt === quizList[currentQuizIdx].answer 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="flex-1">
                      {quizList[currentQuizIdx].optionType === 'braille' ? (
                        <div className="flex items-center justify-between gap-4">
                          {renderBrailleSequence(opt, 'sm')}
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">を選択する</span>
                        </div>
                      ) : (
                        <span className="text-lg">{opt}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {showResult && (
              <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500 animate-fadeIn shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                   {selectedAnswer === quizList[currentQuizIdx].answer ? (
                     <span className="text-emerald-500 text-xl font-bold flex items-center gap-2">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                       正解です！
                     </span>
                   ) : (
                     <span className="text-rose-500 text-xl font-bold flex items-center gap-2">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                       残念、不正解です...
                     </span>
                   )}
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-bold text-indigo-600 mb-1 text-xs uppercase tracking-widest">解説</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{quizList[currentQuizIdx].explanation}</p>
                </div>
                <button 
                  onClick={() => {
                    if (currentQuizIdx < quizList.length - 1) { setCurrentQuizIdx(c => c + 1); setShowResult(false); setSelectedAnswer(null); }
                    else setActiveTab('study');
                  }}
                  className="mt-6 w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                  {currentQuizIdx < quizList.length - 1 ? '次の問題へ' : '結果を保存して終了'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="hidden lg:block fixed bottom-24 right-8 z-50">
        {!showHelper ? (
          <button 
            onClick={() => setShowHelper(true)}
            className="w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 transition-all group hover:scale-110 active:scale-90"
          >
            <span className="text-lg">💡</span>
          </button>
        ) : (
          <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl w-80 text-white animate-fadeIn relative border border-slate-700">
            <button 
              onClick={() => setShowHelper(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h4 className="font-bold text-indigo-400 text-xs mb-4 uppercase tracking-widest">重要：点字のルール</h4>
            <div className="space-y-3 text-[11px] text-slate-300">
              <p>● <strong>拗音（きゃ 等）</strong><br/>[4点] ＋ [あ/う/お段]</p>
              <p>● <strong>濁音（が 等）</strong><br/>[5点] ＋ [清音]</p>
              <p>● <strong>半濁音（ぱ 等）</strong><br/>[6点] ＋ [は行文字]</p>
              
              <div className="border-t border-slate-700 my-2 pt-2">
                <p>● <strong>特殊な音（1マス）</strong></p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <p>促音(っ): 2点</p>
                  <p>長音(ー): 2,5点</p>
                </div>
              </div>

              <div className="bg-indigo-900/40 p-3 rounded-lg border border-indigo-500/30 space-y-1">
                <p>例：<strong>きゃ</strong> = ⠴(4) ＋ ⠕(か)</p>
                <p>例：<strong>きっぷ</strong> = ⠣(き) ⠂(っ) ⠠⠥(ぱ行+は)</p>
                <p>例：<strong>コピー</strong> = ⠪(こ) ⠠⠥(ぱ行+は) ⠒(ー)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
