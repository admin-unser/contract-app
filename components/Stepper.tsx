"use client";

interface StepperProps {
  steps: { label: string }[];
  currentStep: number; // 0-indexed
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-4 px-6">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-blue-600 z-0 transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isFuture = i > currentStep;

          return (
            <div key={i} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-blue-600 text-white"
                    : isCurrent
                    ? "bg-white border-[3px] border-blue-600 text-blue-600"
                    : "bg-white border-2 border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  isCompleted
                    ? "text-blue-600"
                    : isCurrent
                    ? "text-blue-600 font-semibold"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
