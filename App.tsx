import React, { useState, useMemo } from 'react';
import { Search, Plus, LogIn } from 'lucide-react';
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
  const { projects, addProject, customCategories, addCategory, customSubCategories, addSubCategory } = useProjects();
  const { user, login, logout } = useAuth();
  const [selectedL1, setSelectedL1] = useState<string>('project');
  const [selectedL2, setSelectedL2] = useState<string>(''); // Default: All
  const [selectedL3, setSelectedL3] = useState<string>(''); // Default: All
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', category: '', subCategory: '', initialStatus: 'In Progress' as Status });
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: '', email: '' });

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    addProject(newProject);
    setShowAddProject(false);
    setNewProject({ name: '', category: '', subCategory: '', initialStatus: 'In Progress' as Status });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginForm.name, loginForm.email);
    setShowLogin(false);
    setLoginForm({ name: '', email: '' });
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

      return [{ id: 'all', label: 'All' }, ...uniqueCategories.map(cat => {
        const staticMatch = staticChildren.find(c => c.id === cat);
        return {
          id: cat,
          label: staticMatch?.label || cat
        };
      })];
    }

    // 2. Dynamic Hierarchies
    if (selectedL1 === 'status') {
      const allStatuses = projects.map(p => p.status);
      const uniqueStatuses = [...new Set(allStatuses)].sort();
      return [{ id: 'all', label: 'All' }, ...uniqueStatuses.map(s => ({ id: s, label: s }))];
    }

    if (selectedL1 === 'person_filter') {
      const allPersons = projects.flatMap(p => p.updates.map(u => u.person));
      const uniquePersons = [...new Set(allPersons)].sort();
      return [{ id: 'all', label: 'All' }, ...uniquePersons.map(p => ({ id: p, label: p }))];
    }

    return [];
  }, [selectedL1, projects, customCategories]);


  const level3Items = useMemo(() => {
    // 1. Generic "All" check - if L2 is all, usually we don't show L3 or show all? 
    // Minus One logic: If L2 is 'All', L3 might not make sense or should be disabled.
    // For now, if L2 is 'all' or empty, return empty to hide L3 column, OR return all possible L3s.
    // Let's hide L3 if L2 is 'all' for simplicity, or return specific subitems if needed.
    if (!selectedL2 || selectedL2 === 'all') return [];

    // 2. Project Type -> Dynamic SubCategories
    // 2. Project Type -> Dynamic SubCategories
    if (selectedL1 === 'project') {
      // Filter projects by the selected Category first
      const categoryProjects = projects.filter(p => p.category === selectedL2);
      // Extract unique SubCategories
      const projectSubCats = categoryProjects.map(p => p.subCategory).filter(Boolean) as string[];
      // Merge with custom subcategories for this category
      const customs = customSubCategories[selectedL2] || [];

      const allSubCats = [...projectSubCats, ...customs];
      const uniqueSubCats = [...new Set(allSubCats)].sort();

      if (uniqueSubCats.length === 0) return [];

      // Try to find labels from static config if possible (deep search), otherwise raw
      // Actually accessing the deep static tree is complex, let's just use raw for now or primitive matching
      // The original FILTERS structure had children of children.

      return [{ id: 'all', label: 'All' }, ...uniqueSubCats.map(sc => ({ id: sc, label: sc }))];
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
        // L2 = Category, L3 = SubCategory
        if (selectedL2 && selectedL2 !== 'all' && selectedL2 !== '') {
          isMatch = isMatch && project.category === selectedL2;
        }
        if (selectedL3 && selectedL3 !== 'all' && selectedL3 !== '') {
          // If L3 corresponds to SubCategory (dynamically generated)
          // We check for strict match against project.subCategory
          isMatch = isMatch && project.subCategory === selectedL3;
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
        <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">project tracker</h1>

          <div className="flex items-center gap-6 text-sm">
            {user ? (
              <>
                <span className="text-gray-500">{user.name}</span>
                <button onClick={logout} className="hover:text-black transition-colors">Log out</button>
              </>
            ) : (
              <button onClick={() => setShowLogin(!showLogin)} className="flex items-center gap-2 hover:text-black text-gray-500 transition-colors">
                <LogIn size={14} /> Log in
              </button>
            )}
            <button onClick={() => setShowAddProject(!showAddProject)} className="flex items-center gap-2 hover:text-black text-gray-500 transition-colors">
              <Plus size={14} /> New
            </button>
          </div>
        </div>

        {/* Login Modal (Simplified Inline) */}
        {showLogin && !user && (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-100 max-w-sm ml-auto">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider">Authentication</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input type="text" value={loginForm.name} onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })} placeholder="Name" className="p-2 border bg-white text-sm" required />
              <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="Email" className="p-2 border bg-white text-sm" required />
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowLogin(false)} className="text-xs text-gray-500 hover:text-black uppercase">Cancel</button>
                <button type="submit" className="text-xs bg-black text-white px-4 py-2 hover:bg-gray-800 uppercase">Enter</button>
              </div>
            </form>
          </div>
        )}

        {/* Tree Navigation */}
        <div className="relative overflow-x-auto no-scrollbar pb-8">
          <div className="flex flex-nowrap gap-[120px] min-w-max relative">
            <div className="relative">
              <FilterColumn title="Type" items={level1Items} selectedId={selectedL1} onSelect={handleL1Select} levelIndex={0} />
              <ConnectorLine fromIndex={getIndex(level1Items, selectedL1)} toIndex={getIndex(level2Items, selectedL2)} isActive={level2Items.length > 0} rowHeight={ROW_HEIGHT} columnGap={COL_GAP} />
            </div>
            {level2Items.length > 0 && (
              <div className="relative">
                <FilterColumn
                  title="Category"
                  items={level2Items}
                  selectedId={selectedL2}
                  onSelect={handleL2Select}
                  levelIndex={1}
                  onAdd={level1Items[0]?.id === 'all' || selectedL1 === 'project' ? addCategory : undefined}
                />
                <ConnectorLine fromIndex={getIndex(level2Items, selectedL2)} toIndex={getIndex(level3Items, selectedL3)} isActive={level3Items.length > 0} rowHeight={ROW_HEIGHT} columnGap={COL_GAP} />
              </div>
            )}
            {level3Items.length > 0 && selectedL2 && selectedL2 !== 'all' && (
              <div className="relative">
                <FilterColumn
                  title="Sub-item"
                  items={level3Items}
                  selectedId={selectedL3}
                  onSelect={setSelectedL3}
                  levelIndex={2}
                  onAdd={selectedL1 === 'project' ? (name) => addSubCategory(selectedL2, name) : undefined}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Grid List */}
      <main className="max-w-6xl mx-auto">
        {/* Search Bar - Significantly smaller and tighter */}
        <div className="relative mb-6 group w-full max-w-xs ml-auto mr-0">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-gray-200 py-1 text-sm font-normal focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
          />
          <Search className="absolute right-0 top-1.5 w-4 h-4 text-gray-300 group-focus-within:text-black transition-colors" />
        </div>

        {/* List Header */}
        <div className="grid grid-cols-12 gap-x-4 pb-4 border-b border-black mb-0 text-[10px] uppercase tracking-widest text-black font-bold">
          <div className="col-span-1">Date</div>
          <div className="col-span-5">Project</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">PIC</div>
          <div className="col-span-2 text-right">Category</div>
        </div>

        {/* Projects List */}
        <div className="w-full">
          {filteredProjects.length > 0 ? (
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