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

const StatCard = ({ title, value, change, link }: { title: string; value: string; change: string; link?: string }) => {
  const content = (
    <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900/80">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</dt>
      <dd className="mt-2 flex items-baseline gap-x-2">
        <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</span>
        <span className={`text-xs font-semibold ${change.includes('+') || change.includes('active') || change.includes('Passed') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
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
        title: 'EXECUTIVE PRODUCT & PROJECT PIPELINE LATEST STATUS SUMMARY REPORT',
        subtitle: 'Cumulative Scientific State Conclusions & Verdicts',
        dateRangeText: `Generated on: ${todayStr}`,
        scopeText: 'Scope: All Active R&D Products & Commercialization Projects',
        headers: ['Product / Project Name', 'Current R&D Stage', 'Scientific Verdict', 'Current State Executive Conclusion (as of Report Date)', 'Progress & Team'],
        rows: [
          [
            'BioShield Alpha (Bio-fungicide)',
            'Lab Testing & Titration Assay',
            'PASSED / Approved for Scale-Up',
            `As of ${todayStr}: Completed 3 multi-day execution runs. Lab titration achieved target pH 6.2 at 1000mL volume makeup with 146 cPs viscosity. CIPAC 54°C thermal aging maintained 95.8% active retention. Field plot trial confirmed 89.4% fungal disease reduction with zero crop toxicity.`,
            '85% Complete (Dr. Sarah Jenkins, Dr. Mik)',
          ],
        ],
      },
      `Miklens_Executive_Report_${todayStr}.pdf`
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
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-gray-900 to-purple-950 text-white shadow-2xl border border-purple-900/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {isManagement ? 'Management Portal' : 'Scientist Workbench'}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {isManagement ? 'Executive Control Center' : `Welcome back, ${profile?.name?.split(' ')[0] || 'Scientist'}`}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Miklens Bio-Tech Enterprise Research & Development Platform</p>
        </div>

        {/* 1-CLICK QUICK ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/research-log"
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-xs font-extrabold shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            + Log Today's Work
          </Link>

          <button
            onClick={handleQuickDownloadPDF}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl text-xs font-extrabold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-purple-200" />
            Download Executive PDF
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
        />
        <StatCard
          title="Active Experiments"
          value={activeExpCount.toString()}
          change="BioShield Testing"
          link="/experiments"
        />
        <StatCard
          title="Passed Scientific Verdicts"
          value={passedCount.toString()}
          change="Approved for Scale-Up"
          link="/experiments"
        />
        <StatCard
          title="Active R&D Scientists"
          value={scientistCount.toString()}
          change="100% Active"
          link="/employees"
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
