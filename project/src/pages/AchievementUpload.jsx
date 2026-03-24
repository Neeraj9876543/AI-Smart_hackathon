import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, X, AlertCircle, Eye } from 'lucide-react';
import axios from 'axios';

const activityTypes = ['Hackathon', 'Internship', 'Research Paper', 'Technical Competition', 'Workshop', 'Cultural', 'Sports', 'Other'];
const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const academicYears = ['2024-25', '2023-24', '2022-23', '2021-22'];

export default function AchievementUpload() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '', 
    description: '', 
    type: 'Hackathon',
    customType: '', // For when "Other" is selected
    academicYear: '2024-25', 
    semester: '6th', 
    date: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title || !form.description || !form.academicYear || !form.semester || !form.date) {
      setUploadError('Please fill all required fields');
      return;
    }
    
    if (form.type === 'Other' && !form.customType.trim()) {
      setUploadError('Please specify the achievement type');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('type', form.type === 'Other' ? form.customType : form.type);
    formData.append('academicYear', form.academicYear);
    formData.append('semester', form.semester);
    formData.append('date', form.date);
    
    if (selectedFile) {
      formData.append('attachment', selectedFile);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/achievements/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      
      // Reset form
      setForm({ 
        title: '', 
        description: '', 
        type: 'Hackathon', 
        customType: '',
        academicYear: '2024-25', 
        semester: '6th', 
        date: '' 
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-display font-bold text-foreground">Upload Achievement</h2>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 text-success px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <CheckCircle size={18} /> Achievement submitted successfully! It will appear in your achievements after verification.
        </motion.div>
      )}

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2"
        >
          <AlertCircle size={16} className="text-destructive" />
          <span className="text-sm text-destructive">{uploadError}</span>
        </motion.div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl border border-border shadow-soft p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
          <input
            required value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Smart India Hackathon 2024"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of your achievement"
            rows={3}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Activity Type *</label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value, customType: e.target.value === 'Other' ? '' : form.customType })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {activityTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Date *</label>
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {form.type === 'Other' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Specify Achievement Type *</label>
              <input
                required
                type="text"
                value={form.customType}
                onChange={(e) => setForm({ ...form, customType: e.target.value })}
                placeholder="e.g., Debate Competition, Art Exhibition, etc."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Academic Year *</label>
            <select
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {academicYears.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Semester *</label>
            <select
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {semesters.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Upload Certificate (Optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
            id="achievement-file-upload"
          />
          <label
            htmlFor="achievement-file-upload"
            className="border-2 border-dashed border-border rounded-lg px-6 py-8 text-center hover:border-primary/50 transition-colors cursor-pointer block"
          >
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Eye size={20} className="text-primary" />
                  <span className="text-sm text-foreground font-medium">{selectedFile.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto text-muted-foreground" size={24} />
                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground">PDF, PNG, JPG (Max 5MB)</p>
              </div>
            )}
          </label>
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          className="w-full gradient-brand text-primary-foreground py-3.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Submit Achievement'}
        </button>
      </motion.form>
    </div>
  );
}
