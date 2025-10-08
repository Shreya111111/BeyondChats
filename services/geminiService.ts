

import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuestionType, ChatMessage, MCQQuestion, SAQQuestion, LAQQuestion, GradedResult, YouTubeRecommendation, GroundingSource } from '../types';
import { APP_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getQuizSchema = (type: QuestionType) => {
    const baseProperties = {
        questionText: { type: Type.STRING, description: 'The question text.' },
        topic: { type: Type.STRING, description: 'The topic of the question, e.g., "Kinematics".' }
    };

    switch (type) {
        case QuestionType.MCQ:
            return {
                type: Type.OBJECT,
                properties: {
                    ...baseProperties,
                    options: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING, description: "The option text." },
                                isCorrect: { type: Type.BOOLEAN, description: "Whether this option is the correct answer." }
                            },
                             required: ['text', 'isCorrect']
                        }
                    },
                    explanation: { type: Type.STRING, description: "Detailed explanation for the correct answer." }
                },
                required: ['questionText', 'topic', 'options', 'explanation']
            };
        case QuestionType.SAQ:
        case QuestionType.LAQ:
            return {
                type: Type.OBJECT,
                properties: {
                    ...baseProperties,
                    answer: { type: Type.STRING, description: "The correct answer or model answer." },
                    explanation: { type: Type.STRING, description: "Detailed explanation or breakdown of the answer." }
                },
                required: ['questionText', 'topic', 'answer', 'explanation']
            };
    }
};

export const generateQuiz = async (
    context: string,
    questionType: QuestionType,
    numQuestions: number,
    difficulty: 'Easy' | 'Medium' | 'Hard'
): Promise<QuizQuestion[]> => {
    try {
        const prompt = `Based on the following text content from a textbook, generate ${numQuestions} ${questionType} of ${difficulty} difficulty. Ensure questions are relevant to the provided text.

        Text Content:
        """
        ${context}
        """`;

        const responseSchema = {
            type: Type.ARRAY,
            items: getQuizSchema(questionType)
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const generatedQuestions = JSON.parse(jsonText);
        
        // Add question type to each question object
        return generatedQuestions.map((q: any) => ({ ...q, type: questionType }));

    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate quiz. The model might have returned an invalid response.");
    }
};

export const gradeAnswers = async (
    questions: QuizQuestion[],
    userAnswers: (string | string[])[]
): Promise<GradedResult[]> => {
    try {
        const gradingTasks = questions.map((q, i) => {
            let correctAnswer;
            if (q.type === QuestionType.MCQ) {
                correctAnswer = (q as MCQQuestion).options.find(o => o.isCorrect)?.text;
            } else {
                correctAnswer = (q as SAQQuestion | LAQQuestion).answer;
            }
            return {
                questionType: q.type,
                question: q.questionText,
                correctAnswer: correctAnswer,
                userAnswer: userAnswers[i] || "Not answered"
            };
        });

        const prompt = `You are a strict but fair teaching assistant. Your task is to grade a student's answers for a quiz. For each question, compare the user's answer with the provided correct answer.
        
        Provide a score for each question based on the following rubric:
        - 1: The user's answer is fully correct and captures all key points of the correct answer. For MCQs, this means the correct option was chosen.
        - 0.5: The user's answer is partially correct but misses some key points or contains minor inaccuracies. This only applies to Short and Long Answer questions.
        - 0: The user's answer is incorrect or completely misses the point.

        Also, provide brief, constructive feedback for each answer, explaining why it received the score it did.

        Here are the questions and answers to grade:
        ${JSON.stringify(gradingTasks, null, 2)}
        `;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    score: {
                        type: Type.NUMBER,
                        description: 'Score from 0, 0.5, or 1 based on the rubric.'
                    },
                    feedback: {
                        type: Type.STRING,
                        description: 'Constructive feedback for the user.'
                    }
                },
                required: ['score', 'feedback']
            }
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        // The AI might return a string wrapped in markdown like ```json ... ```
        const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '');

        try {
            const parsedResponse = JSON.parse(cleanedJsonText);
            
            if (!Array.isArray(parsedResponse) || parsedResponse.length !== questions.length) {
                console.error("Mismatched length or format from AI grading response:", parsedResponse);
                throw new Error("The AI returned a response with an unexpected format.");
            }
            
            const validatedResults: GradedResult[] = parsedResponse.map(item => {
                let numericScore = 0;
                // The AI might return a score as a string ("0.5") or a number (0.5).
                // This handles both cases and defaults to 0 if the score is missing or invalid.
                if (item && item.score !== undefined && item.score !== null) {
                    const parsed = parseFloat(String(item.score));
                    if (!isNaN(parsed)) {
                        numericScore = parsed;
                    }
                }

                return {
                    score: numericScore,
                    feedback: (item && typeof item.feedback === 'string') ? item.feedback : 'No feedback provided.'
                };
            });

            return validatedResults;
        } catch (e) {
            console.error("Failed to parse JSON from AI grading response:", cleanedJsonText, e);
            throw new Error("The AI returned an invalid response that could not be parsed.");
        }

    } catch (error) {
        console.error("Error grading answers:", error);
        throw new Error("Failed to grade answers. The model might have returned an invalid response.");
    }
};


export const getChatResponse = async (history: ChatMessage[], context: string): Promise<string> => {
    const formattedHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const systemInstruction = `You are an expert teaching assistant for school students. Your name is ${APP_NAME}. 
    Answer the user's questions based on the provided textbook context. Be encouraging and clear.
    When you use information from the text, you MUST cite the page number and provide a short, direct quote. 
    Format citations like this: (p. 23, "...quote...").
    If the answer is not in the provided context, state that clearly and do not make up information.
    
    Textbook Context:
    """
    ${context}
    """`;
    
    // This is a simplified chat implementation without using the `chats.create` API for more control
    // The last message is the new user prompt
    const userPrompt = history[history.length-1].text;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error getting chat response:", error);
        throw new Error("Failed to get a response from the AI.");
    }
};

export const getYouTubeRecommendations = async (context: string): Promise<{ recommendations: YouTubeRecommendation[], sources: GroundingSource[] }> => {
    try {
        const systemInstruction = `You are an expert YouTube video curator. Your sole purpose is to find real, verifiable, and publicly accessible YouTube videos relevant to the user's content.
- You MUST use the provided search tool to find videos.
- You MUST extract the exact URL and title from the search results. Do not paraphrase titles.
- Do NOT invent, guess, or construct URLs. If you cannot find a valid URL from your search, do not include that video.
- Your output MUST be a valid JSON array. Do not include any other text, explanations, or markdown before or after the JSON.
- Accuracy is your highest priority. Providing a fake or broken link is a critical failure.`;

        const userPrompt = `Using the search tool, find 5 highly relevant educational YouTube videos for the following textbook content. For each video, provide the exact title, a brief description of its relevance, and the full, verified youtube.com URL.

Format your response as a JSON array of objects, where each object has these keys: "title", "description", and "youtubeUrl".

Textbook Content:
"""
${context.substring(0, 5000)}
"""`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{googleSearch: {}}],
            },
        });
        
        const jsonText = response.text.trim();
        // Clean markdown code blocks if the model includes them
        const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '');

        let recommendations: YouTubeRecommendation[] = [];
        try {
            recommendations = JSON.parse(cleanedJsonText);
        } catch (e) {
            console.error("Failed to parse JSON from AI recommendation response:", cleanedJsonText, e);
            throw new Error("The AI returned recommendations in an invalid format.");
        }
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: GroundingSource[] = groundingChunks
            ? groundingChunks.map(chunk => ({
                uri: chunk.web?.uri || '#',
                title: chunk.web?.title || 'Unknown Source'
              }))
            : [];

        return { recommendations, sources };

    } catch (error) {
        console.error("Error generating YouTube recommendations:", error);
        throw new Error("Failed to generate YouTube recommendations.");
    }
};