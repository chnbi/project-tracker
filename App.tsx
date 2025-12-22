import React, { useState, useMemo, useRef } from 'react';
import { Search, Plus, LogIn, Edit2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from './utils/supabaseClient';
import { FILTERS } from './constants';
import { useProjects } from './contexts/ProjectContext';
import { useAuth } from './contexts/AuthContext';
import { FilterNode, Project, Status } from './types';
import { FilterColumn } from './components/FilterColumn';
import { ConnectorLine } from './components/ConnectorLine';
import { ProjectGridRow } from './components/ProjectGridRow';

const ROW_HEIGHT = 32;
const COL_GAP = 120;

const App: React.FC = () => {
  const { projects, addProject, customCategories, addCategory, renameCategory, deleteCategory, renameStatus, deleteStatus, renamePerson, deletePerson, updateProviderName } = useProjects();
  const { user, login, logout } = useAuth();
  const [selectedL1, setSelectedL1] = useState<string>('project');
  const [selectedL2, setSelectedL2] = useState<string>(''); // Default: All
  const [selectedL3, setSelectedL3] = useState<string>(''); // Default: All
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', category: '', initialStatus: 'In Progress' as Status, initialDescription: '', initialPic: '' });
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const handleStartEditName = () => {
    setEditNameValue(user?.name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (editNameValue.trim() && user && editNameValue !== user.name) {
      const oldName = user.name;
      // 1. Update Profile
      const { error } = await supabase.auth.updateUser({ data: { name: editNameValue } });

      if (!error) {
        // 2. Batch Update all past activity
        await updateProviderName(oldName, editNameValue);
        window.location.reload();
      } else {
        console.error(error);
        alert('Failed to update name');
      }
    }
    setIsEditingName(false);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    addProject(newProject);
    setShowAddProject(false);
    setNewProject({ name: '', category: '', initialStatus: 'In Progress' as Status, initialDescription: '', initialPic: '' });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginForm.username, loginForm.password);
    setShowLogin(false);
    setLoginForm({ username: '', password: '' });
  };

  // -- Filter Logic --

  const level1Items = FILTERS;

  const level2Items = useMemo(() => {
    // 1. Project Type -> Dynamic Categories
    if (selectedL1 === 'project') {
      const allCategories = projects.map(p => p.category).filter(Boolean);
      // Merge with custom types
      const mergedCategories = [...allCategories, ...customCategories];
      const uniqueCategories = [...new Set(mergedCategories)].sort();

      // Try to find matching labels in constant FILTERS, else use raw value
      const projectFilterNode = FILTERS.find(f => f.id === 'project');
      const staticChildren = projectFilterNode?.children || [];

      // Always include all customCategories even if unused
      const allCategoryNames = Array.from(new Set([...mergedCategories, ...uniqueCategories, ...customCategories])).sort();

      return [{ id: 'all', label: 'All' }, ...allCategoryNames.map(cat => {
        const staticMatch = staticChildren.find(c => c.id === cat);
        return {
          id: cat,
          label: staticMatch?.label || cat
        };
      })];
    }

    // 2. Dynamic Hierarchies
    if (selectedL1 === 'status') {
      // Custom status order (workflow-based)
      const STATUS_ORDER = [
        'Backlog', 'In Progress', 'In Development', 'Pending Update',
        'Review', 'QA', 'Blocker', 'Done', 'Completed', 'Live', 'Pushed to IoT', 'IoT'
      ];

      const allStatuses = projects.map(p => p.status);
      const uniqueStatuses = [...new Set(allStatuses)];

      // Sort by custom order, unknown statuses go to end
      const sortedStatuses = uniqueStatuses.sort((a, b) => {
        const statusA = a as string;
        const statusB = b as string;
        const indexA = STATUS_ORDER.indexOf(statusA);
        const indexB = STATUS_ORDER.indexOf(statusB);
        if (indexA === -1 && indexB === -1) return statusA.localeCompare(statusB);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      return [{ id: 'all', label: 'All' }, ...sortedStatuses.map(s => ({ id: s, label: s }))];
    }

    if (selectedL1 === 'person_filter') {
      const allPersons = projects.flatMap(p => p.updates.map(u => u.person));
      const uniquePersons = [...new Set(allPersons)].sort();
      return [{ id: 'all', label: 'All' }, ...uniquePersons.map(p => ({ id: p, label: p }))];
    }

    return [];
  }, [selectedL1, projects, customCategories]);


  const level3Items = useMemo(() => {
    // 1. Generic "All" check
    if (!selectedL2 || selectedL2 === 'all') return [];

    // 2. Project Type -> Show PROJECTS in this Category (formerly SubCategories)
    if (selectedL1 === 'project') {
      return projects
        .filter(p => p.category === selectedL2)
        .map(p => ({ id: p.id, label: p.name }));
    }

    // 3. Dynamic Hierarchies (Status/Person > Projects)
    if (selectedL1 === 'status') {
      return projects
        .filter(p => p.status === selectedL2)
        .map(p => ({ id: p.id, label: p.name }));
    }

    if (selectedL1 === 'person_filter') {
      return projects
        .filter(p => p.updates.some(u => u.person === selectedL2))
        .map(p => ({ id: p.id, label: p.name }));
    }

    return [];
  }, [selectedL1, selectedL2, projects]);


  const filteredProjects = useMemo(() => {
    return projects.map(project => {
      let isMatch = true;

      // -- L1/L2/L3 Filtering --
      if (selectedL1 === 'project') {
        // L2 = Category, L3 = Project ID
        if (selectedL2 && selectedL2 !== 'all' && selectedL2 !== '') {
          isMatch = isMatch && project.category === selectedL2;
        }
        if (selectedL3 && selectedL3 !== 'all' && selectedL3 !== '') {
          isMatch = isMatch && project.id === selectedL3;
        }
      }
      else if (selectedL1 === 'status') {
        // L2 = Status, L3 = Project
        if (selectedL2 && selectedL2 !== 'all' && selectedL2 !== '') {
          isMatch = isMatch && project.status === selectedL2;
        }
        if (selectedL3 && selectedL3 !== 'all' && selectedL3 !== '') {
          isMatch = isMatch && project.id === selectedL3;
        }
      }
      else if (selectedL1 === 'person_filter') {
        // L2 = Person, L3 = Project
        if (selectedL2 && selectedL2 !== 'all' && selectedL2 !== '') {
          isMatch = isMatch && project.updates.some(u => u.person === selectedL2);
        }
        if (selectedL3 && selectedL3 !== 'all' && selectedL3 !== '') {
          isMatch = isMatch && project.id === selectedL3;
        }
      }

      if (!isMatch) return null;

      // -- Search Query Filtering --
      const query = searchQuery.toLowerCase();
      if (!query) return project;

      const projectMatches = project.name.toLowerCase().includes(query);

      const matchingUpdates = project.updates.filter(u =>
        u.description.toLowerCase().includes(query) ||
        u.person.toLowerCase().includes(query)
      );

      if (projectMatches) return project;
      if (matchingUpdates.length > 0) {
        return { ...project, updates: matchingUpdates };
      }

      return null;
    }).filter((p): p is Project => p !== null);

  }, [searchQuery, selectedL1, selectedL2, selectedL3, projects, level3Items]);

  const handleL1Select = (id: string) => {
    setSelectedL1(id);
    // Reset subsequent levels
    setSelectedL2('');
    setSelectedL3('');
  };

  const handleL2Select = (id: string) => {
    setSelectedL2(id);
    setSelectedL3('');
  };


  const getIndex = (items: FilterNode[], id: string | null) => {
    const idx = items.findIndex(i => i.id === id);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-12 font-sans selection:bg-black selection:text-white">

      {/* Header / Nav Tree */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12 border-b border-gray-100 pb-4">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">project tracker</h1>

          <div className="flex items-center gap-6 text-sm">
            {user ? (
              <>
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="bg-transparent border-b border-black outline-none text-right w-24 text-gray-700"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="text-green-600 hover:bg-green-50 rounded p-0.5"><Check size={14} /></button>
                    <button onClick={() => setIsEditingName(false)} className="text-red-600 hover:bg-red-50 rounded p-0.5"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-2">
                    <span className="text-gray-500 font-medium">{user.name}</span>
                    <button onClick={handleStartEditName} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-black">
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}
                <button onClick={logout} className="hover:text-black transition-colors text-xs text-red-500/80">Log out</button>
              </>
            ) : (
              <button onClick={() => setShowLogin(!showLogin)} className="flex items-center gap-2 hover:text-black text-gray-500 transition-colors">
                <LogIn size={14} /> Log in
              </button>
            )}
            {user && (
              <button onClick={() => setShowAddProject(!showAddProject)} className="flex items-center gap-2 hover:text-black text-gray-400 font-medium transition-colors">
                <Plus size={14} /> New Project
              </button>
            )}
          </div>
        </div>

        {/* Login Modal (Floating Popup) */}
        {showLogin && !user && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
            <div className="bg-white border border-black p-6 md:p-8 w-full md:max-w-sm shadow-2xl relative rounded-t-2xl md:rounded-none">
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black"
              >
                <Plus size={20} className="rotate-45" />
              </button>

              <h2 className="text-sm font-bold mb-6 uppercase tracking-widest text-center">Log In</h2>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Username</label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full p-2 border border-gray-200 focus:border-black outline-none text-sm transition-colors font-mono"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full p-2 border border-gray-200 focus:border-black outline-none text-sm transition-colors font-mono"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-black text-white py-3 text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors"
                >
                  Sign In
                </button>
              </form>
            </div>
          </div>
        )}

        {/* New Project Modal (Floating Popup) */}
        {showAddProject && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center overflow-y-auto">
            <div className="bg-white border border-black p-6 md:p-8 w-full md:max-w-md shadow-2xl relative rounded-t-2xl md:rounded-none max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowAddProject(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black"
              >
                <Plus size={20} className="rotate-45" />
              </button>

              <h2 className="text-sm font-bold mb-6 uppercase tracking-widest text-center">New Project</h2>
              <form onSubmit={handleAddProject} className="flex flex-col gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name"
                    className="w-full p-2 border border-gray-200 focus:border-black outline-none text-sm transition-colors font-mono"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <div className="space-y-1 w-1/2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Category</label>
                    <div className="relative">
                      <input
                        list="category-suggestions"
                        type="text"
                        value={newProject.category}
                        onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                        placeholder="Select or Type..."
                        className="w-full p-2 border border-gray-200 focus:border-black outline-none text-sm transition-colors font-mono"
                        required
                      />
                      <datalist id="category-suggestions">
                        {customCategories.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-1 w-1/2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Status</label>
                    <select
                      value={newProject.initialStatus}
                      onChange={(e) => setNewProject({ ...newProject, initialStatus: e.target.value as Status })}
                      className="w-full p-2 border border-gray-200 focus:border-black outline-none text-sm transition-colors font-mono appearance-none bg-white"
                    >
                      {['In Progress', 'Pending Update', 'Completed', 'Review', 'Blocker', 'QA', 'IoT', 'Live'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Initial PIC</label>
                  <input
                    type="text"
                    value={newProject.initialPic}
                    onChange={(e) => setNewProject({ ...newProject, initialPic: e.target.value })}
                    placeholder="Who is starting this?"
                    className="w-full p-2 border border-gray-200 focus:border-black outline-none text-sm transition-colors font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Initial Update</label>
                  <textarea
                    value={newProject.initialDescription}
                    onChange={(e) => setNewProject({ ...newProject, initialDescription: e.target.value })}
                    placeholder="What is the current status?"
                    className="w-full p-2 border border-gray-200 focus:border-black outline-none text-sm transition-colors font-mono h-24 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 bg-black text-white py-3 text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors"
                >
                  Create Project
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tree Navigation - Only show when logged in */}
        {user && (
          <>
            <div className="relative overflow-x-auto no-scrollbar pb-4 md:pb-8">
              <div className="flex flex-nowrap gap-8 md:gap-[120px] min-w-max relative">
                <div className="relative">
                  <FilterColumn title="Type" items={level1Items} selectedId={selectedL1} onSelect={handleL1Select} levelIndex={0} />
                  <ConnectorLine fromIndex={getIndex(level1Items, selectedL1)} toIndex={getIndex(level2Items, selectedL2)} isActive={level2Items.length > 0} rowHeight={ROW_HEIGHT} columnGap={COL_GAP} />
                </div>
                {level2Items.length > 0 && (
                  <div className="relative">
                    <FilterColumn
                      title={selectedL1 === 'project' ? "Category" : "Item"}
                      items={level2Items}
                      selectedId={selectedL2}
                      onSelect={handleL2Select}
                      levelIndex={1}
                      onAdd={selectedL1 === 'project' ? addCategory : undefined}
                      onRename={
                        (selectedL1 === 'project' && user) ? renameCategory :
                          (selectedL1 === 'status' && user) ? renameStatus :
                            (selectedL1 === 'person_filter' && user) ? renamePerson : undefined
                      }
                      onDelete={
                        (selectedL1 === 'project' && user) ? deleteCategory :
                          (selectedL1 === 'status' && user) ? deleteStatus :
                            (selectedL1 === 'person_filter' && user) ? deletePerson : undefined
                      }
                    />
                    <ConnectorLine fromIndex={getIndex(level2Items, selectedL2)} toIndex={getIndex(level3Items, selectedL3)} isActive={level3Items.length > 0} rowHeight={ROW_HEIGHT} columnGap={COL_GAP} />
                  </div>
                )}
                {level3Items.length > 0 && selectedL2 && selectedL2 !== 'all' && (
                  <div className="relative">
                    <FilterColumn
                      title="Project"
                      items={level3Items}
                      selectedId={selectedL3}
                      onSelect={setSelectedL3}
                      levelIndex={2}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Scroll Navigation */}
            <div className="flex md:hidden items-center justify-between mt-2 mb-4 text-xs text-gray-400">
              <span className="font-mono">Scroll to explore more</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const container = document.querySelector('.overflow-x-auto');
                    container?.scrollBy({ left: -150, behavior: 'smooth' });
                  }}
                  className="p-1.5 border border-gray-200 rounded hover:border-black hover:text-black transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => {
                    const container = document.querySelector('.overflow-x-auto');
                    container?.scrollBy({ left: 150, behavior: 'smooth' });
                  }}
                  className="p-1.5 border border-gray-200 rounded hover:border-black hover:text-black transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content: Grid List */}
      <main className="max-w-6xl mx-auto px-4 md:px-0">
        {/* Search Bar */}
        <div className="relative mb-6 group w-full md:max-w-xs md:ml-auto md:mr-0">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-gray-200 py-2 md:py-1 text-sm font-normal focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
          />
          <Search className="absolute right-0 top-2 md:top-1.5 w-4 h-4 text-gray-300 group-focus-within:text-black transition-colors" />
        </div>

        {/* List Header - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-x-4 pb-4 border-b border-black mb-0 text-[10px] uppercase tracking-widest text-black font-bold">
          <div className="col-span-1">Date</div>
          <div className="col-span-5">Project</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">PIC</div>
          <div className="col-span-1">Provider</div>
          <div className="col-span-2 text-right">Category</div>
        </div>

        {/* Projects List */}
        <div className="w-full">
          {!user ? (
            /* Login Gate - Show message for guests */
            <div
              onClick={() => setShowLogin(true)}
              className="py-20 text-center cursor-pointer group"
            >
              <div className="inline-flex flex-col items-center gap-2 px-6 py-4 border border-dashed border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-all">
                <LogIn size={24} className="text-gray-300 group-hover:text-black transition-colors" />
                <p className="text-sm text-gray-400 group-hover:text-black transition-colors">
                  Log in to view project details
                </p>
                <span className="text-xs text-gray-300">Click anywhere to sign in</span>
              </div>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="flex flex-col">
              {filteredProjects.map((project) => (
                <ProjectGridRow key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-gray-400 text-sm font-mono text-center">
              [ Empty ]
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;