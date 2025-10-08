
import React, { useState, useCallback, useEffect } from 'react';
import { usePdf } from '../contexts/PdfContext';
import { generateQuiz, gradeAnswers } from '../services/geminiService';
import { QuestionType, QuizQuestion, MCQQuestion, SAQQuestion, LAQQuestion, GradedResult, QuizAttempt } from '../types';
import { useQuizAttempts } from '../hooks/useQuizAttempts';
import { ArrowLeft, ArrowRight, Check, Send, Sparkles, X, RotateCw, BookText } from 'lucide-react';
import toast from 'react-hot-toast';

const questionTypeLabels: { [key in QuestionType]: string } = {
    [QuestionType.MCQ]: 'Multiple Choice',
    [QuestionType.SAQ]: 'Short Answer',
    [QuestionType.LAQ]: 'Long Answer',
};

const QuizView: React.FC = () => {
    const { pdfText, pdfName, totalPages, isLoading: isPdfLoading } = usePdf();
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGrading, setIsGrading] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(string | string[])[]>([]);
    const [quizState, setQuizState] = useState<'config' | 'taking' | 'result'>('config');
    const [score, setScore] = useState(0);
    const [gradedResults, setGradedResults] = useState<GradedResult[]>([]);

    const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.MCQ);
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [pageRange, setPageRange] = useState({ start: 1, end: 10 });
    
    const { addAttempt } = useQuizAttempts();

    const handleGenerateQuiz = async () => {
        if (!pdfText) {
            toast.error('Please upload and process a PDF first.');
            return;
        }
        
        const start = Math.max(1, pageRange.start);
        const end = Math.min(totalPages, pageRange.end);
        if (start > end) {
            toast.error("Start page cannot be greater than end page.");
            return;
        }

        const startMarker = `[Page ${start}]`;
        const endMarker = `[Page ${end + 1}]`;
        const startIndex = pdfText.indexOf(startMarker);
        let endIndex = pdfText.indexOf(endMarker);
        if (endIndex === -1) endIndex = pdfText.length;
        
        const context = pdfText.substring(startIndex, endIndex);

        if (context.trim().length < 100) {
            toast.error("Not enough text content in the selected page range to generate a quiz.");
            return;
        }

        setIsGenerating(true);
        try {
            const questions = await generateQuiz(context, questionType, numQuestions, difficulty);
            setQuizQuestions(questions);
            setUserAnswers(new Array(questions.length).fill(''));
            setCurrentQuestionIndex(0);
            setScore(0);
            setGradedResults([]);
            setQuizState('taking');
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleAnswerChange = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        setIsGrading(true);
        const toastId = toast.loading('AI is grading your answers...');
    
        try {
            const results = await gradeAnswers(quizQuestions, userAnswers);
            const finalScore = results.reduce((acc, result) => acc + result.score, 0);
            const totalPossibleScore = quizQuestions.length;
    
            const attempt: QuizAttempt = {
                id: new Date().toISOString(),
                pdfName,
                questions: quizQuestions,
                userAnswers,
                score: finalScore,
                total: totalPossibleScore,
                date: Date.now(),
                gradedResults: results,
            };
            addAttempt(attempt);
            
            setGradedResults(results);
            setScore(finalScore);
            setQuizState('result');
    
            toast.success("Grading complete! Quiz attempt saved.", { id: toastId });
    
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to grade quiz.", { id: toastId });
        } finally {
            setIsGrading(false);
        }
    };

    if (isPdfLoading) {
        return <div className="text-center p-8">Loading PDF...</div>;
    }

    if (!pdfText) {
        return (
            <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <BookText className="mx-auto h-16 w-16 text-primary-400" />
                <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">No PDF Selected</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Please upload a PDF using the sidebar to generate a quiz.</p>
            </div>
        );
    }
    
    if (quizState === 'config') {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl animate-fade-in">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">Generate a New Quiz</h1>
                <div className="space-y-6">
                    <div>
                        <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Question Type</label>
                        <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                            {(Object.values(QuestionType) as QuestionType[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setQuestionType(t)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition ${questionType === t ? 'bg-primary-500 text-white shadow' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    {questionTypeLabels[t]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Number of Questions: {numQuestions}</label>
                        <input type="range" min="3" max="15" value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    </div>
                    <div>
                        <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Difficulty</label>
                         <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                            {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                                <button key={d} onClick={() => setDifficulty(d)} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${difficulty === d ? 'bg-primary-500 text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Page Range (Total: {totalPages})</label>
                        <div className="flex items-center space-x-4">
                            <input type="number" value={pageRange.start} onChange={e => setPageRange(p => ({ ...p, start: parseInt(e.target.value) }))} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" min="1" max={totalPages} />
                            <span>to</span>
                            <input type="number" value={pageRange.end} onChange={e => setPageRange(p => ({ ...p, end: parseInt(e.target.value) }))} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" min="1" max={totalPages} />
                        </div>
                    </div>
                    <button onClick={handleGenerateQuiz} disabled={isGenerating} className="w-full flex justify-center items-center p-4 text-lg font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:bg-primary-300">
                        {isGenerating ? 'Generating...' : 'Start Quiz'}
                        {!isGenerating && <Sparkles className="ml-2" />}
                    </button>
                </div>
            </div>
        );
    }
    
    if (quizState === 'result') {
        const totalPossibleScore = quizQuestions.length;
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl animate-fade-in">
                <h1 className="text-3xl font-bold text-center mb-4 text-gray-800 dark:text-white">Quiz Results</h1>
                 <p className="text-center text-xl mb-8 text-gray-600 dark:text-gray-300">
                    You scored {score.toFixed(1)} out of {totalPossibleScore} ({totalPossibleScore > 0 ? ((score / totalPossibleScore) * 100).toFixed(1) : 0}%)
                </p>
                
                <div className="space-y-6">
                    {quizQuestions.map((q, i) => {
                         const result = gradedResults[i];
                         if (!result) return null;
 
                         const scoreColorClass = result.score === 1 
                             ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                             : result.score > 0 
                                 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                                 : 'border-red-500 bg-red-50 dark:bg-red-900/20';
 
                         const userAnswer = userAnswers[i];
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
                                
                                <details className="mt-3 text-sm">
                                    <summary className="cursor-pointer font-medium text-primary-600 dark:text-primary-400">Show Original Explanation</summary>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">{q.explanation}</p>
                                </details>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-center mt-8">
                     <button onClick={() => setQuizState('config')} className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                        <RotateCw className="mr-2" size={18} />
                        New Quiz
                    </button>
                </div>
            </div>
        );
    }
    
    // quizState === 'taking'
    const currentQuestion = quizQuestions[currentQuestionIndex];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">Question {currentQuestionIndex + 1} of {quizQuestions.length}</p>
                <p className="text-xl md:text-2xl font-semibold my-4 text-gray-800 dark:text-gray-200">{currentQuestion.questionText}</p>

                {currentQuestion.type === QuestionType.MCQ && (
                    <div className="space-y-3">
                        {(currentQuestion as MCQQuestion).options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerChange(option.text)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition whitespace-normal ${userAnswers[currentQuestionIndex] === option.text ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'}`}
                            >
                                {option.text}
                            </button>
                        ))}
                    </div>
                )}
                {(currentQuestion.type === QuestionType.SAQ || currentQuestion.type === QuestionType.LAQ) && (
                    <textarea 
                        value={userAnswers[currentQuestionIndex] as string || ''}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        rows={currentQuestion.type === QuestionType.SAQ ? 4 : 8}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Type your answer here..."
                    />
                )}
                
                 <div className="flex justify-between items-center mt-8">
                    <button onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))} disabled={currentQuestionIndex === 0} className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">
                        <ArrowLeft size={18} className="mr-2" /> Previous
                    </button>
                    {currentQuestionIndex === quizQuestions.length - 1 ? (
                        <button onClick={handleSubmit} disabled={isGrading} className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-green-400">
                            {isGrading ? 'Grading...' : 'Submit'} <Send size={18} className="ml-2" />
                        </button>
                    ) : (
                        <button onClick={() => setCurrentQuestionIndex(i => Math.min(quizQuestions.length - 1, i + 1))} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                            Next <ArrowRight size={18} className="ml-2" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizView;
