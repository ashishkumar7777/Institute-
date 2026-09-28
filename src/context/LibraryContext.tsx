import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { mockChapters, type Chapter, type SubjectType } from '../services/mockData';

interface LibraryContextType {
  chapters: Chapter[];
  toggleChapterLock: (chapterId: string) => void;
  getChaptersBySubject: (subject: SubjectType) => Chapter[];
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chapters, setChapters] = useState<Chapter[]>(mockChapters);

  const toggleChapterLock = (chapterId: string) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, isUnlocked: !c.isUnlocked } : c))
    );
  };

  const getChaptersBySubject = (subject: SubjectType) => {
    return chapters.filter((c) => c.subject === subject);
  };

  return (
    <LibraryContext.Provider value={{ chapters, toggleChapterLock, getChaptersBySubject }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};