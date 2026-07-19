import React, { useState } from 'react';
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

const mockEvents = [
  { id: 1, title: 'R&D Team Sync', date: new Date(), time: '10:00 AM', type: 'meeting', attendees: 5 },
  { id: 2, title: 'Field Trial Review', date: new Date(), time: '2:00 PM', type: 'review', attendees: 3 },
  { id: 3, title: 'Lab Equipment Calibration', date: new Date(Date.now() + 86400000), time: '9:00 AM', type: 'task', attendees: 1 },
  { id: 4, title: 'Product Launch Discussion', date: new Date(Date.now() + 172800000), time: '11:00 AM', type: 'meeting', attendees: 8 },
];

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'month' | 'week'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (date: Date) => {
    return mockEvents.filter(e => isSameDay(e.date, date));
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500';
      case 'review': return 'bg-purple-500';
      case 'task': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Schedule and manage events</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
          >
            Today
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 min-h-[100px] border-r border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30" />
          ))}
          
          {days.map((day) => {
            const events = getEventsForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-2 min-h-[100px] border-r border-b border-gray-100 dark:border-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                } ${!isSameMonth(day, currentDate) ? 'bg-gray-50 dark:bg-gray-800/30' : ''}`}
              >
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ${
                  isToday(day) ? 'bg-emerald-500 text-white font-bold' : 'text-gray-900 dark:text-white'
                }`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1">
                  {events.slice(0, 2).map((event) => (
                    <div key={event.id} className={`px-2 py-1 rounded text-xs text-white truncate ${getEventColor(event.type)}`}>
                      {event.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-xs text-gray-500">+{events.length - 2} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
          Events for {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        {getEventsForDay(selectedDate).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events scheduled</p>
        ) : (
          <div className="space-y-3">
            {getEventsForDay(selectedDate).map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className={`w-1 h-12 rounded-full ${getEventColor(event.type)}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{event.time}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{event.attendees}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Event</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Event Title</label>
                  <input type="text" placeholder="Enter event title" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time</label>
                    <input type="time" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Event Type</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <option>Meeting</option>
                    <option>Review</option>
                    <option>Task</option>
                    <option>Other</option>
                  </select>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold">
                  Create Event
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};