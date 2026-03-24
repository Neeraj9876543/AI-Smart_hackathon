import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FileText, Trophy, Eye, Download, Trash2, 
  Calendar, User, CheckCircle, Clock, XCircle,
  FileImage, File, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

const typeIcons = {
  'Hackathon': '🏆', 'Internship': '💼', 'Research Paper': '📄',
  'Technical Competition': '⚡', 'Workshop': '🔧', 'Cultural': '🎭', 'Sports': '🏀', 'Other': '🏅'
};

export default function StudentMyUploads() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [uploads, setUploads] = useState({
    documents: [],
    achievements: []
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchMyUploads();
  }, [user]);

  const fetchMyUploads = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch documents and achievements in parallel
      const [documentsRes, achievementsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/documents/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/achievements/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      setUploads({
        documents: documentsRes.data || [],
        achievements: achievementsRes.data || []
      });
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setUploads({
        documents: [],
        achievements: []
      });
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

  const handleDelete = async (item, type) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/${type}s/${item._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Refresh the uploads list
      await fetchMyUploads();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
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
      case 'Verified': return <CheckCircle size={16} />;
      case 'Rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-card p-6 rounded-2xl border border-border">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student/dashboard')}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Uploads</h1>
              <p className="text-muted-foreground">Manage your documents and achievements</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-10 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold text-foreground">{uploads.documents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-10 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-foreground">
                  {uploads.documents.filter(d => d.status === 'Verified').length + 
                   uploads.achievements.filter(a => a.status === 'Verified').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-10 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {uploads.documents.filter(d => d.status === 'Pending').length + 
                   uploads.achievements.filter(a => a.status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-10 rounded-lg flex items-center justify-center">
                <Trophy size={20} className="text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold text-foreground">{uploads.achievements.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-2xl border border-border shadow-soft">
          <div className="border-b border-border">
            <div className="flex">
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'documents' 
                    ? 'text-foreground border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText size={16} />
                Documents ({uploads.documents.length})
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'achievements' 
                    ? 'text-foreground border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Trophy size={16} />
                Achievements ({uploads.achievements.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {uploads.documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                    <button 
                      onClick={() => navigate('/document-upload')}
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Upload Document
                    </button>
                  </div>
                ) : (
                  uploads.documents.map((doc) => (
                    <motion.div
                      key={doc._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-border rounded-xl p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-10 rounded-lg flex items-center justify-center">
                            <FileText size={20} className="text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{doc.type}</h4>
                            <p className="text-sm text-muted-foreground">
                              Uploaded on {new Date(doc.uploadedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                            {getStatusIcon(doc.status)}
                            {doc.status}
                          </div>
                          
                          {doc.hasAttachment && (
                            <button
                              onClick={() => handleViewFile(doc, 'document')}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              title="View document"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => setDeleteConfirm({ item: doc, type: 'document' })}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Delete document"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-4">
                {uploads.achievements.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No achievements uploaded yet</p>
                    <button 
                      onClick={() => navigate('/achievement-upload')}
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Upload Achievement
                    </button>
                  </div>
                ) : (
                  uploads.achievements.map((ach) => (
                    <motion.div
                      key={ach._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-border rounded-xl p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-10 rounded-lg flex items-center justify-center text-2xl">
                            {typeIcons[ach.type] || '🏅'}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{ach.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {ach.type} • {new Date(ach.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ach.status)}`}>
                            {getStatusIcon(ach.status)}
                            {ach.status}
                          </div>
                          
                          {ach.hasAttachment && (
                            <button
                              onClick={() => handleViewFile(ach, 'achievement')}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              title="View achievement"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => setDeleteConfirm({ item: ach, type: 'achievement' })}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Delete achievement"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 max-w-md mx-4 border border-border shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Delete {deleteConfirm.type}?</h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. The file will be permanently deleted.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.item, deleteConfirm.type)}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
