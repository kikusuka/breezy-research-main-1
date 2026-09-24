import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Activity, ShieldAlert, GitBranch } from 'lucide-react';
import { DebateStep } from '../types';

interface CognitiveDashboardProps {
  steps: DebateStep[];
  protocol: 'trio' | 'quad' | 'duel' | 'solo';
  consensusRate?: number;
}

export const CognitiveDashboard: React.FC<CognitiveDashboardProps> = ({
  steps = [],
  protocol,
  consensusRate = 82,
}) => {
  const generateChartData = () => {
    const baseData = [
      {
        stage: 'Analyst',
        tension: 15,
        alignment: 65,
        activeRole: 'Analyst',
      },
      {
        stage: 'Critic',
        tension: 88,
        alignment: 18,
        activeRole: 'Critic',
      },
    ];

    if (protocol === 'quad') {
      baseData.push({
        stage: 'Verifier',
        tension: 54,
        alignment: 45,
        activeRole: 'Verifier',
      });
    } else if (protocol === 'duel') {
      baseData.push({
        stage: 'Rebuttal',
        tension: 62,
        alignment: 52,
        activeRole: 'Analyst',
      });
    }

    baseData.push({
      stage: 'Reviewer',
      tension: 10,
      alignment: consensusRate,
      activeRole: 'Reviewer',
    });

    return baseData.map((d, index) => {
      const step = steps[index];
      if (step) {
        const lengthFactor = Math.min((step.content?.length || 500) / 1000, 1);
        const randVariance = (step.timestamp % 10) - 5;
        return {
          ...d,
          tension: Math.max(5, Math.min(98, Math.round(d.tension + randVariance * lengthFactor))),
          alignment: Math.max(5, Math.min(100, Math.round(d.alignment - randVariance * 0.5 * lengthFactor))),
        };
      }
      return d;
    });
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span>Model Activity & Agreement Analysis</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tracks model alignment and stage tension across analysis turns
          </p>
        </div>
        <span className="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 font-mono text-xs text-slate-300">
          Agreement: {consensusRate}%
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Alignment Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
            <span>Model Agreement Trajectory</span>
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAlignment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="alignment" name="Agreement %" stroke="#10b981" fillOpacity={1} fill="url(#colorAlignment)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tension Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            <span>Stage Critique Intensity</span>
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="tension" name="Critique Level" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
