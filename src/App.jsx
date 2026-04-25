import React, { useState, useRef, useEffect } from 'react';
import { Play, ArrowLeft, Gamepad2, Info, ShieldCheck, Globe, List, ExternalLink, Maximize, TrendingUp, Lock, Settings } from 'lucide-react';
import gamesData from './data/games.json';
import proxiesData from './data/proxies.json';
import { incrementVisitCount, subscribeToVisitCount, updateSession, checkBanStatus, subscribeToSessions, subscribeToBans, banUser, unbanUser } from './services/firebase';

export default function App() {
  const [activeItem, setActiveItem] = useState(null); // unified state for game or proxy
  const [activeTab, setActiveTab] = useState('games');
  const [visitCount, setVisitCount] = useState(0);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [bans, setBans] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const iframeContainerRef = useRef(null);

  useEffect(() => {
    // Session ID management
    let currentSessionId = localStorage.getItem('nebula_session_id');
    if (!currentSessionId) {
      currentSessionId = Math.random().toString(36).substring(2, 11).toUpperCase();
      localStorage.setItem('nebula_session_id', currentSessionId);
    }
    setSessionId(currentSessionId);

    // Initial checks
    const init = async () => {
      const banned = await checkBanStatus(currentSessionId);
      if (banned) {
        setIsBanned(true);
        return;
      }

      const hasVisited = sessionStorage.getItem('hasVisited');
      if (!hasVisited) {
        incrementVisitCount();
        sessionStorage.setItem('hasVisited', 'true');
      }
      updateSession(currentSessionId);
    };

    init();

    // Subscriptions
    const unsubscribeVisits = subscribeToVisitCount(setVisitCount);
    let unsubscribeSessions = () => {};
    let unsubscribeBans = () => {};

    if (isAdminAuthenticated) {
      unsubscribeSessions = subscribeToSessions(setSessions);
      unsubscribeBans = subscribeToBans(setBans);
    }

    return () => {
      unsubscribeVisits();
      unsubscribeSessions();
      unsubscribeBans();
    };
  }, [isAdminAuthenticated]);

  const toggleFullscreen = () => {
    if (iframeContainerRef.current) {
      if (!document.fullscreenElement) {
        iframeContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPasswordInput === '1DoodleBugg4uu18!BoogieLoo!') {
      setIsAdminAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const renderAdmin = () => (
    <div className="flex-1 p-6 md:p-10 w-full max-w-6xl mx-auto overflow-y-auto bg-slate-950/30">
      <div className="mb-10 border-b border-slate-800 pb-6 flex items-end justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-none flex items-center justify-center border border-slate-900 bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <Lock size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-slate-200 mb-1 leading-none">
              ADMIN PANEL<span className="text-indigo-500">.</span>
            </h1>
            <p className="text-[10px] font-mono text-indigo-400 tracking-[0.2em] uppercase">
              System Configuration & Monitoring
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <Settings size={32} className="text-slate-700" />
        </div>
      </div>

      {!isAdminAuthenticated ? (
        <div className="max-w-md mx-auto mt-12 p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
            <Lock size={18} className="text-indigo-500" />
            Authorization Required
          </h2>
          <form onSubmit={handleAdminAuth}>
            <div className="mb-6">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Access Token</label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className={`w-full bg-slate-950 border ${authError ? 'border-red-500' : 'border-slate-800'} p-3 text-slate-200 font-mono text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700`}
                placeholder="••••••••••••••••"
              />
              {authError && (
                <p className="text-[10px] text-red-500 mt-2 font-mono uppercase tracking-widest">Access Denied. Incorrect Token.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-[10px] text-white font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]"
            >
              Verify Identity
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">Total Site Visits</span>
              <span className="text-4xl font-black text-white">{visitCount.toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">Active Sessions</span>
              <span className="text-4xl font-black text-indigo-400">{sessions.length}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">Banned Users</span>
              <span className="text-4xl font-black text-red-400">{bans.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Session Manager */}
            <div className="bg-slate-900/60 border border-slate-800 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                <List size={16} />
                Session Manager
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {sessions.map(sess => (
                  <div key={sess.id} className="p-4 bg-slate-950/50 border border-slate-800/50 flex items-center justify-between group">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="text-[10px] font-mono text-white font-bold flex items-center gap-2">
                        {sess.id}
                        {sess.id === sessionId && <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] rounded-sm">YOU</span>}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase truncate max-w-[200px]">
                        {sess.userAgent}
                      </span>
                      <span className="text-[8px] font-mono text-slate-600">
                        Active: {sess.lastActive?.toDate?.().toLocaleString() || 'Connecting...'}
                      </span>
                    </div>
                    {sess.id !== sessionId && !bans.find(b => b.id === sess.id) && (
                      <button
                        onClick={() => banUser(sess.id)}
                        className="px-3 py-1 bg-red-950/30 border border-red-900/30 text-[9px] font-mono text-red-500 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        Ban
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ban Notebook */}
            <div className="bg-slate-900/60 border border-slate-800 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-6 flex items-center gap-2">
                <ShieldCheck size={16} />
                Banned Registry
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {bans.length > 0 ? bans.map(ban => (
                  <div key={ban.id} className="p-4 bg-red-950/10 border border-red-900/20 flex items-center justify-between group">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="text-[10px] font-mono text-red-400 font-bold">{ban.id}</span>
                      <span className="text-[8px] font-mono text-slate-600">
                        Banned on: {ban.bannedAt?.toDate?.().toLocaleString() || 'Recent'}
                      </span>
                    </div>
                    <button
                      onClick={() => unbanUser(ban.id)}
                      className="px-3 py-1 bg-slate-950/50 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-400 transition-all"
                    >
                      Unban User
                    </button>
                  </div>
                )) : (
                  <div className="h-40 flex items-center justify-center text-slate-600 font-mono text-[10px] uppercase">
                    No active bans in registry
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
              <Info size={16} />
              System Configuration
            </h3>
            <div className="space-y-4 font-mono text-[11px]">
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="text-slate-500 uppercase">Core Logic</span>
                <span className="text-emerald-400">OPERATIONAL</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="text-slate-500 uppercase">Database Link</span>
                <span className="text-emerald-400">ENCRYPTED</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="text-slate-500 uppercase">Admin Access</span>
                <span className="text-indigo-400 font-bold">AUTHORIZED</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="text-slate-500 uppercase">Local Session ID</span>
                <span className="text-slate-400 truncate ml-4 tracking-tighter">
                  {sessionId}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => { setIsAdminAuthenticated(false); setAdminPasswordInput(''); }}
            className="px-6 py-2 border border-slate-800 text-[9px] font-mono text-slate-500 hover:border-red-500/50 hover:text-red-400 transition-all uppercase tracking-[0.2em]"
          >
            Revoke Access / Logout
          </button>
        </div>
      )}
    </div>
  );

  const renderProxies = () => (
    <div className="flex-1 p-6 md:p-10 w-full max-w-6xl mx-auto overflow-y-auto bg-slate-950/30">
      <div className="mb-10 border-b border-slate-800 pb-6 flex items-end justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-none flex overflow-hidden border border-slate-900 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <div className="w-1/2 h-full bg-white"></div>
            <div className="w-1/2 h-full bg-indigo-600"></div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-slate-200 mb-1 leading-none">
              PROXIES<span className="text-indigo-500">.</span>
            </h1>
            <p className="text-[10px] font-mono text-indigo-400 tracking-[0.2em] uppercase">
              {proxiesData.length} proxies available
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <Globe size={32} className="text-slate-700" />
        </div>
      </div>

      {proxiesData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proxiesData.map((proxy) => (
            <div
              key={proxy.id}
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-6 flex flex-col group transition-all hover:border-indigo-500/50 hover:bg-indigo-500/10"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  {proxy.name}
                </h2>
                <div className="px-2 py-1 bg-slate-950 text-[8px] font-mono text-emerald-400 border border-emerald-900/30 uppercase">
                  Online
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed flex-1">
                {proxy.description}
              </p>
              <button
                onClick={() => setActiveItem({ ...proxy, type: 'proxy' })}
                className="mt-auto flex items-center justify-center gap-2 py-3 bg-indigo-600 text-[10px] text-white font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] cursor-pointer"
              >
                <Globe size={14} />
                Access Node (Internal)
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-slate-800 p-12 flex flex-col items-center justify-center text-center bg-slate-900/20">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-slate-700 mb-6 border border-slate-800">
            <Globe size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-400 mb-2 uppercase tracking-tight">No Proxy Nodes Found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            The proxy registry is currently empty. You can add your own custom proxy nodes by updating the <code className="text-indigo-400 px-1 font-mono">proxies.json</code> data file.
          </p>
        </div>
      )}
    </div>
  );

  if (isBanned) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full border border-red-900/50 p-10 bg-red-950/10 backdrop-blur-xl">
          <ShieldCheck size={64} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black uppercase text-white mb-2 tracking-tighter">Access Denied</h1>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-widest mb-8">
            This session identifier has been restricted from accessing the nebula network.
          </p>
          <div className="py-2 px-4 bg-slate-900 border border-slate-800 inline-block">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">ID: </span>
            <span className="text-[10px] font-mono text-red-500 font-bold">{sessionId}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full text-slate-200 font-sans flex flex-col overflow-hidden relative"
      style={{
        backgroundImage: "linear-gradient(rgba(2, 6, 23, 0.65), rgba(2, 6, 23, 0.75)), url('https://mir-s3-cdn-cf.behance.net/project_modules/disp/9c3404112981173.601ebcc1dba2d.gif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header marquee */}
      <header className="h-12 border-b border-slate-800 bg-slate-900/50 flex items-center overflow-hidden shrink-0 z-50">
        <div className="marquee-track text-[10px] font-bold tracking-widest uppercase text-indigo-400">
          <span className="px-6">/// NEBULA GAMES PORTAL ///</span>
          <span className="px-6 text-slate-500">UNBLOCKED & READY TO PLAY</span>
          <span className="px-6">/// NETWORK BYPASS ACTIVE ///</span>
          <span className="px-6 text-slate-500">STAY ANONYMOUS</span>
          <span className="px-6">/// NEBULA GAMES PORTAL ///</span>
          <span className="px-6 text-slate-500">UNBLOCKED & READY TO PLAY</span>
          <span className="px-6">/// NETWORK BYPASS ACTIVE ///</span>
          <span className="px-6 text-slate-500">STAY ANONYMOUS</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-16 md:w-20 border-r border-slate-800 bg-slate-950/40 backdrop-blur-sm flex flex-col items-center py-8 shrink-0 z-40">
          <button
            onClick={() => { setActiveTab('games'); setActiveItem(null); }}
            className={`p-4 transition-all ${activeTab === 'games' ? 'text-indigo-500 scale-110 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'text-slate-600 hover:text-slate-400'}`}
            title="Games"
          >
            <Gamepad2 size={24} strokeWidth={activeTab === 'games' ? 3 : 2} />
          </button>
          <button
            onClick={() => { setActiveTab('proxies'); setActiveItem(null); }}
            className={`p-4 mt-4 transition-all ${activeTab === 'proxies' ? 'text-indigo-500 scale-110 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'text-slate-600 hover:text-slate-400'}`}
            title="Proxies"
          >
            <ShieldCheck size={24} strokeWidth={activeTab === 'proxies' ? 3 : 2} />
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setActiveItem(null); }}
            className={`p-4 mt-4 transition-all ${activeTab === 'admin' ? 'text-indigo-500 scale-110 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'text-slate-600 hover:text-slate-400'}`}
            title="Admin"
          >
            <Lock size={24} strokeWidth={activeTab === 'admin' ? 3 : 2} />
          </button>
        </nav>

        <main className="flex-1 flex overflow-hidden relative border-l border-slate-900">
          {!activeItem ? (
            activeTab === 'games' ? (
            <div className="flex-1 p-6 md:p-10 w-full max-w-6xl mx-auto overflow-y-auto bg-slate-950/20">
                <div className="mb-10 border-b border-slate-800 pb-6 flex items-end justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-none flex overflow-hidden border border-slate-900 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                       <div className="w-1/2 h-full bg-white"></div>
                       <div className="w-1/2 h-full bg-indigo-600"></div>
                     </div>
                     <div>
                      <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-slate-200 mb-1 leading-none">
                        GAMES<span className="text-indigo-500">.</span>
                      </h1>
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] font-mono text-indigo-400 tracking-[0.2em] uppercase">
                          {gamesData.length} games available
                        </p>
                        <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-sm">
                          <TrendingUp size={10} className="text-indigo-400" />
                          <span className="text-[10px] font-mono text-indigo-200 font-bold tracking-wider">
                            {visitCount.toLocaleString()} VISITS
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <Gamepad2 size={32} className="text-slate-700" />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                  {gamesData.map((game, index) => (
                    <button
                      key={game.id}
                      onClick={() => setActiveItem({ ...game, type: 'game' })}
                      className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-2 flex flex-col text-left group cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-indigo-500/10 h-full"
                    >
                      <div className="w-full bg-slate-800 mb-3 relative overflow-hidden aspect-video flex justify-center items-center shadow-inner">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                        
                        <div className="absolute -right-2 -bottom-2 font-black text-6xl text-slate-700/20 z-0 leading-none group-hover:text-indigo-500/20 transition-colors">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-slate-950/80 text-[9px] font-mono text-indigo-300 uppercase z-10 border border-indigo-900/30 shadow-sm">
                          {game.genre}
                        </span>
                      </div>
                      
                      <div className="relative z-10 flex flex-col flex-1 px-1">
                        <h2 className="text-xs font-bold uppercase tracking-tight text-slate-200 group-hover:text-white transition-colors mb-1 truncate">
                          {game.title}
                        </h2>
                        
                        <p className="text-[10px] text-slate-500 uppercase mb-3 truncate">
                          By {game.developer}
                        </p>
                        
                        <div className="mt-auto flex items-center gap-2 text-[10px] text-indigo-500 font-bold uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                          <Play className="fill-current" size={12} />
                          Launch Game
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : activeTab === 'proxies' ? (
              renderProxies()
            ) : (
              renderAdmin()
            )
          ) : (
            <div className="flex flex-col flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 overflow-hidden h-full">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveItem(null)}
                      className="flex items-center justify-center w-8 h-8 bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 transition-colors shadow-sm cursor-pointer"
                      title="Go Back"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button 
                      onClick={toggleFullscreen}
                      className="flex items-center justify-center w-8 h-8 bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 transition-colors shadow-sm cursor-pointer"
                      title="Fullscreen"
                    >
                      <Maximize size={16} />
                    </button>
                    <a
                      href={activeItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 bg-indigo-900/30 border border-indigo-700/50 hover:bg-indigo-600 hover:border-indigo-500 text-indigo-400 hover:text-white transition-all shadow-sm cursor-pointer"
                      title="Open in New Tab (Fallback)"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <div className="h-6 w-px bg-slate-800"></div>
                  <h2 className="text-lg font-black tracking-tighter uppercase text-slate-200 truncate">
                    {activeItem.title || activeItem.name}
                  </h2>
                </div>
                
                <div className="hidden md:flex items-center gap-3 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  <Info size={14} className="text-indigo-500" />
                  <span>{activeItem.genre || 'Secure Node'}</span>
                  <span className="text-slate-700">//</span>
                  <span>{activeItem.developer || activeItem.id}</span>
                </div>
              </div>
              
              <div 
                ref={iframeContainerRef}
                className="flex-1 w-full border border-slate-800 relative bg-slate-900 p-1 shadow-[0_0_20px_rgba(79,70,229,0.05)] overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent z-10 pointer-events-none"></div>
                <iframe 
                  src={activeItem.url} 
                  className="w-full h-full bg-slate-950 block border-0"
                  title={activeItem.title || activeItem.name}
                  scrolling="no"
                  frameBorder="0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-popups-to-escape-sandbox allow-downloads allow-storage-access-by-user-activation allow-modals"
                  allow="accelerometer *; ambient-light-sensor *; autoplay *; camera *; clipboard-read *; clipboard-write *; encrypted-media *; fullscreen *; geolocation *; gyroscope *; local-network-access *; magnetometer *; microphone *; midi *; payment *; picture-in-picture *; screen-wake-lock *; speaker *; sync-xhr *; usb *; vibrate *; vr *; web-share *"
                  allowFullScreen
                />
              </div>
              <div className="mt-2 text-center py-2 h-8">
                <p className="text-[9px] text-slate-600 font-mono uppercase tracking-[0.2em]">
                  If the page fails to load, click the <ExternalLink size={10} className="inline mx-1" /> icon to launch in a new tab.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
