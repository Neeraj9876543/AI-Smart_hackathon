import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Download,
  Calendar,
  Tag,
  User,
  ExternalLink,
  Github,
  FileText,
  ChevronDown,
  Star,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export default function AdminProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [currentPage, filterStatus, filterCategory, filterVerified, searchTerm]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
      });

      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);
      if (filterVerified !== '') params.append('verified', filterVerified);
      if (searchTerm) params.append('search', searchTerm);

      const res = await axios.get(`http://localhost:5000/api/projects/admin?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setProjects(res.data.projects);
      setTotalPages(res.data.pagination.total);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/projects/${projectId}/verify`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setProjects(projects.map(project => 
        project._id === projectId 
          ? { ...project, isVerified: !project.isVerified }
          : project
      ));

      toast.success('Project verification status updated!');
    } catch (error) {
      console.error('Error verifying project:', error);
      toast.error('Failed to update verification status');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'planning': <AlertCircle className="w-4 h-4" />,
      'in-progress': <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />,
      'completed': <CheckCircle className="w-4 h-4" />,
      'on-hold': <XCircle className="w-4 h-4" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'planning': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'on-hold': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'academic': 'bg-purple-100 text-purple-800',
      'personal': 'bg-indigo-100 text-indigo-800',
      'opensource': 'bg-green-100 text-green-800',
      'commercial': 'bg-orange-100 text-orange-800',
      'research': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.studentId.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-2">
            <Code className="text-primary" size={32} />
            Student Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and verify student projects for their portfolios.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search projects, students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg border border-border hover:bg-secondary/80 transition-all"
          >
            <Filter size={18} />
            Filters
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="personal">Personal</option>
                  <option value="opensource">Open Source</option>
                  <option value="commercial">Commercial</option>
                  <option value="research">Research</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Verification</label>
                <select
                  value={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Projects</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Unverified Only</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{project.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {project.isVerified && (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                    {project.isSelectedForResume && (
                      <Star className="w-4 h-4 text-warning" fill="currentColor" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <User size={14} />
                  <span>{project.studentId.name}</span>
                  <span className="text-xs">({project.studentId.studentDetails?.regNo})</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {project.technologies.slice(0, 3).map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary text-xs rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="px-2 py-1 bg-secondary text-xs rounded-md">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar size={12} />
                  <span>
                    {new Date(project.startDate).toLocaleDateString()} - 
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Present'}
                  </span>
                </div>

                <div className="flex gap-2 mb-4">
                  {project.projectUrl && (
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
                      title="View Project"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
                      title="View on GitHub"
                    >
                      <Github size={14} />
                    </a>
                  )}
                  {project.attachments && project.attachments.length > 0 && (
                    <div className="p-2 bg-secondary rounded-lg" title={`${project.attachments.length} attachment(s)`}>
                      <FileText size={14} />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(project.category)}`}>
                      {project.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="p-2 text-muted-foreground hover:text-foreground transition-all"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleVerify(project._id)}
                      className={`p-2 rounded-lg transition-all ${
                        project.isVerified 
                          ? 'text-success hover:bg-success/10' 
                          : 'text-muted-foreground hover:text-warning'
                      }`}
                      title={project.isVerified ? 'Verified' : 'Verify Project'}
                    >
                      <CheckCircle size={14} fill={project.isVerified ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Code className="text-primary" size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Projects Found</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm || filterStatus || filterCategory || filterVerified !== ''
                  ? 'Try adjusting your search or filters to find projects.'
                  : 'No projects have been submitted by students yet.'}
              </p>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-secondary text-foreground rounded-lg border border-border hover:bg-secondary/80 transition-all disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-secondary text-foreground rounded-lg border border-border hover:bg-secondary/80 transition-all disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{selectedProject.studentId.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag size={16} />
                    <span className="capitalize">{selectedProject.category}</span>
                  </div>
                  <div className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map((tech, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-secondary text-sm rounded-lg"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Timeline</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedProject.startDate).toLocaleDateString()} - 
                      {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'Present'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Student Info</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedProject.studentId.studentDetails?.regNo}<br />
                      {selectedProject.studentId.studentDetails?.branch}
                    </p>
                  </div>
                </div>

                {(selectedProject.projectUrl || selectedProject.githubUrl) && (
                  <div>
                    <h3 className="font-semibold mb-2">Links</h3>
                    <div className="flex gap-3">
                      {selectedProject.projectUrl && (
                        <a
                          href={selectedProject.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <ExternalLink size={16} />
                          Project URL
                        </a>
                      )}
                      {selectedProject.githubUrl && (
                        <a
                          href={selectedProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Github size={16} />
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {selectedProject.attachments && selectedProject.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Attachments</h3>
                    <div className="space-y-2">
                      {selectedProject.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText size={16} />
                            <span className="text-sm">{attachment.originalName}</span>
                          </div>
                          <a
                            href={`http://localhost:5000${attachment.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-background rounded transition-all"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {selectedProject.isVerified ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-success" />
                          <span className="text-sm text-success">Verified</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Not Verified</span>
                        </>
                      )}
                    </div>
                    {selectedProject.isSelectedForResume && (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-warning" fill="currentColor" />
                        <span className="text-sm text-warning">Selected for Resume</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleVerify(selectedProject._id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedProject.isVerified
                        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {selectedProject.isVerified ? 'Remove Verification' : 'Verify Project'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
