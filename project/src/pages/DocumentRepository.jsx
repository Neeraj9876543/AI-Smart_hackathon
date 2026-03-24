import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FileText, Upload, CheckCircle, Clock, Eye, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

const docTypes = ['Aadhaar', 'PAN Card', 'Mark Memo (Sem 1-4)', 'APAAR / ABC ID', 'Transfer Certificate', 'Income Certificate', 'Caste Certificate', 'Study Certificate', '10th Memo', 'Inter Memo', 'Other'];

export default function DocumentRepository() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [customDocType, setCustomDocType] = useState(''); // For custom document name
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(''); // Success message
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudentDocuments();
  }, [user]);

  const fetchStudentDocuments = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/documents/student`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Transform the data to match the expected format
      const transformedDocs = (response.data || []).map(doc => ({
        id: doc._id,
        studentId: doc.studentId,
        type: doc.type,
        status: doc.status,
        uploadedDate: new Date(doc.uploadedDate).toLocaleDateString(),
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        originalName: doc.originalName,
        rejectionReason: doc.rejectionReason
      }));
      
      setDocuments(transformedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStudentDocs = (studentId) => documents.filter(d => d.studentId === studentId);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
        setUploadError('Only JPEG, PNG, and PDF files are allowed');
        return;
      }
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      setUploadError('Please select a document type and file');
      return;
    }
    
    if (selectedDocType === 'Other' && !customDocType.trim()) {
      setUploadError('Please specify the document type');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('type', selectedDocType === 'Other' ? customDocType : selectedDocType);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const newDoc = {
        id: response.data.document.id,
        studentId: user.id,
        type: response.data.document.type,
        status: response.data.document.status,
        uploadedDate: new Date(response.data.document.uploadedDate).toLocaleDateString(),
        fileUrl: response.data.document.fileUrl,
        fileName: response.data.document.fileName,
        originalName: response.data.document.originalName,
      };

      setDocuments(prev => [newDoc, ...prev]);
      setUploadSuccess(`${response.data.document.type} document uploaded successfully!`);
      setTimeout(() => setUploadSuccess(''), 3000);
      setShowUpload(false);
      setSelectedFile(null);
      setSelectedDocType('');
      setCustomDocType('');
      setUploadError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = (doc) => {
    const url = `http://localhost:5000/api/documents/file/${doc.fileName}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-foreground">Document Repository</h2>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 gradient-brand text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold"
        >
          <Upload size={16} /> Upload Document
        </button>
      </div>

      {showUpload && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-soft p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-foreground">Upload New Document</h3>
            <button
              onClick={() => {
                setShowUpload(false);
                setSelectedFile(null);
                setSelectedDocType('');
                setUploadError('');
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>
          
          {uploadError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-destructive" />
              <span className="text-sm text-destructive">{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <span className="text-sm text-success">{uploadSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Document Type</label>
              <select 
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select document type</option>
                {docTypes.map(type => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Upload File (PDF/Image)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="border-2 border-dashed border-border rounded-lg px-4 py-3 text-center hover:border-primary/50 transition-colors cursor-pointer block"
              >
                {selectedFile ? (
                  <p className="text-sm text-foreground">{selectedFile.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to browse or drag & drop</p>
                )}
              </label>
            </div>
          </div>

          {selectedDocType === 'Other' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Specify Document Type</label>
                <input
                  type="text"
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value)}
                  placeholder="e.g., Passport, Driving License, etc."
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </motion.div>
          )}
          <div className="flex gap-3 mt-4">
            <button 
              onClick={handleUpload}
              disabled={uploading}
              className="gradient-brand text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Submit Document'}
            </button>
            <button 
              onClick={() => {
                setShowUpload(false);
                setSelectedFile(null);
                setSelectedDocType('');
                setCustomDocType('');
                setUploadError('');
              }}
              className="px-6 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-muted-foreground text-sm py-8">Loading documents...</div>
        ) : (
          <>
            {/* Predefined document types */}
            {docTypes.filter(type => type !== 'Other').map((type, i) => {
              const doc = documents.find(d => d.type === type);
              return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border shadow-card p-5 hover:shadow-soft transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <FileText className="text-muted-foreground" size={18} />
                  </div>
                  {doc && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      doc.status === 'Verified' ? 'bg-success/10 text-success' : 
                      doc.status === 'Rejected' ? 'bg-destructive/10 text-destructive' : 
                      'bg-warning/10 text-warning'
                    }`}>
                      {doc.status}
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-foreground text-sm">{type}</h4>
                {doc ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedDate}</p>
                    <p className="text-xs text-muted-foreground truncate">File: {doc.originalName}</p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewDocument(doc)}
                        className="text-primary hover:underline text-xs font-medium flex items-center gap-1"
                      >
                        <Eye size={12} /> View
                      </button>
                      {doc.status === 'Rejected' && doc.rejectionReason && (
                        <span className="text-xs text-destructive">Rejected: {doc.rejectionReason}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setShowUpload(true);
                      setSelectedDocType(type);
                    }}
                    className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <Upload size={12} /> Upload now
                  </button>
              )}
              </motion.div>
            );
          })}

            {/* Custom documents */}
            {documents
              .filter(doc => !docTypes.includes(doc.type))
              .map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (docTypes.length - 1 + index) * 0.05 }}
                  className="bg-card rounded-2xl border border-border shadow-card p-5 hover:shadow-soft transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="text-primary" size={18} />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      doc.status === 'Verified' ? 'bg-success/10 text-success' : 
                      doc.status === 'Rejected' ? 'bg-destructive/10 text-destructive' : 
                      'bg-warning/10 text-warning'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">{doc.type}</h4>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedDate}</p>
                    <p className="text-xs text-muted-foreground truncate">File: {doc.originalName}</p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewDocument(doc)}
                        className="text-primary hover:underline text-xs font-medium flex items-center gap-1"
                      >
                        <Eye size={12} /> View
                      </button>
                      {doc.status === 'Rejected' && doc.rejectionReason && (
                        <span className="text-xs text-destructive">Rejected: {doc.rejectionReason}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            }
          </>
        )}
      </div>
    </div>
  );
}
