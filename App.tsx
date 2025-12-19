import React, { useState, useMemo } from 'react';
import { Search, Plus, LogIn, LogOut } from 'lucide-react';
import { FILTERS } from './constants';
import { useProjects } from './contexts/ProjectContext';
import { useAuth } from './contexts/AuthContext';
import { FilterNode, Project, Status } from './types';
import { FilterColumn } from './components/FilterColumn';
import { ConnectorLine } from './components/ConnectorLine';
import { ProjectGroup } from './components/ProjectGroup';

const ROW_HEIGHT = 32;
const COL_GAP = 120;

const App: React.FC = () => {
  const { projects, addProject } = useProjects();
  const { user, login, logout } = useAuth();
  const [selectedL1, setSelectedL1] = useState<string>('project');
  const [selectedL2, setSelectedL2] = useState<string>('yos');
  const [selectedL3, setSelectedL3] = useState<string>('5g');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
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
    // 1. Static Hierarchy (Project > Category)
    const parent = level1Items.find(i => i.id === selectedL1);
    if (parent?.children && parent.children.length > 0) {
      return parent.children;
    }

    // 2. Dynamic Hierarchies
    if (selectedL1 === 'status') {
      const allStatuses = projects.map(p => p.status);
      const uniqueStatuses = [...new Set(allStatuses)];
      return [{ id: 'all', label: 'All' }, ...uniqueStatuses.map(s => ({ id: s, label: s }))];
    }

    if (selectedL1 === 'person_filter') {
      const allPersons = projects.flatMap(p => p.updates.map(u => u.person));
      const uniquePersons = [...new Set(allPersons)].sort();
      return [{ id: 'all', label: 'All' }, ...uniquePersons.map(p => ({ id: p, label: p }))];
    }

    return [];
  }, [selectedL1, level1Items, projects]);


  const level3Items = useMemo(() => {
    // 1. Static Hierarchy (Category > SubCategory)
    const parentL2 = level2Items.find(i => i.id === selectedL2);
    if (parentL2?.children && parentL2.children.length > 0) {
      return parentL2.children;
    }

    // 2. Dynamic Hierarchies (Status/Person > Projects)
    if (selectedL1 === 'status' && selectedL2) {
      return projects
        .filter(p => p.status === selectedL2)
        .map(p => ({ id: p.id, label: p.name }));
    }

    if (selectedL1 === 'person_filter' && selectedL2) {
      return projects
        .filter(p => p.updates.some(u => u.person === selectedL2))
        .map(p => ({ id: p.id, label: p.name }));
    }

    return [];
  }, [selectedL2, level2Items, selectedL1, projects]);


  const filteredProjects = useMemo(() => {
    console.log('Filtering:', { selectedL1, selectedL2, selectedL3 });

    return projects.map(project => {
      let isMatch = true;

      // -- L1/L2/L3 Filtering --
      if (selectedL1 === 'project') {
        // L2 = Category, L3 = SubCategory
        if (selectedL2 && selectedL2 !== 'all') {
          isMatch = isMatch && project.category === selectedL2;
        }
        if (selectedL3 && selectedL3 !== 'all') {
          // If L3 corresponds to SubCategory in FILTERS
          // We need to check if the project matches that subcategory.
          // Note: In constants.ts, subcategories are like '5g', 'revamp'
          if (project.subCategory) {
            // Simple loose matching based on existing logic
            isMatch = isMatch && project.subCategory.toLowerCase().includes(selectedL3.split(' ')[0].toLowerCase());
          }
        }
      }
      else if (selectedL1 === 'status') {
        // L2 = Status, L3 = Project
        if (selectedL2 && selectedL2 !== 'all') {
          isMatch = isMatch && project.status === selectedL2;
        }
        if (selectedL3 && selectedL3 !== 'all') {
          isMatch = isMatch && project.id === selectedL3;
        }
      }
      else if (selectedL1 === 'person_filter') {
        // L2 = Person, L3 = Project
        if (selectedL2 && selectedL2 !== 'all') {
          isMatch = isMatch && project.updates.some(u => u.person === selectedL2);
        }
        if (selectedL3 && selectedL3 !== 'all') {
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
    <div className="min-h-screen font-sans bg-background text-primary selection:bg-gray-200 p-8 md:p-12 lg:p-16">

      <header className="mb-12 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">minus one</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button onClick={logout} className="flex items-center gap-2 text-sm bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(!showLogin)} className="flex items-center gap-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors">
              <LogIn size={16} />
              Login
            </button>
          )}
          <button onClick={() => setShowAddProject(!showAddProject)} className="flex items-center gap-2 text-sm bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
            <Plus size={16} />
            Add Project
          </button>
        </div>
      </header>

      {showLogin && !user && (
        <div className="mb-12 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Login</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="text"
              value={loginForm.name}
              onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
              placeholder="Name"
              className="p-3 border rounded-lg"
              required
            />
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              placeholder="Email"
              className="p-3 border rounded-lg"
              required
            />
            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowLogin(false)} className="text-gray-600">Cancel</button>
              <button type="submit" className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600">Login</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <section className="relative mb-24 overflow-x-auto no-scrollbar">
        <div className="flex flex-nowrap gap-[120px] min-w-max pb-8 relative">

          <div className="relative">
            <FilterColumn
              title="Filter"
              items={level1Items}
              selectedId={selectedL1}
              onSelect={handleL1Select}
              levelIndex={0}
            />
            <ConnectorLine
              fromIndex={getIndex(level1Items, selectedL1)}
              toIndex={getIndex(level2Items, selectedL2)}
              isActive={level2Items.length > 0}
              rowHeight={ROW_HEIGHT}
              columnGap={COL_GAP}
            />
          </div>

          {level2Items.length > 0 && (
            <div className="relative">
              <FilterColumn
                title="Items"
                items={level2Items}
                selectedId={selectedL2}
                onSelect={handleL2Select}
                levelIndex={1}
              />
              <ConnectorLine
                fromIndex={getIndex(level2Items, selectedL2)}
                toIndex={getIndex(level3Items, selectedL3)}
                isActive={level3Items.length > 0}
                rowHeight={ROW_HEIGHT}
                columnGap={COL_GAP}
              />
            </div>
          )}

          {level3Items.length > 0 && (
            <div className="relative">
              <FilterColumn
                title="Sub-items"
                items={level3Items}
                selectedId={selectedL3}
                onSelect={setSelectedL3}
                levelIndex={2}
              />
            </div>
          )}


        </div>
      </section>

      {/* Main List Area */}
      <main className="max-w-5xl">
        <div className="relative mb-16">
          <input
            type="text"
            placeholder="Search updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-gray-300 py-3 text-2xl font-light focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
          />
          <Search className="absolute right-0 top-4 text-gray-400" />
        </div>

        <div className="w-full">
          {filteredProjects.length > 0 ? (
            <div className="flex flex-col">
              {filteredProjects.map((project) => (
                <ProjectGroup
                  key={project.id}
                  project={project}
                  forceExpand={searchQuery.length > 0}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-gray-400 text-sm font-mono">
              [ No projects found matching current criteria ]
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default App;