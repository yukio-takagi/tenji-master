
import React, { useState, useEffect, useTransition } from 'react';
import Navbar from './components/Navbar';
import BrailleCell from './components/BrailleCell';
import { KANA_BRAILLE_MAP, DOT_TO_UNICODE, VOWELS } from './constants';
import { LessonType, QuizQuestion } from './types';
import { getTutorExplanation, generateQuiz } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('study');
  const [inputText, setInputText] = useState('');
  const [brailleOutput, setBrailleOutput] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null);
  const [tutorOutput, setTutorOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizList, setQuizList] = useState<QuizQuestion[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [showHelper, setShowHelper] = useState(true);
  
  // Quiz specific states
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // React 18 transition for better UI responsiveness
  const [isPending, startTransition] = useTransition();

  // Conversion Logic
  useEffect(() => {
    const chars = inputText.split('');
    const output = chars.map(c => {
      const dots = KANA_BRAILLE_MAP[c];
      return dots ? DOT_TO_UNICODE(dots) : ' ';
    });
    setBrailleOutput(output);
  }, [inputText]);

  const handleLessonSelect = (lesson: LessonType) => {
    setSelectedLesson(lesson);
    setTutorOutput('');
    setActiveTab('tutor');
    
    setLoading(true);
    getTutorExplanation(lesson).then(explanation => {
      setTutorOutput(explanation || "解説を取得できませんでした。");
      setLoading(false);
    }).catch(() => {
      setTutorOutput("エラーが発生しました。");
      setLoading(false);
    });
  };

  const startQuiz = (topic: string) => {
    setActiveTab('quiz_active');
    setLoading(true);
    setQuizList([]);
    
    generateQuiz(topic).then(questions => {
      setQuizList(questions);
      setCurrentQuizIdx(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  const handleAnswerSelect = (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQuizIdx < quizList.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setActiveTab('study');
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pt-20">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'study' && (
          <div className="space-y-8 animate-fadeIn">
            <header className="text-center">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ビジネス点字検定3級 合格への道</h1>
              <p className="text-slate-500 mt-2">1か月でマスターするための集中カリキュラム</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(LessonType).map((lesson) => (
                <button 
                  key={lesson}
                  onClick={() => handleLessonSelect(lesson)}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all text-left group flex items-center justify-between active:scale-95"
                >
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{lesson}</h3>
                    <p className="text-sm text-slate-500 mt-1">検定頻出のポイントを学習</p>
                  </div>
                  <span className="text-indigo-600 font-bold text-xl opacity-20 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">→</span>
                </button>
              ))}
            </div>

            <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-400">
                <span className="bg-white/10 p-1 rounded-lg">🎯</span> 
                3級合格のための学習指針
              </h2>
              <ul className="space-y-3 text-slate-300 text-sm">
                <li className="flex gap-2"><span>✅</span> 50音の仕組み（あ行・か行...）のドット規則を論理的に覚える</li>
                <li className="flex gap-2"><span>✅</span> 拗音（きゃ・きゅ・きょ等）の構成ルールを完璧にする</li>
                <li className="flex gap-2"><span>✅</span> 数字、アルファベット、ビジネス特有の分かち書きを練習する</li>
              </ul>
            </section>
          </div>
        )}

        {activeTab === 'converter' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold">点字翻訳エディタ</h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 mb-2">かな（清音のみ対応）を入力</label>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="あいうえお..."
                className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-lg"
              />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-700 mb-4">点字プレビュー</h3>
              <div className="flex flex-wrap gap-6 min-h-[100px] items-start">
                {inputText ? (
                  inputText.split('').map((char, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <BrailleCell 
                        dots={KANA_BRAILLE_MAP[char] || [false,false,false,false,false,false]} 
                        size="sm" 
                      />
                      <span className="mt-2 text-xs text-slate-400 font-bold">{char}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">文字を入力すると点字が表示されます</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg">🤖</div>
              <div>
                <h2 className="text-xl font-bold">AI点字チューター</h2>
                <p className="text-sm text-slate-500">
                  {selectedLesson ? `${selectedLesson} の論理解説` : '学習項目を選択してください'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 space-y-6 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 animate-pulse font-medium">AIが正確な解説を構築しています...</p>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm leading-relaxed prose prose-indigo max-w-none">
                {tutorOutput ? (
                  <>
                    <div className="text-slate-700" dangerouslySetInnerHTML={{ __html: tutorOutput.replace(/\n/g, '<br/>') }} />
                    <button 
                      onClick={() => startQuiz(selectedLesson || '')}
                      className="mt-10 w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                    >
                      この項目のクイズで復習する
                    </button>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-slate-400 mb-6 italic">「学習」メニューから項目を選んでください。</p>
                    <button onClick={() => setActiveTab('study')} className="text-indigo-600 font-bold hover:underline">メニューへ戻る</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'quiz_active' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">実戦トレーニング</h2>
              <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                {loading ? '...' : `QUESTION ${currentQuizIdx + 1} / ${quizList.length}`}
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <p className="text-slate-500 font-medium">問題を生成中...</p>
              </div>
            ) : quizList.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
                  <h3 className="text-xl font-bold mb-8 text-slate-800 leading-snug relative z-10">
                    {quizList[currentQuizIdx].question}
                  </h3>

                  <div className="grid grid-cols-1 gap-3 relative z-10">
                    {quizList[currentQuizIdx].options.map((opt, i) => {
                      const isCorrect = opt === quizList[currentQuizIdx].answer;
                      const isSelected = selectedAnswer === opt;
                      
                      let style = "border-slate-100 bg-slate-50/50 hover:border-indigo-200 hover:bg-white";
                      if (showResult) {
                        if (isCorrect) style = "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20";
                        else if (isSelected) style = "bg-rose-50 border-rose-500 text-rose-900";
                        else style = "opacity-40 border-slate-100 grayscale";
                      }

                      return (
                        <button
                          key={i}
                          disabled={showResult}
                          onClick={() => handleAnswerSelect(opt)}
                          className={`p-5 text-left border-2 rounded-2xl transition-all font-bold flex items-center gap-4 ${style}`}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 shadow-sm ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="grow">{opt}</span>
                          {showResult && isCorrect && <span className="text-emerald-500">✔ 正解</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {showResult && (
                  <div className="bg-white p-8 rounded-3xl border-2 border-indigo-500 shadow-2xl shadow-indigo-100 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl ${selectedAnswer === quizList[currentQuizIdx].answer ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {selectedAnswer === quizList[currentQuizIdx].answer ? '✨ 正解です！' : '📌 解説を確認しましょう'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                        正解：{quizList[currentQuizIdx].answer}
                      </div>
                    </div>
                    <div className="text-slate-700 mb-8 leading-relaxed">
                      <p className="font-bold text-indigo-600 mb-2">点字構成のポイント：</p>
                      <p className="text-sm bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        {quizList[currentQuizIdx].explanation}
                      </p>
                    </div>
                    <button 
                      onClick={nextQuestion}
                      className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      {currentQuizIdx < quizList.length - 1 ? '次の問題へ進む' : 'トレーニング完了'}
                      <span className="text-xl">→</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                <p className="text-slate-400">問題が見つかりませんでした。</p>
                <button onClick={() => setActiveTab('study')} className="mt-4 text-indigo-600 font-bold">戻る</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Helper Controller */}
      <button 
        onClick={() => setShowHelper(!showHelper)}
        className={`hidden lg:flex fixed bottom-8 right-8 w-12 h-12 rounded-full items-center justify-center shadow-xl z-[60] transition-all duration-300 ${
          showHelper ? 'bg-indigo-600 text-white rotate-12' : 'bg-slate-200 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600'
        }`}
        title={showHelper ? "ヘルプを隠す" : "ヘルプを表示"}
      >
        <span className="text-xl">{showHelper ? '💡' : '❔'}</span>
      </button>

      {/* Floating Helper for Beginners */}
      {showHelper && (
        <div className="hidden lg:block fixed bottom-24 right-8 bg-slate-900 p-6 rounded-3xl shadow-2xl w-80 border border-slate-800 animate-fadeIn z-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-xs text-indigo-400 tracking-widest uppercase flex items-center gap-2">
              点字の基本ドット配置
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            </h4>
            <button 
              onClick={() => setShowHelper(false)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <span className="text-xs">✕</span>
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3 text-[10px] text-center mb-6">
            {['あ','い','う','え','お'].map(k => (
              <div key={k} className="flex flex-col items-center group">
                <div className="bg-slate-800 p-2 rounded-xl group-hover:bg-slate-700 transition-colors">
                  <BrailleCell dots={VOWELS[k]} size="sm" />
                </div>
                <span className="font-bold mt-2 text-slate-400">{k}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] leading-relaxed text-slate-400 space-y-2 border-t border-slate-800 pt-4">
            <p className="text-indigo-300"><strong>ロジカル暗記法:</strong></p>
            <p>母音「お」は 2・4点 です。子音「は行」は 3・6点 です。</p>
            <p className="bg-indigo-900/30 p-2 rounded border border-indigo-500/20 text-indigo-200">
              <strong>例:「ほ」</strong> = 2・4 (お) + 3・6 (は行) <br/>= <strong>2・3・4・6点</strong>
            </p>
            <p className="text-amber-400">※「を」などは独立した形(3,5点)です。</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
