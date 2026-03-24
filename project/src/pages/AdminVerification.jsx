import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AdminVerification() {
  const { achievements, verifyAchievement } = useAuth();
  const [pendingDocs, setPendingDocs] = useState([]);
  const [pendingAchs, setPendingAchs] = useState([]);
  const [rejectionReason, setRejectionReason] = useState({});
  const [showRejectionDialog, setShowRejectionDialog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDocuments();
    fetchPendingAchievements();
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/documents/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Transform the data to match the expected format
      const transformedDocs = response.data.map(doc => ({
        id: doc._id,
        studentId: doc.studentId?._id || 'unknown',
        studentName: doc.studentId?.name || 'Unknown Student',
        studentRegNo: doc.studentId?.studentDetails?.regNo || 'N/A',
        studentEmail: doc.studentId?.email || 'N/A',
        type: doc.type,
        fileName: doc.fileName,
        originalName: doc.originalName,
        uploadedDate: new Date(doc.uploadedDate).toLocaleDateString(),
        status: doc.status
      }));
      
      setPendingDocs(transformedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchPendingAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/achievements/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Transform the data to match the expected format
      const transformedAchs = response.data.map(ach => ({
        id: ach._id,
        studentId: ach.studentId?._id || 'unknown',
        studentName: ach.studentId?.name || 'Unknown Student',
        studentRegNo: ach.studentId?.studentDetails?.regNo || 'N/A',
        studentEmail: ach.studentId?.email || 'N/A',
        title: ach.title,
        type: ach.type,
        description: ach.description,
        academicYear: ach.academicYear,
        semester: ach.semester,
        date: new Date(ach.date).toLocaleDateString(),
        hasAttachment: ach.hasAttachment,
        fileName: ach.fileName,
        originalName: ach.originalName,
        uploadedDate: new Date(ach.uploadedDate).toLocaleDateString(),
        status: ach.status
      }));
      
      setPendingAchs(transformedAchs);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc) => {
    const url = `http://localhost:5000/api/documents/file/${doc.fileName}`;
    window.open(url, '_blank');
  };

  const handleViewAchievement = (ach) => {
    if (ach.hasAttachment && ach.fileName) {
      const url = `http://localhost:5000/api/achievements/file/${ach.fileName}`;
      window.open(url, '_blank');
    }
  };

  const handleVerifyDocument = async (docId, newStatus) => {
    if (newStatus === 'Rejected' && !rejectionReason[docId]) {
      setShowRejectionDialog(docId);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/documents/${docId}/verify`, {
        status: newStatus,
        rejectionReason: newStatus === 'Rejected' ? rejectionReason[docId] : null
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Remove the verified document from pending list
      setPendingDocs(prev => prev.filter(doc => doc.id !== docId));
      
      if (showRejectionDialog === docId) {
        setShowRejectionDialog(null);
        setRejectionReason(prev => ({ ...prev, [docId]: '' }));
      }
    } catch (error) {
      console.error('Verification error:', error);
    }
  };

  const handleVerifyAchievement = async (achId, newStatus) => {
    if (newStatus === 'Rejected' && !rejectionReason[`ach_${achId}`]) {
      setShowRejectionDialog(`ach_${achId}`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/achievements/${achId}/verify`, {
        status: newStatus,
        rejectionReason: newStatus === 'Rejected' ? rejectionReason[`ach_${achId}`] : null
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Remove the verified achievement from pending list
      setPendingAchs(prev => prev.filter(ach => ach.id !== achId));
      
      if (showRejectionDialog === `ach_${achId}`) {
        setShowRejectionDialog(null);
        setRejectionReason(prev => ({ ...prev, [`ach_${achId}`]: '' }));
      }
    } catch (error) {
      console.error('Achievement verification error:', error);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-display font-bold text-foreground">Verification Panel</h2>

      {/* Pending Documents */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-foreground">Pending Documents ({pendingDocs.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading documents...</div>
        ) : pendingDocs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">All documents are verified ✅</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Document</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pendingDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{doc.studentName}</p>
                      <p className="text-xs text-muted-foreground">{doc.studentRegNo}</p>
                      <p className="text-xs text-muted-foreground">{doc.studentEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{doc.type}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-xs">{doc.originalName || doc.fileName}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{doc.uploadedDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewDocument(doc)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-secondary/10 text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-secondary/20 transition-colors"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button 
                          onClick={() => handleVerifyDocument(doc.id, 'Verified')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-semibold hover:bg-success/20 transition-colors"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleVerifyDocument(doc.id, 'Rejected')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs font-semibold hover:bg-destructive/20 transition-colors"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Rejection Reason Dialog */}
      {showRejectionDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowRejectionDialog(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border shadow-soft p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="text-destructive" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Rejection Reason</h3>
                <p className="text-sm text-muted-foreground">Please provide a reason for rejecting this document</p>
              </div>
            </div>
            
            <textarea
              value={rejectionReason[showRejectionDialog] || ''}
              onChange={(e) => setRejectionReason(prev => ({ ...prev, [showRejectionDialog]: e.target.value }))}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  if (showRejectionDialog.startsWith('ach_')) {
                    handleVerifyAchievement(showRejectionDialog.replace('ach_', ''), 'Rejected');
                  } else {
                    handleVerifyDocument(showRejectionDialog, 'Rejected');
                  }
                }}
                disabled={!rejectionReason[showRejectionDialog]?.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectionDialog(null);
                  setRejectionReason(prev => ({ ...prev, [showRejectionDialog]: '' }));
                }}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Pending Achievements */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-foreground">Pending Achievements ({pendingAchs.length})</h3>
        </div>
        {pendingAchs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">All achievements are verified ✅</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Achievement</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pendingAchs.map(ach => (
                  <tr key={ach.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{ach.studentName}</p>
                      <p className="text-xs text-muted-foreground">{ach.studentRegNo}</p>
                      <p className="text-xs text-muted-foreground">{ach.studentEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{ach.title}</p>
                      <p className="text-xs text-muted-foreground">{ach.description}</p>
                      <p className="text-xs text-muted-foreground">{ach.academicYear} - {ach.semester}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{ach.type}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{ach.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {ach.hasAttachment && (
                          <button 
                            onClick={() => handleViewAchievement(ach)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-secondary/10 text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-secondary/20 transition-colors"
                          >
                            <Eye size={14} /> View
                          </button>
                        )}
                        <button 
                          onClick={() => handleVerifyAchievement(ach.id, 'Verified')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-semibold hover:bg-success/20 transition-colors"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleVerifyAchievement(ach.id, 'Rejected')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs font-semibold hover:bg-destructive/20 transition-colors"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
