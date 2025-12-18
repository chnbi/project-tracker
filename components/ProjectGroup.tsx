import { useProjects } from '../contexts/ProjectContext';
import { ChevronDown, ChevronUp, Trash, Plus } from 'lucide-react';
import { Project, Update, Status } from '../types';

interface ProjectGroupProps {
  project: Project;
  forceExpand?: boolean;
}

const getStatusColor = (status: string) => {
  const s = status;
  if (s === 'Blocker') return 'bg-red-500';
  if (s === 'In Progress' || s === 'In Development') return 'bg-yellow-400';
  if (s === 'Pending Update') return 'bg-orange-400';
  if (s === 'QA' || s === 'Review') return 'bg-purple-300';
  if (s === 'IoT') return 'bg-blue-500';
  if (s === 'Live' || s === 'Completed') return 'bg-green-500';
  return 'bg-gray-300';
};

const UpdateRow: React.FC<{ update: Update }> = ({ update }) => (
  <div className="group grid grid-cols-12 gap-4 px-2 py-3 border-b border-gray-100 hover:bg-white items-start transition-all duration-200">
    <div className="col-span-1 flex items-center h-full pt-1.5">
       <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(update.status)} ring-2 ring-transparent group-hover:ring-gray-100 transition-all`} />
    </div>
    <div className="col-span-12 md:col-span-2 font-mono text-xs text-secondary pt-0.5 opacity-80">
      {update.date}
    </div>
    <div className="col-span-12 md:col-span-6 text-sm text-primary leading-relaxed font-medium">
      {update.description}
    </div>
    <div className="col-span-6 md:col-span-2 text-xs text-secondary pt-0.5">
      {update.person}
    </div>
    <div className="col-span-6 md:col-span-1 text-[10px] font-mono text-secondary text-right uppercase pt-0.5">
      {update.status}
    </div>
  </div>
);

export const ProjectGroup: React.FC<ProjectGroupProps> = ({ project, forceExpand = false }) => {
  const { addUpdate, deleteProject } = useProjects();
  const [isExpanded, setIsExpanded] = useState(forceExpand);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ description: '', person: '', status: 'In Progress' as Status });

  useEffect(() => {
    if (forceExpand) setIsExpanded(true);
  }, [forceExpand]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    addUpdate(project.id, newUpdate);
    setShowAddForm(false);
    setNewUpdate({ description: '', person: '', status: 'In Progress' as Status });
  };

  // Sorting updates by date (assuming ISO or standard format, but for now strictly taking index 0 as latest based on data structure)
  // Data is provided latest first in constants, so we use index 0.
  const latestUpdate = project.updates[0];
  const otherUpdates = project.updates.slice(1);

  return (
    <div className="mb-8 bg-gray-50/50 rounded-lg p-4 border border-transparent hover:border-gray-200 transition-colors">
      
      {/* Project Header (Clickable for accordion) */}
      <div 
        onClick={toggleExpand}
        className="flex items-center justify-between cursor-pointer group select-none mb-4"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
             <h2 className="text-xl font-semibold tracking-tight text-primary group-hover:text-black transition-colors">
               {project.name}
             </h2>
          </div>
          <div className="text-[10px] font-mono text-secondary uppercase tracking-wider mt-1.5 ml-[24px]">
            {project.category} {project.subCategory && `/ ${project.subCategory}`}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setShowAddForm(!showAddForm); }} className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors">
            <Plus size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-200 transition-colors text-red-500">
            <Trash size={18} />
          </button>
          <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddUpdate} className="mb-4 p-4 bg-white rounded-lg shadow">
          <textarea
            value={newUpdate.description}
            onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
            placeholder="Update description"
            className="w-full p-2 border rounded mb-2"
            required
          />
          <input
            type="text"
            value={newUpdate.person}
            onChange={(e) => setNewUpdate({ ...newUpdate, person: e.target.value })}
            placeholder="Person"
            className="w-full p-2 border rounded mb-2"
            required
          />
          <select
            value={newUpdate.status}
            onChange={(e) => setNewUpdate({ ...newUpdate, status: e.target.value as Status })}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="Pending Update">Pending Update</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Review">Review</option>
            <option value="Blocker">Blocker</option>
            <option value="QA">QA</option>
            <option value="IoT">IoT</option>
            <option value="Live">Live</option>
          </select>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
        </form>
      )}

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-4 px-2 py-2 text-[10px] font-mono text-secondary uppercase tracking-widest opacity-60 border-b border-gray-200 mb-2">
        <div className="col-span-1">Status</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-6">Latest Update</div>
        <div className="col-span-2">Person</div>
        <div className="col-span-1 text-right">State</div>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        {/* Always show latest update (if exists) */}
        {latestUpdate && (
           <UpdateRow update={latestUpdate} />
        )}

        {/* Show remaining updates if expanded */}
        {isExpanded && otherUpdates.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-gray-200 ml-1.5 space-y-1">
             <div className="px-2 py-1 text-[10px] text-gray-400 font-mono uppercase">History Log</div>
             {otherUpdates.map(u => <UpdateRow key={u.id} update={u} />)}
          </div>
        )}
      </div>
    </div>
  );
};