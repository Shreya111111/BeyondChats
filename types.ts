

export interface PdfSource {
    name: string;
    url: string;
}

export enum QuestionType {
    MCQ = 'Multiple Choice Questions',
    SAQ = 'Short Answer Questions',
    LAQ = 'Long Answer Questions',
}

export interface MCQOption {
    text: string;
    isCorrect: boolean;
}

export interface BaseQuestion {
    questionText: string;
    topic: string;
}

export interface MCQQuestion extends BaseQuestion {
    type: QuestionType.MCQ;
    options: MCQOption[];
    explanation: string;
}

export interface SAQQuestion extends BaseQuestion {
    type: QuestionType.SAQ;
    answer: string;
    explanation: string;
}

export interface LAQQuestion extends BaseQuestion {
    type: QuestionType.LAQ;
    answer: string; // This would be a model answer
    explanation: string;
}

export type QuizQuestion = MCQQuestion | SAQQuestion | LAQQuestion;

export interface GradedResult {
    score: number; // 0 for incorrect, 0.5 for partially correct, 1 for correct
    feedback: string;
}

export interface QuizAttempt {
    id: string;
    pdfName: string;
    questions: QuizQuestion[];
    userAnswers: (string | string[])[];
    score: number;
    total: number;
    date: number;
    gradedResults: GradedResult[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    citations?: { page: number; snippet: string }[];
}

export interface PdfData {
    file: File;
    name: string;
    text: string;
    totalPages: number;
}

export interface YouTubeRecommendation {
    title: string;
    description: string;
    youtubeUrl: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}