
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BrailleCell from './components/BrailleCell';
import { KANA_BRAILLE_MAP, VOWELS } from './constants';
import { LessonType, QuizQuestion } from './types';
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

  return (
    <div className="min-h-screen pb-24 md:pt-20">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'study' && (
          <div className="space-y-8 animate-fadeIn">
            <header className="text-center">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ビジネス点字検定3級への道</h1>
              <p className="text-slate-500 mt-2">正確な2マス構成（拗音・濁音）をマスターしましょう</p>
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
            </div>
          </div>
        )}

        {activeTab === 'converter' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold">点字翻訳エディタ</h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="「きゃ」や「ぎゃ」と入力してみてください..."
                className="w-full h-24 p-4 border border-slate-200 rounded-xl outline-none text-lg"
              />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-4">点字プレビュー（2マス構成対応）</h3>
              <div className="flex flex-wrap gap-8 items-start">
                {tokenizeKana(inputText).map((token, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="flex gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {(KANA_BRAILLE_MAP[token] || [[false,false,false,false,false,false]]).map((dots, idx) => (
                        <BrailleCell key={idx} dots={dots} size="sm" />
                      ))}
                    </div>
                    <span className="mt-2 text-xs font-bold text-slate-400">{token}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl">🤖</div>
              <h2 className="text-xl font-bold">AI点字チューター</h2>
            </div>
            {loading ? (
              <div className="text-center py-20 animate-pulse">解説を生成中...</div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap">
                {tutorOutput}
                <button 
                  onClick={() => startQuiz(selectedLesson || '')}
                  className="mt-10 w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  この項目のクイズに挑戦
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quiz_active' && quizList.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
              <h3 className="text-xl font-bold mb-6">{quizList[currentQuizIdx].question}</h3>
              <div className="space-y-3">
                {quizList[currentQuizIdx].options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={showResult}
                    onClick={() => { setSelectedAnswer(opt); setShowResult(true); }}
                    className={`w-full p-4 text-left border-2 rounded-xl transition-all font-medium ${
                      showResult 
                        ? opt === quizList[currentQuizIdx].answer ? 'border-emerald-500 bg-emerald-50' : opt === selectedAnswer ? 'border-rose-500 bg-rose-50' : 'opacity-40'
                        : 'border-slate-100 bg-slate-50 hover:border-indigo-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {showResult && (
              <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500">
                <p className="font-bold text-indigo-600 mb-2">解説：</p>
                <p className="text-sm">{quizList[currentQuizIdx].explanation}</p>
                <button 
                  onClick={() => {
                    if (currentQuizIdx < quizList.length - 1) { setCurrentQuizIdx(c => c + 1); setShowResult(false); }
                    else setActiveTab('study');
                  }}
                  className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl"
                >
                  {currentQuizIdx < quizList.length - 1 ? '次へ' : '完了'}
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
            className="w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 transition-all group"
          >
            <span className="text-lg">💡</span>
            <span className="absolute right-full mr-3 bg-slate-900 text-white px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              ルールを表示
            </span>
          </button>
        ) : (
          <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl w-80 text-white animate-fadeIn relative">
            <button 
              onClick={() => setShowHelper(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              title="閉じる"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h4 className="font-bold text-indigo-400 text-xs mb-4 uppercase tracking-widest">重要：2マスのルール</h4>
            <div className="space-y-3 text-[11px] text-slate-300">
              <p>● <strong>拗音（きゃ 等）</strong><br/>[4点] ＋ [あ/う/お段]</p>
              <p>● <strong>濁音（が 等）</strong><br/>[5点] ＋ [清音]</p>
              <p>● <strong>半濁音（ぱ 等）</strong><br/>[6点] ＋ [は行文字]</p>
              <p>● <strong>拗濁音（ぎゃ 等）</strong><br/>[4,5点] ＋ [あ/う/お段]</p>
              <p>● <strong>拗半濁音（ぴゃ 等）</strong><br/>[4,6点] ＋ [は行のあ/う/お段]</p>
              <div className="bg-indigo-900/40 p-3 rounded-lg border border-indigo-500/30 space-y-1">
                <p>例：<strong>きゃ</strong> = ⠴(4) ＋ ⠕(か)</p>
                <p>例：<strong>ぎゃ</strong> = ⠵(4,5) ＋ ⠕(か)</p>
                <p>例：<strong>ぱ</strong> = ⠠(6) ＋ ⠥(は/1,3,6)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
