import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { Layers, Users, FlaskConical } from 'lucide-react';
import { useDailyLogs } from '../hooks/useDailyLogs';
import { useUsers } from '../hooks/useUsers';
import { calculateLogMinutes } from '../utils/timeTracking';

const CATEGORY_COLORS: Record<string, string> = {
  HERBICIDE: '#10B981', // emerald
  FUNGICIDE: '#3B82F6', // blue
  PESTICIDE: '#F59E0B', // amber
  NUTRITION: '#8B5CF6', // purple
  BIOSTIMULANT: '#EC4899', // pink
  GENERAL: '#6B7280' // gray
};

export const ScientistEffortHeatmap: React.FC = () => {
  const { data: logs = [] } = useDailyLogs();
  const { data: users = [] } = useUsers();

  // Scientist vs Work Category Effort Data
  const scientistEffortMatrix = useMemo(() => {
    return users.map(user => {
      const uEmail = (user.email || '').toLowerCase();
      const uHandle = uEmail ? uEmail.split('@')[0] : '';

      const userLogs = logs.filter(l => {
        const logUser = (l.userId || '').toLowerCase();
        return logUser === user.id.toLowerCase() || logUser === uEmail || (uHandle && logUser.includes(uHandle));
      });

      const fieldHours = (userLogs.filter(l => (l.activities || '').toLowerCase().includes('field')).reduce((acc, l) => acc + calculateLogMinutes(l), 0) / 60);
      const labHours = (userLogs.filter(l => (l.activities || '').toLowerCase().includes('lab') || (l.objective || '').toLowerCase().includes('assay')).reduce((acc, l) => acc + calculateLogMinutes(l), 0) / 60);
      const formulationHours = (userLogs.filter(l => (l.activities || '').toLowerCase().includes('formulation') || (l.objective || '').toLowerCase().includes('stability')).reduce((acc, l) => acc + calculateLogMinutes(l), 0) / 60);
      const officeHours = (userLogs.filter(l => (l.activities || '').toLowerCase().includes('report') || (l.activities || '').toLowerCase().includes('doc')).reduce((acc, l) => acc + calculateLogMinutes(l), 0) / 60);

      return {
        name: user.name?.split(' ')[0] || 'Scientist',
        field: parseFloat(fieldHours.toFixed(1)),
        lab: parseFloat(labHours.toFixed(1)),
        formulation: parseFloat(formulationHours.toFixed(1)),
        office: parseFloat(officeHours.toFixed(1)),
        total: parseFloat((fieldHours + labHours + formulationHours + officeHours).toFixed(1))
      };
    });
  }, [users, logs]);

  // Product Category Resource Allocation Data
  const productEffortData = useMemo(() => {
    const catMap: Record<string, number> = {
      HERBICIDE: 0,
      FUNGICIDE: 0,
      PESTICIDE: 0,
      NUTRITION: 0,
      BIOSTIMULANT: 0
    };

    logs.forEach(l => {
      const text = `${l.objective} ${l.activities}`.toUpperCase();
      let found = false;
      for (const cat of Object.keys(catMap)) {
        if (text.includes(cat)) {
          catMap[cat] += calculateLogMinutes(l) / 60;
          found = true;
          break;
        }
      }
      if (!found) {
        catMap.HERBICIDE += calculateLogMinutes(l) / 60;
      }
    });

    return Object.entries(catMap).map(([name, hours]) => ({
      name,
      value: parseFloat(hours.toFixed(1)),
      color: CATEGORY_COLORS[name] || '#10B981'
    }));
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            Scientist Work Allocation & Resource Heatmap
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Visual breakdown of scientist effort across Field, Lab, Formulation, and Office categories.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scientist vs Work Category Stacked Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            Scientist Effort Distribution (Hours)
          </h4>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scientistEffortMatrix} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                />
                <Bar dataKey="field" name="Field Trials" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="lab" name="Lab Assays" stackId="a" fill="#3B82F6" />
                <Bar dataKey="formulation" name="Formulation" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="office" name="Office & Reports" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Category Resource Allocation Pie Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-500" />
            Product Resource Share
          </h4>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productEffortData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {productEffortData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderRadius: '12px', color: '#FFF', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {productEffortData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="font-black text-gray-900 dark:text-white">{item.value} hrs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
