import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface Notice {
  id: string;
  title: string;
  message: string;
  sender: string;
  createdAt: string;
  priority: 'normal' | 'urgent';
}

interface NoticeContextType {
  notices: Notice[];
  addNotice: (title: string, message: string, priority?: 'normal' | 'urgent') => void;
  dismissNotice: (id: string) => void;
}

const initialNotices: Notice[] = [
  {
    id: 'notif_1',
    title: 'Diwali Break Schedule',
    message: 'Institute remains closed from 28th October to 2nd November. Online revision test starts 3rd Nov.',
    sender: 'Dr. Suresh Verma (Director)',
    createdAt: 'Today, 9:00 AM',
    priority: 'urgent',
  },
  {
    id: 'notif_2',
    title: 'Unit Test 2 Result Declared',
    message: 'Mathematics and Physics test scorecards are now published in your results tab.',
    sender: 'Academic Office',
    createdAt: 'Yesterday',
    priority: 'normal',
  },
];

const NoticeContext = createContext<NoticeContextType | undefined>(undefined);

export const NoticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);

  const addNotice = (title: string, message: string, priority: 'normal' | 'urgent' = 'normal') => {
    const newNotice: Notice = {
      id: `notif_${Date.now()}`,
      title,
      message,
      sender: 'Dr. Suresh Verma (Director)',
      createdAt: 'Just now',
      priority,
    };
    setNotices((prev) => [newNotice, ...prev]);
  };

  const dismissNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NoticeContext.Provider value={{ notices, addNotice, dismissNotice }}>
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