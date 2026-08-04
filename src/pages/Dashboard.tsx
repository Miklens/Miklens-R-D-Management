import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useExperiments } from '../contexts/ExperimentContext';
import { useTasks } from '../contexts/TaskContext';
import { ScientistHub } from '../components/ScientistHub';
import { ExecutiveControlTower } from '../components/ExecutiveControlTower';
import { exportToPDF } from '../utils/exportUtils';
import { format } from 'date-fns';
import { 
  Plus, Workflow, Pipette, Beaker, MapPin, Sparkles, Clock, Edit3, 
  CheckSquare, CheckCircle2, Circle, FileText, Download, Award, ArrowRight 
} from 'lucide-react';

const StatCard = ({ title, value, change, link, icon: Icon, color = 'emerald' }: { title: string; value: string; change: string; link?: string; icon?: any; color?: 'emerald' | 'purple' | 'amber' | 'blue' }) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
  };

  const content = (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-center justify-between">
        <dt className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</dt>
        {Icon && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <dd className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{value}</span>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/40">
          {change}
        </span>
      </dd>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

export const Dashboard: React.FC = () => {
  const { profile, userRole } = useAuth();
  const { data: users } = useUsers();
  const { data: logs } = useDailyLogs();
  const { tasks, toggleTaskStatus } = useTasks();
  const { experiments, labTests, stabilityLogs } = useExperiments();

  const isManagement = userRole === 'Admin' || userRole === 'Management';

  // Quick 1-Click Executive PDF Download
  const handleQuickDownloadPDF = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    exportToPDF(
      {
        title: 'MIKLENS R&D PIPELINE STATUS REPORT',
        subtitle: 'Cumulative Scientific State Conclusions & Verdicts',
        dateRangeText: `Generated on: ${todayStr}`,
        scopeText: 'Scope: All Active R&D Products & Commercialization Projects',
        headers: ['Metric', 'Value', 'Status'],
        rows: [
          ['Total Experiments', activeExpCount.toString(), activeExpCount > 0 ? 'Active' : 'None'],
          ['Passed Verdicts', passedCount.toString(), passedCount > 0 ? 'Approved' : 'Pending'],
          ['Active Scientists', scientistCount.toString(), '100% Active'],
          ['Report Generated', todayStr, 'Latest'],
        ],
      },
      `Miklens_RnD_Report_${todayStr}.pdf`
    );
  };

  // Stats
  const activeExpCount = experiments.length;
  const passedCount = experiments.filter((e) => e.outcomeStatus === 'Passed').length + labTests.filter((l) => l.outcomeStatus === 'Passed').length;
  const scientistCount = useMemo(() => users.filter(u => u.role === 'Scientist' && u.isActive).length, [users]);

  const relevantLogs = useMemo(() => {
    if (isManagement) return logs;
    return logs.filter(l => l.userId === profile?.id);
  }, [logs, isManagement, profile?.id]);

  const recentActivity = useMemo(
    () => [...relevantLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [relevantLogs]
  );

  const userName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner with 1-Click Quick Actions */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {isManagement ? 'Management Portal' : 'Scientist Workbench'}
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1.5">
            {isManagement ? 'Executive Control Center' : `Welcome back, ${profile?.name?.split(' ')[0] || 'Scientist'}`}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Miklens Bio-Tech Enterprise Research & Development Platform</p>
        </div>

        {/* 1-CLICK QUICK ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/trial-sync"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all active:scale-95"
          >
            <MapPin className="w-4 h-4 text-purple-200" />
            ⚡ Trial Manager Sync
          </Link>

          <Link
            to="/research-log"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            + Log Today's Work
          </Link>

          <button
            onClick={handleQuickDownloadPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-gray-400" />
            PDF Report
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Hours Logged"
          value={`${relevantLogs.reduce((s, l) => s + (l.timeSpentMinutes || 60), 0) / 60}h`}
          change="Updated Today"
          link="/research-log"
          icon={Clock}
          color="emerald"
        />
        <StatCard
          title="Active Experiments"
          value={activeExpCount.toString()}
          change={activeExpCount > 0 ? `${activeExpCount} In Progress` : 'None Yet'}
          link="/experiments"
          icon={Beaker}
          color="amber"
        />
        <StatCard
          title="Passed Verdicts"
          value={passedCount.toString()}
          change="Scale-Up Approved"
          link="/experiments"
          icon={Award}
          color="purple"
        />
        <StatCard
          title="Active Scientists"
          value={scientistCount.toString()}
          change="100% Active"
          link="/team-activity"
          icon={Workflow}
          color="blue"
        />
      </div>

      {/* Executive Management Widget */}
      {isManagement && <ExecutiveControlTower />}

      {/* Scientist Workspace Hub */}
      <ScientistHub />

      {/* Recent R&D Activity Feed & Pending Tasks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Daily Logs */}
        <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-5 shadow-sm dark:border-gray-800/80 dark:bg-gray-900/80">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Recent Daily Research Logs
            </h3>
            <Link to="/research-log" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">{userName(log.userId)}</span>
                  <span className="text-[10px] text-gray-400">{log.date?.split('T')[0]}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{log.activities}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Global Tasks */}
        <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-5 shadow-sm dark:border-gray-800/80 dark:bg-gray-900/80">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-500" />
              Pending R&D Milestones
            </h3>
            <Link to="/tasks" className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline">
              Task Center
            </Link>
          </div>

          <div className="space-y-2.5">
            {tasks.slice(0, 4).map((task) => (
              <div key={task.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button onClick={() => toggleTaskStatus(task.id)}>
                    {task.status === 'Completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>
                  <span className={`font-semibold truncate ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {task.title}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shrink-0">
                  {task.assignedToName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
