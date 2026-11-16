import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export interface Chapter {
  id: string;
  institute_id: string;
  subject: string;
  chapter_number: number;
  title: string;
  description: string;
  pdf_url: string;
  total_pages: number;
  target_class?: string;
}

interface LibraryContextType {
  chapters: Chapter[];
  isLoading: boolean;
  selectedChapter: Chapter | null;
  setSelectedChapter: (chapter: Chapter | null) => void;
  refreshChapters: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchChapters = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('chapters')
        .select('*')
        .order('chapter_number', { ascending: true });

      // Automatically filter by student enrolled stream if defined
      if (currentUser?.enrolled_subjects && currentUser.enrolled_subjects.length > 0) {
        query = query.in('subject', currentUser.enrolled_subjects);
      }

      const { data, error } = await query;
      if (error) throw error;

      let fetchedChapters = (data as Chapter[]) || [];

      // Filter by student's class (if user is a student)
      if (currentUser?.role === 'student') {
        const studentClass = (
          (currentUser as any).class_name ||
          (currentUser as any).class ||
          (currentUser as any).grade ||
          ''
        )
          .toString()
          .trim()
          .toLowerCase();

        if (studentClass) {
          fetchedChapters = fetchedChapters.filter((ch) => {
            const chapterClass = (ch.target_class || 'All').trim().toLowerCase();
            return chapterClass === 'all' || chapterClass === studentClass;
          });
        }
      }

      setChapters(fetchedChapters);
    } catch (err: any) {
      console.error('Error fetching chapters:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChapters();
    }
  }, [currentUser]);

  return (
    <LibraryContext.Provider
      value={{
        chapters,
        isLoading,
        selectedChapter,
        setSelectedChapter,
        refreshChapters: fetchChapters,
      }}
    >
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