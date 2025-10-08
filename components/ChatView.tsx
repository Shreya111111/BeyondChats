

import React, { useState, useRef, useEffect } from 'react';
import { usePdf } from '../contexts/PdfContext';
import { getChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, User, Bot, BookText, BookOpen, X, Trash2 } from 'lucide-react';
import PdfViewer from './PdfViewer';

const getChatHistoryKey = (pdfName: string) => `chatHistory_${pdfName}`;

const ChatView: React.FC = () => {
    const { pdfFile, pdfText, pdfName, isLoading: isPdfLoading } = usePdf();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isPdfViewerVisible, setIsPdfViewerVisible] = useState(true);

    useEffect(() => {
        if (pdfFile) {
            if (window.innerWidth < 1024) {
                setIsPdfViewerVisible(false);
            } else {
                setIsPdfViewerVisible(true);
            }
        }
    }, [pdfFile]);

    useEffect(() => {
        if (pdfName) {
            try {
                const storedHistory = localStorage.getItem(getChatHistoryKey(pdfName));
                setMessages(storedHistory ? JSON.parse(storedHistory) : []);
            } catch (error) {
                console.error("Could not load chat history:", error);
                setMessages([]);
            }
        } else {
            setMessages([]);
        }
    }, [pdfName]);

    useEffect(() => {
        if (pdfName && messages.length > 0) {
            try {
                localStorage.setItem(getChatHistoryKey(pdfName), JSON.stringify(messages));
            } catch (error) {
                console.error("Could not save chat history:", error);
            }
        }
        // Special case: if messages are cleared, remove from storage
        if (pdfName && messages.length === 0) {
             localStorage.removeItem(getChatHistoryKey(pdfName));
        }
    }, [messages, pdfName]);

    const handleClearHistory = () => {
        if (pdfName && window.confirm('Are you sure you want to clear the chat history for this document?')) {
            setMessages([]);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isResponding) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsResponding(true);

        try {
            const contextChunk = pdfText.substring(0, 20000);
            const responseText = await getChatResponse(newMessages, contextChunk);
            const modelMessage: ChatMessage = { role: 'model', text: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsResponding(false);
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
                <p className="mt-2 text-gray-500 dark:text-gray-400">Please upload a PDF to start a conversation about its content.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold truncate pr-4">Chat with {pdfName}</h2>
                    <div className="flex items-center space-x-2">
                        {messages.length > 0 && !isResponding && (
                            <button 
                                onClick={handleClearHistory}
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-500"
                                title="Clear Chat History"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        {pdfFile && (
                            <button 
                                onClick={() => setIsPdfViewerVisible(!isPdfViewerVisible)}
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label={isPdfViewerVisible ? "Hide PDF" : "Show PDF"}
                                title={isPdfViewerVisible ? "Hide PDF" : "Show PDF"}
                            >
                                {isPdfViewerVisible ? <X size={20} /> : <BookOpen size={20} />}
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <p>Ask me anything about the contents of the PDF!</p>
                            <p className="text-sm">For example: "Explain the concept of inertia from page 5."</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white"><Bot size={20} /></div>}
                            <div className={`max-w-xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"><User size={20} /></div>}
                        </div>
                    ))}
                     {isResponding && (
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white"><Bot size={20} /></div>
                            <div className="max-w-xl p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-lg">
                               <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                               </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t dark:border-gray-700">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a question..."
                            className="w-full p-3 pr-12 rounded-full bg-gray-100 dark:bg-gray-700 border border-transparent focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={isResponding}
                        />
                        <button onClick={handleSend} disabled={isResponding || input.trim() === ''} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-gray-500 dark:text-gray-300 hover:text-primary-500 disabled:text-gray-300 dark:disabled:text-gray-600">
                            <Send />
                        </button>
                    </div>
                </div>
            </div>
             {isPdfViewerVisible && pdfFile && (
                <div className="hidden lg:block w-1/2 flex-shrink-0 border-l dark:border-gray-700">
                    <PdfViewer file={pdfFile} />
                </div>
            )}
        </div>
    );
};

export default ChatView;