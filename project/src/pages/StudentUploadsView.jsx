import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FileText, Trophy, Eye, Download, 
  Calendar, User, CheckCircle, Clock, XCircle,
  FileImage, File, Filter
} from 'lucide-react';
import axios from 'axios';

const typeIcons = {
  'Hackathon': '🏆', 'Internship': '💼', 'Research Paper': '📄',
  'Technical Competition': '⚡', 'Workshop': '🔧', 'Cultural': '🎭', 'Sports': '🏀', 'Other': '🏅'
};

export default function StudentUploadsView() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [studentData, setStudentData] = useState({
    student: {},
    documents: [],
    achievements: []
  });
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/student/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setStudentData(response.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (item, type) => {
    if (item.hasAttachment && item.fileName) {
      const url = `http://localhost:5000/api/${type}s/file/${item.fileName}`;
      window.open(url, '_blank');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified': return 'bg-success/10 text-success';
      case 'Rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-warning/10 text-warning';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Verified': return <CheckCircle size={14} />;
      case 'Rejected': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const filteredDocuments = filterStatus === 'All' 
    ? studentData.documents 
    : studentData.documents.filter(doc => doc.status === filterStatus);

  const filteredAchievements = filterStatus === 'All' 
    ? studentData.achievements 
    : studentData.achievements.filter(ach => ach.status === filterStatus);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/search')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48"></div>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  const { student, documents, achievements } = studentData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/search')} 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Student Uploads</h2>
            <p className="text-muted-foreground text-sm">{student.name} • {student.regNo}</p>
          </div>
        </div>
      </div>

      {/* Student Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-soft p-6"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {student.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
            <p className="text-muted-foreground text-sm">
              {student.regNo} • {student.branch} • {student.year} Year • Section {student.section}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {student.email} • {student.phone}
            </p>
          </div>
          <div className="text-right">
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{documents.length}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{achievements.length}</p>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 bg-card rounded-lg border border-border p-1">
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'documents' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText size={16} /> Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'achievements' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy size={16} /> Achievements ({achievements.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden"
        >
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">File</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Upload Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredDocuments.map((doc, i) => (
                    <tr key={doc.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{doc.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {doc.hasAttachment ? (
                            <>
                              <File size={16} className="text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{doc.originalName}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">No file</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(doc.uploadedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(doc.status)}`}>
                            {getStatusIcon(doc.status)}
                            {doc.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {doc.hasAttachment && (
                            <button
                              onClick={() => handleViewFile(doc, 'document')}
                              className="text-primary hover:text-primary/80 transition-colors"
                              title="View file"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden"
        >
          {filteredAchievements.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Trophy size={48} className="mx-auto mb-4 opacity-50" />
              <p>No achievements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Achievement</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">File</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredAchievements.map((ach, i) => (
                    <tr key={ach.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{typeIcons[ach.type] || '🏅'}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{ach.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{ach.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{ach.type}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(ach.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {ach.hasAttachment ? (
                            <>
                              <FileImage size={16} className="text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{ach.originalName}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">No file</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(ach.status)}`}>
                            {getStatusIcon(ach.status)}
                            {ach.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {ach.hasAttachment && (
                            <button
                              onClick={() => handleViewFile(ach, 'achievement')}
                              className="text-primary hover:text-primary/80 transition-colors"
                              title="View file"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
