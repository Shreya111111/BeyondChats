import React, { useState } from 'react';
import { useQuizAttempts } from '../hooks/useQuizAttempts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, CheckCircle, Target, Clock, AlertTriangle } from 'lucide-react';
import { QuizAttempt } from '../types';
import AttemptDetailModal from './AttemptDetailModal';

const DashboardView: React.FC = () => {
    const { attempts, clearAttempts } = useQuizAttempts();
    const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);

    const overallScore = attempts.length > 0
        ? attempts.reduce((acc, a) => acc + (a.score / a.total), 0) / attempts.length * 100
        : 0;

    const topicPerformance = attempts.flatMap(a => 
        a.questions.map((q, i) => ({
            topic: q.topic,
            score: a.gradedResults && a.gradedResults[i] ? a.gradedResults[i].score : 0,
        }))
    ).reduce((acc, { topic, score }) => {
        if (!acc[topic]) {
            acc[topic] = { totalScore: 0, count: 0 };
        }
        acc[topic].totalScore += score;
        acc[topic].count++;
        return acc;
    }, {} as Record<string, { totalScore: number; count: number }>);


    const performanceData = Object.entries(topicPerformance).map(([topic, data]) => ({
        name: topic,
        'Score %': (data.totalScore / data.count) * 100
    }));

    const strengths = performanceData.filter(d => d['Score %'] >= 75).map(d => d.name);
    const weaknesses = performanceData.filter(d => d['Score %'] < 50).map(d => d.name);
    
    const recentAttempts = [...attempts].reverse().slice(0, 5);

    return (
        <>
            <div className="space-y-8 animate-fade-in">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Learning Journey</h1>

                {attempts.length === 0 ? (
                     <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <Brain className="mx-auto h-16 w-16 text-primary-400" />
                        <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">No Attempts Yet!</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Generate a quiz from a PDF to start tracking your progress.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard icon={<Target />} title="Overall Score" value={`${overallScore.toFixed(1)}%`} />
                            <StatCard icon={<CheckCircle />} title="Quizzes Taken" value={attempts.length.toString()} />
                            <StatCard icon={<CheckCircle color="green" />} title="Strengths" value={strengths.length.toString()} />
                            <StatCard icon={<AlertTriangle color="orange" />} title="Weaknesses" value={weaknesses.length.toString()} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                                 <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Performance by Topic</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                        <XAxis dataKey="name" tick={{ fill: 'currentColor' }} />
                                        <YAxis tick={{ fill: 'currentColor' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#e5e7eb' }} />
                                        <Legend />
                                        <Bar dataKey="Score %" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Recent Attempts</h2>
                                <ul className="space-y-3">
                                    {recentAttempts.map(attempt => (
                                        <li key={attempt.id}>
                                            <button
                                                onClick={() => setSelectedAttempt(attempt)}
                                                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <div className="truncate">
                                                    <p className="font-medium truncate text-gray-800 dark:text-gray-200">{attempt.pdfName}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center"><Clock size={14} className="mr-1.5" />{new Date(attempt.date).toLocaleString()}</p>
                                                </div>
                                                {attempt.total > 0 ? (
                                                    <span className={`font-bold text-lg ${attempt.score / attempt.total >= 0.7 ? 'text-green-500' : attempt.score / attempt.total >= 0.4 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                        {((attempt.score / attempt.total) * 100).toFixed(0)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-medium text-gray-400 dark:text-gray-500">Review</span>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                         <div className="text-center mt-8">
                            <button 
                                onClick={() => {if(window.confirm('Are you sure you want to delete all your quiz history?')) clearAttempts()}}
                                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                            >
                                Clear All History
                            </button>
                        </div>
                    </>
                )}
            </div>
            <AttemptDetailModal 
                attempt={selectedAttempt}
                onClose={() => setSelectedAttempt(null)}
            />
        </>
    );
};

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full text-primary-500">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);


export default DashboardView;