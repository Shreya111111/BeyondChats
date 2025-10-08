
import { useState, useEffect, useCallback } from 'react';
import { QuizAttempt } from '../types';

const STORAGE_KEY = 'quizAttempts';

export const useQuizAttempts = () => {
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

    useEffect(() => {
        try {
            const storedAttempts = localStorage.getItem(STORAGE_KEY);
            if (storedAttempts) {
                setAttempts(JSON.parse(storedAttempts));
            }
        } catch (error) {
            console.error("Could not load quiz attempts from localStorage", error);
        }
    }, []);

    const addAttempt = useCallback((attempt: QuizAttempt) => {
        setAttempts(prevAttempts => {
            const newAttempts = [...prevAttempts, attempt];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newAttempts));
            return newAttempts;
        });
    }, []);

    const clearAttempts = useCallback(() => {
        setAttempts([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { attempts, addAttempt, clearAttempts };
};
