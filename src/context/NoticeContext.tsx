import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export interface Notice {
  id: string;
  institute_id?: string;
  title: string;
  message: string;
  sender: string;
  createdAt: string;
  priority: 'normal' | 'urgent';
}

interface NoticeContextType {
  notices: Notice[];
  latestNotice: Notice | null;
  isLoading: boolean;
  addNotice: (title: string, message: string, priority?: 'normal' | 'urgent') => Promise<void>;
  dismissNotice: (id: string) => void;
  refreshNotices: () => Promise<void>;
}

const NoticeContext = createContext<NoticeContextType | undefined>(undefined);

export const NoticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Normalize Supabase database rows into your app's Notice format
  const formatNotice = (item: any): Notice => ({
    id: item.id,
    institute_id: item.institute_id,
    title: item.title,
    message: item.message,
    sender: item.sender || 'Director Office',
    createdAt: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    priority: item.priority || 'normal',
  });

  // Fetch notices directly from PostgreSQL
  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices((data || []).map(formatNotice));
    } catch (err: any) {
      console.error('Failed to load notices:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Broadcast a new notice directly to Supabase
  const addNotice = async (title: string, message: string, priority: 'normal' | 'urgent' = 'normal') => {
    const instituteId = currentUser?.institute_id || 'inst_apex_01';
    const senderName = currentUser?.name ? `${currentUser.name} (Director)` : 'Dr. Suresh Verma (Director)';

    const { error } = await supabase.from('notices').insert({
      institute_id: instituteId,
      sender: senderName,
      title: title.trim(),
      message: message.trim(),
      priority,
    });

    if (error) {
      console.error('Error broadcasting notice:', error.message);
      throw error;
    }
  };

  const dismissNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    fetchNotices();

    // Supabase Realtime channel for instant broadcasts across windows
    const channel = supabase
      .channel('realtime:notices')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notices',
        },
        (payload) => {
          const newFormatted = formatNotice(payload.new);
          setNotices((prev) => [newFormatted, ...prev.filter((n) => n.id !== newFormatted.id)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const latestNotice = notices.length > 0 ? notices[0] : null;

  return (
    <NoticeContext.Provider
      value={{
        notices,
        latestNotice,
        isLoading,
        addNotice,
        dismissNotice,
        refreshNotices: fetchNotices,
      }}
    >
      {children}
    </NoticeContext.Provider>
  );
};

export const useNotice = () => {
  const context = useContext(NoticeContext);
  if (!context) {
    throw new Error('useNotice must be used within a NoticeProvider');
  }
  return context;
};