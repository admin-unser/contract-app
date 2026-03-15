"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "musubi-sign-onboarding-completed";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: "文書をアップロード",
    description:
      "PDFファイルをアップロードするか、テンプレートから文書を作成します。タイトルやカテゴリも設定できます。",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    title: "署名者を追加",
    description:
      "署名をお願いしたい相手の会社名・氏名・メールアドレスを入力します。複数の署名者を追加できます。",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  {
    title: "署名位置を設定",
    description:
      "PDF上にドラッグ&ドロップで署名欄・氏名・日付などの入力フィールドを配置します。署名者ごとに色分けされます。",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    title: "署名依頼を送信",
    description:
      "確認画面で内容をチェックし、送信ボタンを押すと署名者にメールが届きます。署名が完了すると通知されます。",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
  },
];

export function OnboardingTutorial() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setVisible(true);
    }
  }, []);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  if (!visible) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="font-bold text-lg">M</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">MUSUBI sign の使い方</h2>
                <p className="text-blue-100 text-sm">かんたん4ステップで署名依頼</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  i <= currentStep ? "bg-blue-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ステップ {currentStep + 1} / {STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            スキップ
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                戻る
              </button>
            )}
            <button
              onClick={handleNext}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {isLast ? "はじめる" : "次へ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
