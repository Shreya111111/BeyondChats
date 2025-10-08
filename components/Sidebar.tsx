
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, MessageSquare, BookOpen, Youtube } from 'lucide-react';
import SourceSelector from './SourceSelector';
import { APP_NAME } from '../constants';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center p-3 my-1 rounded-lg transition-colors ${
            isActive
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`;

    return (
        <div
            className={`
                absolute md:relative z-20 md:z-auto bg-white dark:bg-gray-800 shadow-lg 
                flex-shrink-0 w-64 md:w-72 transition-transform duration-300 ease-in-out 
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                flex flex-col
            `}
        >
            <div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
                 <BookOpen className="h-8 w-8 text-primary-500" />
                <h1 className="text-2xl font-bold ml-2 text-gray-800 dark:text-white">{APP_NAME}</h1>
            </div>
            <nav className="flex-1 p-4">
                <NavLink to="/dashboard" className={navLinkClass} onClick={() => setIsOpen(false)}>
                    <LayoutDashboard className="mr-3" />
                    Dashboard
                </NavLink>
                <NavLink to="/quiz" className={navLinkClass} onClick={() => setIsOpen(false)}>
                    <BrainCircuit className="mr-3" />
                    Generate Quiz
                </NavLink>
                <NavLink to="/chat" className={navLinkClass} onClick={() => setIsOpen(false)}>
                    <MessageSquare className="mr-3" />
                    Chat with PDF
                </NavLink>
                 <NavLink to="/recommendations" className={navLinkClass} onClick={() => setIsOpen(false)}>
                    <Youtube className="mr-3" />
                    Video Recommendations
                </NavLink>
            </nav>
            <div className="p-4 border-t dark:border-gray-700">
                <SourceSelector />
            </div>
        </div>
    );
};

export default Sidebar;
