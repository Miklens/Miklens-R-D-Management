import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Clock, Plus, Trash2, CheckSquare, Search, Filter, 
  Tag, Calendar, User, AlertCircle, Link2, ChevronRight, Layers, Beaker, FlaskConical 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../contexts/TaskContext';
import { useExperiments } from '../contexts/ExperimentContext';
import type { GlobalTask, TaskPriority, TaskType, TaskEntityType } from '../types/taskTypes';
import { useAuth } from '../contexts/AuthContext';

export const Tasks: React.FC = () => {
  const { tasks, addTask, deleteTask, toggleTaskStatus } = useTasks();
  const { profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [type, setType] = useState<TaskType>('Task');
  const [entityType, setEntityType] = useState<TaskEntityType>('product');
  const [entityName, setEntityName] = useState('');
  const [assignedToName, setAssignedToName] = useState(profile?.name || '');
  const [dueDate, setDueDate] = useState('');

  // Use live products/experiments from context if available, otherwise empty
  const { allProducts } = useExperiments();
  const PRODUCTS = allProducts && allProducts.length > 0 ? allProducts : [];
  const PROJECTS: string[] = [];
  const EXPERIMENTS: string[] = [];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      status: 'Pending',
      priority,
      type,
      entityType,
      entityName: entityType !== 'general' ? entityName : undefined,
      assignedToName: assignedToName || 'Unassigned',
      dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    });

    setTitle('');
    setDescription('');
    setShowAddForm(false);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.entityName && task.entityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.assignedToName && task.assignedToName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'All'
        ? true
        : selectedStatus === 'Pending'
        ? task.status === 'Pending' || task.status === 'In Progress'
        : task.status === selectedStatus;

    const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;
    const matchesType = selectedType === 'All' || task.type === selectedType;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'High':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const getEntityIcon = (eType: TaskEntityType) => {
    switch (eType) {
      case 'product':
        return <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />;
      case 'experiment':
        return <Beaker className="w-3.5 h-3.5 text-purple-500" />;
      case 'project':
        return <Layers className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Link2 className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            Global Task & Milestone Center
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Seamlessly manage and track tasks linked across Products, Experiments, Projects, and Scientists.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Linked Task
        </button>
      </div>

      {/* Add Task Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCreateTask}
            className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-emerald-100 dark:border-gray-800 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" /> Create New Global Task
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Conduct shelf-life testing at 54°C for Batch 2026-B"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Task Type</label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                >
                  <option value="Task">General Task</option>
                  <option value="Milestone">Key Milestone</option>
                  <option value="Experiment Action">Experiment Action</option>
                  <option value="Regulatory">Regulatory Compliance</option>
                  <option value="Field Trial">Field Trial Task</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Link To Entity</label>
                <select
                  value={entityType}
                  onChange={(e: any) => {
                    const et = e.target.value;
                    setEntityType(et);
                    if (et === 'product') setEntityName(PRODUCTS[0]);
                    if (et === 'project') setEntityName(PROJECTS[0]);
                    if (et === 'experiment') setEntityName(EXPERIMENTS[0]);
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                >
                  <option value="product">Product Portfolio</option>
                  <option value="experiment">Experiment / Test</option>
                  <option value="project">Project</option>
                  <option value="general">General / Standalone</option>
                </select>
              </div>

              {entityType !== 'general' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target {entityType}</label>
                  <select
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  >
                    {entityType === 'product' && PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                    {entityType === 'project' && PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                    {entityType === 'experiment' && EXPERIMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Assigned Scientist</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={assignedToName}
                  onChange={(e) => setAssignedToName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                Create Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tasks, products, scientists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Open / Active</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
          >
            <option value="All">All Types</option>
            <option value="Task">Task</option>
            <option value="Milestone">Milestone</option>
            <option value="Experiment Action">Experiment Action</option>
            <option value="Regulatory">Regulatory</option>
            <option value="Field Trial">Field Trial</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white shadow-lg dark:bg-gray-900">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No tasks match your filter criteria.</p>
            <p className="text-xs text-gray-400 mt-1">Try clearing filters or adding a new global task.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredTasks.map((task, index) => (
              <motion.li
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                key={task.id}
                className="p-5 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Status Toggle & Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 flex-shrink-0"
                      title="Click to toggle status"
                    >
                      {task.status === 'Completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : task.status === 'In Progress' ? (
                        <Clock className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600 hover:text-emerald-500 transition-colors" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm font-bold truncate ${
                            task.status === 'Completed'
                              ? 'text-gray-400 line-through dark:text-gray-500'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </p>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {task.type}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Linkage Metadata Pill */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                        {task.entityName && (
                          <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md text-[11px]">
                            {getEntityIcon(task.entityType)}
                            <span>{task.entityName}</span>
                          </div>
                        )}

                        {task.assignedToName && (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{task.assignedToName}</span>
                          </div>
                        )}

                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>Due: {task.dueDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        task.status === 'Completed'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {task.status === 'Completed' ? 'Reopen' : 'Mark Done'}
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
