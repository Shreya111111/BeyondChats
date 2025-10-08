import React from 'react';
import { QuizAttempt, QuestionType, MCQQuestion, SAQQuestion, LAQQuestion } from '../types';
import { X } from 'lucide-react';

interface AttemptDetailModalProps {
    attempt: QuizAttempt | null;
    onClose: () => void;
}

const AttemptDetailModal: React.FC<AttemptDetailModalProps> = ({ attempt, onClose }) => {
    if (!attempt) return null;

    const totalPossibleScore = attempt.total;
    const scorePercentage = totalPossibleScore > 0 ? ((attempt.score / totalPossibleScore) * 100).toFixed(1) : 0;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <header className="p-4 sm:p-6 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white truncate pr-4">{attempt.pdfName}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Attempted on: {new Date(attempt.date).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close">
                        <X size={24} />
                    </button>
                </header>
                
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    <div className="text-center mb-4">
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Final Score: <span className="font-bold text-2xl text-primary-500">{attempt.score.toFixed(1)} / {totalPossibleScore}</span> ({scorePercentage}%)
                        </p>
                    </div>

                    {attempt.questions.map((q, i) => {
                        const result = attempt.gradedResults[i];
                        if (!result) return null;

                        const scoreColorClass = result.score === 1 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : result.score > 0 
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                                : 'border-red-500 bg-red-50 dark:bg-red-900/20';

                        const userAnswer = attempt.userAnswers[i];
                        let correctAnswer: string | undefined = undefined;
                        if (q.type === QuestionType.MCQ) {
                            correctAnswer = (q as MCQQuestion).options.find(o => o.isCorrect)?.text;
                        } else {
                            correctAnswer = (q as SAQQuestion | LAQQuestion).answer;
                        }

                        return (
                            <div key={i} className={`p-4 rounded-lg border-l-4 ${scoreColorClass}`}>
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200 flex-1">{i + 1}. {q.questionText}</p>
                                    <span className={`ml-4 px-3 py-1 text-sm font-bold rounded-full text-white ${result.score === 1 ? 'bg-green-500' : result.score > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                        {result.score} / 1
                                    </span>
                                </div>
                                
                                <div className="space-y-3 mt-3 text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-700 dark:text-gray-300">Your Answer:</p>
                                        <p className="mt-1 p-3 rounded-md bg-blue-50 dark:bg-gray-700/30 text-gray-800 dark:text-gray-200">{userAnswer || "Not answered"}</p>
                                    </div>
                                    {result.score < 1 && (
                                        <div>
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">Correct Answer:</p>
                                            <p className="mt-1 p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-gray-800 dark:text-gray-200">{correctAnswer}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Feedback:</p>
                                    <p className="mt-1 text-sm p-3 rounded-md bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300">{result.feedback}</p>
                                </div>
                            </div>
                        );
                    })}
                </main>
            </div>
        </div>
    );
};

export default AttemptDetailModal;