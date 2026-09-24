import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DebateSession } from '../types';
import { Activity, Clock, ShieldCheck } from 'lucide-react';

interface SessionD3ChartProps {
  selectedSessions: DebateSession[];
}

export const SessionD3Chart: React.FC<SessionD3ChartProps> = ({ selectedSessions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  // Keep track of container size reactively
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Calculate height based on number of items (minimum 250px)
      const calculatedHeight = Math.max(260, selectedSessions.length * 75 + 60);
      setDimensions({
        width: Math.max(280, width),
        height: calculatedHeight,
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [selectedSessions.length]);

  // Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || selectedSessions.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 40, right: 30, bottom: 40, left: 160 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Prepare data
    const data = selectedSessions.map((s) => {
      const consensusRate = s.metrics?.consensusRate ?? (s.finalOutput ? 90 : 75);
      const durationSec = (s.metrics?.durationMs ?? 0) / 1000;
      // Shorten prompt for label
      const shortPrompt = s.prompt.length > 22 ? s.prompt.slice(0, 20) + '...' : s.prompt;
      return {
        id: s.id,
        prompt: s.prompt,
        shortPrompt,
        consensusRate,
        durationSec,
        durationMs: s.metrics?.durationMs ?? 0,
      };
    });

    // Create scales
    const yScale = d3.scaleBand()
      .domain(data.map((d) => d.id))
      .range([0, chartHeight])
      .padding(0.3);

    // Group scales: one for consensus, one for duration
    const ySubScale = d3.scaleBand()
      .domain(['consensus', 'duration'])
      .range([0, yScale.bandwidth()])
      .padding(0.1);

    // X scale for Consensus (0 to 100%)
    const xConsensusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, chartWidth]);

    // X scale for Duration (seconds)
    const maxDurationSec = d3.max(data, (d) => d.durationSec) || 10;
    const xDurationScale = d3.scaleLinear()
      .domain([0, Math.max(maxDurationSec, 5)]) // at least 5s scale
      .range([0, chartWidth]);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add Gridlines
    g.append('g')
      .attr('class', 'grid-lines opacity-10')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(
        d3.axisBottom(xConsensusScale)
          .ticks(5)
          .tickSize(-chartHeight)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#475569');

    // Draw Session Bars Groups
    const sessionGroups = g.selectAll('.session-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'session-group')
      .attr('transform', (d) => `translate(0, ${yScale(d.id)})`);

    // Draw Consensus Bars
    sessionGroups.append('rect')
      .attr('x', 0)
      .attr('y', ySubScale('consensus') || 0)
      .attr('height', ySubScale.bandwidth())
      .attr('fill', 'url(#consensus-gradient)')
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('class', 'transition-all duration-300')
      .attr('width', 0) // Start at 0 for animation
      .transition()
      .duration(800)
      .attr('width', (d) => xConsensusScale(d.consensusRate));

    // Draw Duration Bars
    sessionGroups.append('rect')
      .attr('x', 0)
      .attr('y', ySubScale('duration') || 0)
      .attr('height', ySubScale.bandwidth())
      .attr('fill', 'url(#duration-gradient)')
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('class', 'transition-all duration-300')
      .attr('width', 0) // Start at 0 for animation
      .transition()
      .duration(800)
      .attr('width', (d) => xDurationScale(d.durationSec));

    // Add Consensus Text Labels
    sessionGroups.append('text')
      .attr('x', (d) => xConsensusScale(d.consensusRate) + 6)
      .attr('y', (ySubScale('consensus') || 0) + ySubScale.bandwidth() / 2 + 3.5)
      .attr('fill', '#10b981')
      .attr('font-size', '9.5px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d) => `${d.consensusRate}%`);

    // Add Duration Text Labels
    sessionGroups.append('text')
      .attr('x', (d) => xDurationScale(d.durationSec) + 6)
      .attr('y', (ySubScale('duration') || 0) + ySubScale.bandwidth() / 2 + 3.5)
      .attr('fill', '#f59e0b')
      .attr('font-size', '9.5px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d) => d.durationMs > 0 ? `${(d.durationMs / 1000).toFixed(1)}s` : '0s');

    // Custom Y-Axis Labels
    const yAxisG = g.append('g')
      .attr('class', 'y-axis');

    yAxisG.selectAll('.y-axis-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'y-axis-label cursor-help fill-slate-300 hover:fill-white font-medium text-[11px] transition-colors')
      .attr('x', -12)
      .attr('y', (d) => (yScale(d.id) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('font-family', 'ui-serif, Georgia, Cambria, Times New Roman, Times, serif')
      .text((d) => d.shortPrompt)
      .append('title')
      .text((d) => d.prompt);

    // Dual Bottom X-Axes Legend/Indicators
    const bottomAxisG = g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`);

    // Simple top axis header
    svg.append('text')
      .attr('x', margin.left)
      .attr('y', 24)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('letter-spacing', '0.05em')
      .text('COMPARATIVE INSIGHTS (CONSENSUS RATE % vs DURATION SECONDS)');

    // Definitions for gradients
    const defs = svg.append('defs');

    // Consensus Rate Gradient (Emerald to Mint)
    const consensusGrad = defs.append('linearGradient')
      .attr('id', 'consensus-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    consensusGrad.append('stop').attr('offset', '0%').attr('stop-color', '#047857').attr('stop-opacity', 0.85);
    consensusGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.95);

    // Duration Gradient (Amber to Gold)
    const durationGrad = defs.append('linearGradient')
      .attr('id', 'duration-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    durationGrad.append('stop').attr('offset', '0%').attr('stop-color', '#b45309').attr('stop-opacity', 0.85);
    durationGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.95);

  }, [selectedSessions, dimensions]);

  if (selectedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[220px] rounded-xl border border-dashed border-[#202636] bg-[#090b11]/60 p-6 text-center">
        <Activity className="h-7 w-7 text-slate-600 mb-2 animate-pulse" />
        <p className="text-xs text-slate-400 font-serif">No comparison targets selected</p>
        <p className="text-[10px] text-slate-500 font-mono mt-1">
          Check two or more sessions on the left to map their consensus and runtimes.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-[#080a10]/40 rounded-xl border border-[#1b2131]/80 p-4 flex flex-col justify-between">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="mx-auto block"
        />
      </div>

      {/* Legend Block */}
      <div className="mt-4 pt-3 border-t border-[#181d2b] flex items-center justify-center gap-6 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-emerald-500 shadow-sm shadow-emerald-500/25" />
          <span className="text-slate-300 font-medium">Consensus Rate</span>
          <span className="text-slate-500">(0 - 100%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-amber-500 shadow-sm shadow-amber-500/25" />
          <span className="text-slate-300 font-medium">Duration</span>
          <span className="text-slate-500">(Seconds)</span>
        </div>
      </div>
    </div>
  );
};
