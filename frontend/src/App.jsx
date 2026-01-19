import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, Cell
} from 'recharts';
import { 
  Cpu, Zap, Target, RefreshCcw, Info, FileText, Activity, Lock
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ----------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// ----------------------------------------------------------------
// Change this to your Render URL after deploying the backend
const API_BASE = "http://localhost:5000";

const ELEMENTS = [
  { key: 'C', name: 'Carbon', color: '#f87171', desc: 'Hardness', weight: 700 },
  { key: 'Mn', name: 'Manganese', color: '#60a5fa', desc: 'Strength', weight: 120 },
  { key: 'Si', name: 'Silicon', color: '#34d399', desc: 'Deoxidation', weight: 0 },
  { key: 'Cr', name: 'Chromium', color: '#fbbf24', desc: 'Corrosion', weight: 80 },
  { key: 'Ni', name: 'Nickel', color: '#a78bfa', desc: 'Toughness', weight: 0 },
  { key: 'Mo', name: 'Molybdenum', color: '#f472b6', desc: 'Heat Resist', weight: 250 },
];

const App = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Optimization State
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [constraints, setConstraints] = useState({ min_strength: 750, max_cost: 350 });
  const reportRef = useRef(null);

  // ----------------------------------------------------------------
  // LOGIC & ACTIONS
  // ----------------------------------------------------------------
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "alloy2026") {
      setIsAuthenticated(true);
    } else {
      alert("Unauthorized Access Key");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/optimize`, constraints);
      setSolutions(res.data.solutions || []);
      setSelectedIdx(0);
    } catch (e) { 
      console.error("Connection Error", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const active = solutions[selectedIdx] || null;

  const metallurgy = useMemo(() => {
    if (!active) return { insight: "Analyzing batch data...", driver: "N/A" };
    const comp = active.composition;
    
    const contributions = ELEMENTS.map((el, i) => ({
      name: el.name,
      impact: comp[i] * (el.weight || 0)
    }));
    const topDriver = contributions.reduce((prev, curr) => (prev.impact > curr.impact) ? prev : curr);

    let insight = "Balanced alloy for versatile industrial applications.";
    if (comp[0] > 0.75) insight = "High Carbon: Engineered for maximum hardness in abrasive environments.";
    else if (comp[3] > 0.8 && comp[5] > 0.6) insight = "Heat Resistant: Optimized for creep resistance in high-pressure steam.";
    else if (comp[4] > 0.7) insight = "Cryogenic Grade: Nickel-stabilized for sub-zero fracture toughness.";
    else if (comp[3] > 0.8) insight = "Corrosion Resistant: High Chromium enables use in offshore/marine settings.";

    return { insight, driver: topDriver.name };
  }, [active]);

  const exportPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#020617" });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`AlloyForge_Report_Batch_${selectedIdx + 100}.pdf`);
  };

  const scatterData = useMemo(() => solutions.map((s, i) => ({
    x: s.metrics.strength,
    y: s.metrics.cost,
    idx: i
  })), [solutions]);

  const radarData = useMemo(() => active ? ELEMENTS.map((el, i) => ({
    subject: el.name,
    value: active.composition[i] * 100,
  })) : [], [active]);

  // ----------------------------------------------------------------
  // LOGIN UI
  // ----------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#020617] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Lock size={80} /></div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/30">
              <Cpu size={32} className="text-white" />
            </div>
            <h1 className="font-black text-2xl tracking-tighter uppercase italic text-white">Alloy<span className="text-blue-500">Forge</span></h1>
          </div>
          <h2 className="text-slate-400 text-sm font-medium mb-8">Industrial Optimization Terminal. Please authenticate to access the surrogate models.</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block text-white">System Access Key</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all font-mono"
              />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm text-white transition-all shadow-lg shadow-blue-600/20">
              OPEN TERMINAL
            </button>
          </form>
          <p className="mt-8 text-center text-slate-600 text-[10px] font-bold tracking-[0.2em] uppercase leading-none">Manus V2 © 2026 SECURE ENGINE</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // MAIN DASHBOARD UI
  // ----------------------------------------------------------------
  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-800 bg-[#0f172a] flex flex-col p-6 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl"><Cpu size={24} /></div>
          <h1 className="font-black text-xl tracking-tighter uppercase italic">Alloy<span className="text-blue-500">Forge</span></h1>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold uppercase">
                <span className="text-slate-100">Target Strength</span>
                <span className="text-blue-400 font-mono">{constraints.min_strength} MPa</span>
              </div>
              <input type="range" min="400" max="1100" value={constraints.min_strength} 
                onChange={e => setConstraints({...constraints, min_strength: e.target.value})}
                className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-full appearance-none cursor-pointer" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold uppercase">
                <span className="text-slate-100">Budget Cap</span>
                <span className="text-emerald-400 font-mono">${constraints.max_cost}/t</span>
              </div>
              <input type="range" min="200" max="600" value={constraints.max_cost} 
                onChange={e => setConstraints({...constraints, max_cost: e.target.value})}
                className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-full appearance-none cursor-pointer" />
            </div>

            <button onClick={fetchData} disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 tracking-widest uppercase text-white shadow-lg shadow-blue-900/20">
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> 
              {loading ? 'Simulating...' : 'Run NSGA-II Solver'}
            </button>
          </section>

          <section>
            <label className="text-[10px] font-bold text-slate-100 uppercase tracking-widest mb-4 block">Candidate Batches</label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {solutions.map((s, i) => (
                <button key={i} onClick={() => setSelectedIdx(i)} 
                  className={`w-full p-3 rounded-xl border text-left transition-all ${selectedIdx === i ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-transparent border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className={selectedIdx === i ? "text-white" : "text-slate-500"}>Batch #{i+100}</span>
                    <span className="text-blue-400 font-mono">{s.metrics.strength.toFixed(0)} MPa</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-slate-800 bg-[#0f172a]/50 backdrop-blur-md flex items-center px-10 justify-between shrink-0">
          <div className="flex gap-16">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Zap size={20} /></div>
              <div>
                <div className="text-[10px] font-bold text-slate-100 uppercase tracking-tighter">Yield Strength</div>
                <div className="text-xl font-black font-mono text-white">{active?.metrics.strength.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">MPa</span></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Target size={20} /></div>
              <div>
                <div className="text-[10px] font-bold text-slate-100 uppercase tracking-tighter">Production Cost</div>
                <div className="text-xl font-black font-mono text-white">${active?.metrics.cost.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">/ton</span></div>
              </div>
            </div>
          </div>
          <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-slate-700 text-white">
            <FileText size={16} /> Export Tech Data
          </button>
        </header>

        <div ref={reportRef} className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#020617]">
          
          <div className="grid grid-cols-12 gap-8">
            {/* PARETO CHART */}
            <div className="col-span-12 lg:col-span-8 bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-sm">
              <h3 className="font-bold text-lg mb-8 text-white uppercase tracking-tighter">Solution Frontier Analysis</h3>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Strength" 
                      unit="MPa" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tick={{fill: '#cbd5e1'}}
                      domain={['auto', 'auto']} 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Cost" 
                      unit="$" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tick={{fill: '#cbd5e1'}}
                      domain={['auto', 'auto']} 
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      contentStyle={{
                        backgroundColor: '#1e293b', 
                        border: '2px solid #3b82f6', 
                        borderRadius: '12px',
                        padding: '10px'
                      }}
                      itemStyle={{ color: '#f8fafc', fontSize: '13px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#60a5fa', fontWeight: '800', marginBottom: '4px' }}
                    />
                    <Scatter data={scatterData} fill="#3b82f6" onClick={(e) => setSelectedIdx(e.idx)}>
                      {scatterData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === selectedIdx ? '#60a5fa' : '#334155'} 
                          stroke={index === selectedIdx ? '#ffffff' : '#475569'} 
                          strokeWidth={index === selectedIdx ? 3 : 1}
                          className="cursor-pointer"
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RADAR & INSIGHTS */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8">
                 <h3 className="font-bold text-sm mb-6 uppercase tracking-widest text-slate-100">Chemical Balance</h3>
                 <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{fill: '#cbd5e1', fontSize: 10, fontWeight: 'bold'}} />
                        <Radar name="Alloy" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                  <div className="text-[10px] font-black text-blue-400 uppercase mb-2 flex items-center gap-2"><Info size={14}/> Recommendation</div>
                  <p className="text-xs text-white italic leading-relaxed font-medium">"{metallurgy.insight}"</p>
                </div>
                <div className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
                  <div className="text-[10px] font-black text-purple-400 uppercase mb-2 flex items-center gap-2"><Activity size={14}/> Optimization Driver</div>
                  <p className="text-xs text-white font-medium">Influence primarily attributed to: <span className="text-purple-400 font-bold uppercase">{metallurgy.driver}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* COMPOSITION CARDS */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pb-12">
             {ELEMENTS.map((el, i) => (
               <div key={el.key} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 transition-all hover:border-slate-600">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black text-slate-400">{el.key}</span>
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: el.color}} />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tighter text-white">
                    {active?.composition[i].toFixed(3)}
                    <span className="text-[10px] ml-1 text-slate-500 font-bold">%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-widest">{el.name}</div>
               </div>
             ))}
          </section>

        </div>
      </main>
    </div>
  );
};

export default App;