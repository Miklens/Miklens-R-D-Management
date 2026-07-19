import React, { useState } from 'react';
import { Bell, Check, X, Trash2, Mail, MessageSquare, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const mockNotifications = [
  { id: 1, title: 'New approval request', message: 'Dr. Sarah submitted a research log for approval', time: '5 minutes ago', type: 'approval', unread: true },
  { id: 2, title: 'Experiment milestone reached', message: 'Project Alpha reached 75% completion', time: '1 hour ago', type: 'info', unread: true },
  { id: 3, title: 'Task assigned', message: 'You were assigned to Field Trial #42', time: '2 hours ago', type: 'task', unread: true },
  { id: 4, title: 'Meeting reminder', message: 'R&D Team Sync in 30 minutes', time: '3 hours ago', type: 'reminder', unread: false },
  { id: 5, title: 'Document uploaded', message: 'New report uploaded to Documents Hub', time: 'Yesterday', type: 'info', unread: false },
  { id: 6, title: 'Status update', message: 'Lab Test results are ready for review', time: 'Yesterday', type: 'info', unread: false },
];

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => n.unread) 
    : notifications;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'task': return <Check className="w-5 h-5 text-blue-500" />;
      case 'reminder': return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'info': return <MessageSquare className="w-5 h-5 text-gray-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            filter === 'unread' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center shadow-lg border border-gray-100 dark:border-gray-800">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No notifications</p>
          </div>
        ) : (
          filteredNotifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-800 flex items-start gap-4 ${
                notif.unread ? 'border-l-4 border-l-emerald-500' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{notif.title}</h3>
                  {notif.unread && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
              </div>
              <div className="flex items-center gap-1">
                {notif.unread && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-emerald-500 transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};