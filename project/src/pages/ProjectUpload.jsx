import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  ExternalLink, 
  Github, 
  Calendar,
  Tag,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Star
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export default function ProjectUpload() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    projectUrl: '',
    githubUrl: '',
    startDate: '',
    endDate: '',
    status: 'in-progress',
    category: 'personal'
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/projects/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProjects(res.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      let response;
      if (editingProject) {
        response = await axios.put(
          `http://localhost:5000/api/projects/${editingProject._id}`,
          formDataToSend,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        toast.success('Project updated successfully!');
      } else {
        response = await axios.post(
          'http://localhost:5000/api/projects',
          formDataToSend,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        toast.success('Project uploaded successfully!');
      }

      fetchProjects();
      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(error.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      technologies: project.technologies.join(', '),
      projectUrl: project.projectUrl || '',
      githubUrl: project.githubUrl || '',
      startDate: project.startDate?.split('T')[0] || '',
      endDate: project.endDate?.split('T')[0] || '',
      status: project.status,
      category: project.category
    });
    setAttachments([]);
    setShowForm(true);
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Project deleted successfully!');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const toggleResumeSelection = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/projects/${projectId}/select-for-resume`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setProjects(projects.map(project => 
        project._id === projectId 
          ? { ...project, isSelectedForResume: !project.isSelectedForResume }
          : project
      ));
      
      toast.success('Project selection updated!');
    } catch (error) {
      console.error('Error updating selection:', error);
      toast.error('Failed to update selection');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      technologies: '',
      projectUrl: '',
      githubUrl: '',
      startDate: '',
      endDate: '',
      status: 'in-progress',
      category: 'personal'
    });
    setAttachments([]);
    setEditingProject(null);
    setShowForm(false);
  };

  const getStatusIcon = (status) => {
    const icons = {
      'planning': <Clock className="w-4 h-4" />,
      'in-progress': <AlertCircle className="w-4 h-4" />,
      'completed': <CheckCircle className="w-4 h-4" />,
      'on-hold': <X className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-2">
            <Code className="text-primary" size={32} />
            My Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Showcase your development projects and build your portfolio.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-primary/20 transition-all"
        >
          <Plus size={18} />
          Add Project
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-soft"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button
                onClick={resetForm}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="academic">Academic</option>
                    <option value="personal">Personal</option>
                    <option value="opensource">Open Source</option>
                    <option value="commercial">Commercial</option>
                    <option value="research">Research</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe your project, its purpose, and what you accomplished..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Technologies *</label>
                <input
                  type="text"
                  required
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="React, Node.js, MongoDB (comma-separated)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project URL</label>
                  <input
                    type="url"
                    value={formData.projectUrl}
                    onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://myproject.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Attachments (Max 5 files, 10MB each)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setAttachments(Array.from(e.target.files))}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
                />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((file, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingProject ? 'Update Project' : 'Add Project'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-secondary text-foreground rounded-xl font-bold border border-border hover:bg-secondary/80 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
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
                  <h3 className="font-bold text-lg">{project.title}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{project.category}</p>
                </div>
              </div>
              <button
                onClick={() => toggleResumeSelection(project._id)}
                className={`p-2 rounded-lg transition-all ${
                  project.isSelectedForResume 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
                title={project.isSelectedForResume ? 'Selected for resume' : 'Select for resume'}
              >
                <Star size={16} fill={project.isSelectedForResume ? 'currentColor' : 'none'} />
              </button>
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
                {project.isVerified && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle size={12} />
                    Verified
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(project)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-all"
                  title="Edit"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(project._id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-all"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Code className="text-primary" size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Projects Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Start building your portfolio by adding your first project. Showcase your skills and accomplishments to potential employers.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-primary/20 transition-all mx-auto"
          >
            <Plus size={18} />
            Add Your First Project
          </button>
        </motion.div>
      )}
    </div>
  );
}
