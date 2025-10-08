
import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import QuizView from './components/QuizView';
import ChatView from './components/ChatView';
import RecommendationsView from './components/RecommendationsView';
import { PdfProvider } from './contexts/PdfContext';
import { Menu, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <PdfProvider>
            <HashRouter>
                <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                    <Toaster position="top-center" reverseOrder={false} />
                    <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <header className="bg-white dark:bg-gray-800 shadow-md p-2 md:hidden">
                            <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
                                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </header>
                        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                            <Routes>
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/dashboard" element={<DashboardView />} />
                                <Route path="/quiz" element={<QuizView />} />
                                <Route path="/chat" element={<ChatView />} />
                                <Route path="/recommendations" element={<RecommendationsView />} />
                            </Routes>
                        </main>
                    </div>
                </div>
            </HashRouter>
        </PdfProvider>
    );
};

export default App;
