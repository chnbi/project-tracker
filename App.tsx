import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { FILTERS, PROJECTS } from './constants';
import { FilterNode, Project } from './types';
import { FilterColumn } from './components/FilterColumn';
import { ConnectorLine } from './components/ConnectorLine';
import { ProjectGroup } from './components/ProjectGroup';

const ROW_HEIGHT = 32; 
const COL_GAP = 120; 

const App: React.FC = () => {
  const [selectedL1, setSelectedL1] = useState<string>('project');
  const [selectedL2, setSelectedL2] = useState<string>('yos');
  const [selectedL3, setSelectedL3] = useState<string>('5g');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // -- Filter Logic --

  const level1Items = FILTERS;

  const level2Items = useMemo(() => {
    const parent = level1Items.find(i => i.id === selectedL1);
    return parent?.children || [];
  }, [selectedL1, level1Items]);

    const level3Items = useMemo(() => {

      const parent = level2Items.find(i => i.id === selectedL2);

      return parent?.children || [];

    }, [selectedL2, level2Items]);

  

    const statusItems = useMemo(() => {

      const allStatuses = PROJECTS.map(p => p.status);

      const uniqueStatuses = [...new Set(allStatuses)];

      const statusNodes: FilterNode[] = uniqueStatuses.map(s => ({ id: s, label: s }));

      return [{ id: 'all', label: 'All' }, ...statusNodes];

    }, []);

  

    const handleL1Select = (id: string) => {

      setSelectedL1(id);

      const nextL2 = FILTERS.find(f => f.id === id)?.children?.[0]?.id || null;

      setSelectedL2(nextL2 || '');

      

      if (nextL2) {

         const l2Node = FILTERS.find(f => f.id === id)?.children?.find(c => c.id === nextL2);

         setSelectedL3(l2Node?.children?.[0]?.id || '');

      } else {

          setSelectedL3('');

      }

    };

  const handleL2Select = (id: string) => {
    setSelectedL2(id);
    const parent = level2Items.find(i => i.id === id);
    setSelectedL3(parent?.children?.[0]?.id || '');
  };

  // -- Data Filtering Logic --

  const filteredProjects = useMemo(() => {
    return PROJECTS.map(project => {
      // 1. Filter by Categories
      let matchesCategory = true;
      if (selectedL1 === 'project') {
          if (selectedL2 && selectedL2 !== 'all') {
             matchesCategory = matchesCategory && project.category === selectedL2;
          }
          if (selectedL3 && selectedL3 !== 'all' && level3Items.length > 0) {
             if (project.subCategory) {
                 matchesCategory = matchesCategory && project.subCategory.includes(selectedL3.split(' ')[0].toLowerCase());
             }
          }
      }

      if (selectedL1 === 'status') {
        if (selectedStatus && selectedStatus !== 'all') {
          matchesCategory = project.status === selectedStatus;
        }
      }

      if (!matchesCategory) return null;

      // 2. Filter by Search Query
      const query = searchQuery.toLowerCase();
      const projectMatches = project.name.toLowerCase().includes(query);
      
      const matchingUpdates = project.updates.filter(u => 
        u.description.toLowerCase().includes(query) || 
        u.person.toLowerCase().includes(query)
      );

      // If search is empty, return all updates. 
      // If search active: 
      //   - if project title matches, show all
      //   - if updates match, show matching
      
      let finalUpdates = project.updates;
      
      if (query.length > 0) {
        if (projectMatches) {
            finalUpdates = project.updates;
        } else {
            finalUpdates = matchingUpdates;
        }
      }

      if (finalUpdates.length === 0) return null;

      return {
        ...project,
        updates: finalUpdates
      };
    }).filter((p): p is Project => p !== null);

  }, [searchQuery, selectedL1, selectedL2, selectedL3, level3Items]);


  const getIndex = (items: FilterNode[], id: string | null) => items.findIndex(i => i.id === id);

  return (
    <div className="min-h-screen font-sans bg-background text-primary selection:bg-gray-200 p-8 md:p-12 lg:p-16">
      
      <header className="mb-20">
        <h1 className="text-xl font-bold tracking-tight">minus one</h1>
      </header>

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

          {selectedL1 === 'status' && (
            <div className="relative">
              <FilterColumn
                title="Status"
                items={statusItems}
                selectedId={selectedStatus}
                onSelect={setSelectedStatus}
                levelIndex={1}
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