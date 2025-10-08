

import React, { useState, useEffect, useRef } from 'react';
import { usePdf } from '../contexts/PdfContext';
import { getYouTubeRecommendations } from '../services/geminiService';
import { YouTubeRecommendation, GroundingSource } from '../types';
import { Youtube, Sparkles, Film, ExternalLink, Search, VideoOff } from 'lucide-react';
import toast from 'react-hot-toast';

const getYouTubeIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1).split('?')[0];
        }
        if (urlObj.hostname.includes('youtube.com')) {
            const videoId = urlObj.searchParams.get('v');
            if (videoId) {
                return videoId;
            }
        }
    } catch (e) {
        // Fallback for malformed URLs that might still be parsable with regex
    }

    // Regex fallback for various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return match[2];
    }
    return null;
};

const validateYouTubeId = async (videoId: string | null): Promise<boolean> => {
    if (!videoId) return false;
    try {
        // Using a HEAD request to check for the thumbnail's existence is an efficient
        // way to verify if a video ID is valid and public.
        const response = await fetch(`https://img.youtube.com/vi/${videoId}/0.jpg`, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error(`Validation failed for video ID ${videoId}:`, error);
        return false;
    }
};

const loadingMessages = [
    "Consulting the YouTube archives...",
    "Cross-referencing with your document...",
    "Asking the algorithm for its top picks...",
    "Filtering out the clickbait...",
    "Verifying all video links..."
];

const RecommendationsView: React.FC = () => {
    const { pdfText, pdfName, isLoading: isPdfLoading } = usePdf();
    const [recommendations, setRecommendations] = useState<YouTubeRecommendation[]>([]);
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const fetchedForPdf = useRef<string | null>(null);

    const handleGenerateRecommendations = async () => {
        if (!pdfText) {
            toast.error('Please upload and process a PDF first.');
            return;
        }

        setIsGenerating(true);
        setNotFound(false);
        setRecommendations([]);
        setSources([]);
        const toastId = toast.loading('AI is searching for videos...');
        try {
            const { recommendations: results, sources: groundingSources } = await getYouTubeRecommendations(pdfText);
            
            if (results.length === 0) {
                 toast.success('The AI could not find any videos for this content.', { id: toastId });
                 setNotFound(true);
                 setIsGenerating(false);
                 return;
            }

            toast.loading(`Verifying ${results.length} video links...`, { id: toastId });

            const validationPromises = results.map(async (rec) => {
                const videoId = getYouTubeIdFromUrl(rec.youtubeUrl);
                const isValid = await validateYouTubeId(videoId);
                return { ...rec, isValid };
            });

            const validatedResultsWithStatus = await Promise.all(validationPromises);
            const validRecommendations = validatedResultsWithStatus.filter(r => r.isValid);

            setRecommendations(validRecommendations);
            setSources(groundingSources);

            if (validRecommendations.length === 0) {
                 toast.error('AI found videos, but none could be verified. Please try again.', { id: toastId });
                 setNotFound(true);
            } else {
                toast.success(`Found and verified ${validRecommendations.length} great videos for you!`, { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "An unknown error occurred.", { id: toastId });
            setNotFound(true);
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        let interval: number;
        if (isGenerating) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isGenerating]);
    
     useEffect(() => {
        // If the active PDF has changed, reset the state
        if (pdfName && pdfName !== fetchedForPdf.current) {
            setRecommendations([]);
            setSources([]);
            setNotFound(false);
            fetchedForPdf.current = null;
        }
        // If there's a PDF loaded and we haven't fetched for it yet, fetch automatically
        if (pdfText && !fetchedForPdf.current) {
            handleGenerateRecommendations();
            fetchedForPdf.current = pdfName;
        }
    }, [pdfText, pdfName]);
    
    if (isPdfLoading) {
        return <div className="text-center p-8">Loading PDF...</div>;
    }

    if (!pdfText) {
        return (
            <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <Youtube className="mx-auto h-16 w-16 text-red-500" />
                <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">No PDF Selected</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Please upload a PDF to get relevant video recommendations.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">YouTube Video Recommender</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Discover videos to help you visualize and understand the concepts in <span className="font-semibold text-primary-500">{pdfName}</span>.</p>
            </div>
            
            {isGenerating && (
                 <div className="text-center p-8 space-y-4">
                    <Film className="mx-auto h-12 w-12 text-primary-500 animate-spin" />
                    <p className="text-lg text-gray-600 dark:text-gray-400">{loadingMessage}</p>
                 </div>
            )}
            
            {!isGenerating && notFound && (
                 <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <VideoOff className="mx-auto h-16 w-16 text-primary-400" />
                    <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">No Videos Found</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Sorry, we couldn't find any relevant YouTube videos for this topic.</p>
                     <button 
                        onClick={handleGenerateRecommendations}
                        className="mt-6 flex items-center justify-center mx-auto px-5 py-2 font-semibold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                    >
                        Try Again
                    </button>
                </div>
            )}
            
            {!isGenerating && recommendations.length > 0 && (
                <div className="space-y-8 mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {recommendations.map((rec, index) => {
                            const videoId = getYouTubeIdFromUrl(rec.youtubeUrl);
                            
                            if (!videoId) return null; 

                            return (
                                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105">
                                    <div className="aspect-video bg-black">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${videoId}`}
                                            title={rec.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                    <div className="p-4 flex-grow flex flex-col">
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white line-clamp-2">{rec.title}</h3>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3 flex-grow">{rec.description}</p>
                                        <a 
                                            href={rec.youtubeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 inline-flex items-center text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 self-start"
                                        >
                                            Watch on YouTube <ExternalLink className="ml-1.5" size={16} />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                     {sources.length > 0 && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="flex items-center text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <Search size={18} className="mr-2 text-primary-500" />
                                Information Sources
                            </h4>
                            <ul className="space-y-2">
                                {sources.map((source, index) => (
                                    <li key={index}>
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 dark:text-primary-400 hover:underline truncate flex items-center">
                                           <ExternalLink size={14} className="mr-2 flex-shrink-0" /> {source.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div className="text-center">
                        <button 
                            onClick={handleGenerateRecommendations}
                            className="flex items-center justify-center mx-auto px-5 py-2 font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            disabled={isGenerating}
                        >
                             <Sparkles className="mr-2" size={18} />
                            {isGenerating ? 'Refreshing...' : 'Get New Recommendations'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationsView;