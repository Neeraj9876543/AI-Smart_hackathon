import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, RefreshCw, FileText, ChevronRight, Check, AlertCircle, Edit3, Save, Code, Star, ExternalLink, Github, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ResumeAI() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const resumeRef = useRef(null);

  useEffect(() => {
    fetchExistingResume();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/projects/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const projectData = res.data || [];
      setProjects(projectData);
      // Pre-select projects that are already marked for resume
      setSelectedProjects(projectData.filter(p => p.isSelectedForResume).map(p => p._id));
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
      setSelectedProjects([]);
    }
  };

  const fetchExistingResume = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/resume', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setResumeData(res.data);
    } catch (error) {
      console.log('No existing resume found');
    }
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const saveProjectSelections = async () => {
    try {
      const token = localStorage.getItem('token');
      // Update all projects to match the selection
      await Promise.all(projects.map(project => {
        const shouldBeSelected = selectedProjects.includes(project._id);
        if (project.isSelectedForResume !== shouldBeSelected) {
          return axios.patch(`http://localhost:5000/api/projects/${project._id}/select-for-resume`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        return Promise.resolve();
      }));
      
      // Update local state
      setProjects(projects.map(project => ({
        ...project,
        isSelectedForResume: selectedProjects.includes(project._id)
      })));
      
      toast.success('Project selections saved!');
      setShowProjectSelector(false);
    } catch (error) {
      console.error('Error saving project selections:', error);
      toast.error('Failed to save project selections');
    }
  };

  const generateResume = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/resume/generate', {
        selectedProjects: selectedProjects
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setResumeData(res.data.resume);
      toast.success('AI has generated your professional resume!');
    } catch (error) {
      console.error('Error generating resume:', error);
      const errorMsg = error.response?.data?.message || 'Failed to generate resume. Please try again.';
      const detailMsg = error.response?.data?.error ? ` (${error.response.data.error})` : '';
      toast.error(errorMsg + detailMsg);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!resumeRef.current) return;
    
    const toastId = toast.loading('Preparing your PDF...');
    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${user.name.replace(' ', '_')}_Resume.pdf`);
      toast.success('Resume downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF', { id: toastId });
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/resume', resumeData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setIsEditing(false);
      toast.success('Resume updated successfully');
    } catch (error) {
      toast.error('Failed to update resume');
    }
  };

  const handleFieldChange = (section, field, value) => {
    setResumeData(prev => {
      const newData = { ...prev };
      if (section === 'personalInfo') {
        newData.personalInfo = { ...newData.personalInfo, [field]: value };
      } else if (section === 'summary') {
        newData.summary = value;
      } else if (section === 'education') {
        const [index, subField] = field.split('.');
        newData.education[index] = { ...newData.education[index], [subField]: value };
      } else if (section === 'experience') {
        const [index, subField] = field.split('.');
        newData.experience[index] = { ...newData.experience[index], [subField]: value };
      } else if (section === 'skills') {
        if (field === 'array') {
          newData.skills = value.split(',').map(skill => skill.trim()).filter(skill => skill);
        } else {
          newData.skills = value;
        }
      } else if (section === 'achievements') {
        const [index, subField] = field.split('.');
        newData.achievements[index] = { ...newData.achievements[index], [subField]: value };
      } else if (section === 'projects') {
        const [index, subField] = field.split('.');
        newData.projects[index] = { ...newData.projects[index], [subField]: value };
      } else if (section === 'languages') {
        if (field === 'array') {
          newData.languages = value.split(',').map(lang => lang.trim()).filter(lang => lang);
        } else {
          newData.languages = value;
        }
      }
      return newData;
    });
  };

  const addNewItem = (section) => {
    setResumeData(prev => {
      const newData = { ...prev };
      if (section === 'education') {
        const newItem = {
          institution: '',
          degree: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          description: ''
        };
        newData.education = [...newData.education, newItem];
      } else if (section === 'experience') {
        const newItem = {
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          description: ''
        };
        newData.experience = [...newData.experience, newItem];
      } else if (section === 'achievements') {
        const newItem = {
          title: '',
          date: '',
          description: ''
        };
        newData.achievements = [...newData.achievements, newItem];
      } else if (section === 'projects') {
        const newItem = {
          title: '',
          description: '',
          technologies: [],
          link: ''
        };
        newData.projects = [...newData.projects, newItem];
      }
      return newData;
    });
  };

  const removeItem = (section, index) => {
    setResumeData(prev => {
      const newData = { ...prev };
      if (section === 'education') {
        newData.education = newData.education.filter((_, i) => i !== index);
      } else if (section === 'experience') {
        newData.experience = newData.experience.filter((_, i) => i !== index);
      } else if (section === 'achievements') {
        newData.achievements = newData.achievements.filter((_, i) => i !== index);
      } else if (section === 'projects') {
        newData.projects = newData.projects.filter((_, i) => i !== index);
      }
      return newData;
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-2">
            AI Resume Builder <Sparkles className="text-primary animate-pulse" size={24} />
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate a professional resume based on your verified documents and achievements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProjectSelector(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-foreground rounded-lg font-medium border border-border hover:bg-secondary/80 transition-all text-sm"
          >
            <Code size={16} />
            Select Projects ({selectedProjects.length})
          </button>
          {resumeData && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-warning text-warning-foreground rounded-lg font-medium border border-warning hover:bg-warning/90 transition-all text-sm"
            >
              <Edit3 size={16} />
              Edit Resume
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleUpdate}
                className="flex items-center gap-1.5 px-4 py-2 bg-success text-success-foreground rounded-lg font-medium border border-success hover:bg-success/90 transition-all text-sm"
              >
                <Save size={16} />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchExistingResume(); // Reset to original data
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium border border-destructive hover:bg-destructive/90 transition-all text-sm"
              >
                <X size={16} />
                Cancel
              </button>
            </>
          )}
          <button
            onClick={generateResume}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
            {resumeData ? 'Regenerate' : 'Generate Resume'}
          </button>
          {resumeData && (
            <button
              onClick={downloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-foreground rounded-lg font-medium border border-border hover:bg-secondary/80 transition-all text-sm"
            >
              <Download size={16} />
              Download PDF
            </button>
          )}
        </div>
      </div>

      {!resumeData && !loading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="text-primary" size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Resume Generated Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Click the button above to let our AI analyze your profile, achievements, and documents to create a professional resume for you.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            {[
              { title: "Analyzes Documents", desc: "Extracts info from your uploaded PDFs and Docs" },
              { title: "Includes Achievements", desc: "Highlights your verified awards and certs" },
              { title: "Smart Formatting", desc: "Organizes everything into a professional layout" }
            ].map((item, i) => (
              <div key={i} className="bg-secondary/50 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-1 text-primary">
                  <Check size={16} className="font-bold" />
                  <span className="font-bold text-sm">{item.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-bounce" size={32} />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold">AI is Crafting Your Resume</h3>
            <p className="text-muted-foreground animate-pulse mt-2">Reading documents and formatting details...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
              <h3 className="font-bold mb-4 flex items-center justify-between">
                Resume Sections
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {isEditing ? <><Save size={12}/> Done</> : <><Edit3 size={12}/> Edit Details</>}
                </button>
              </h3>
              <div className="space-y-4">
                {['Personal Info', 'Summary', 'Education', 'Experience', 'Skills', 'Achievements', 'Projects'].map((section) => (
                  <div key={section} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
                    <span className="text-sm font-medium">{section}</span>
                    <div className="w-5 h-5 bg-success/20 text-success rounded-full flex items-center justify-center">
                      <Check size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-primary mb-3">
                <AlertCircle size={18} />
                <h4 className="font-bold text-sm">AI Tip</h4>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                You can regenerate your resume anytime you upload new achievements or documents. The AI will automatically incorporate the latest information.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white text-slate-800 rounded-lg shadow-2xl overflow-hidden border border-slate-200" style={{ minHeight: '1000px' }}>
              <div ref={resumeRef} className="p-12 font-serif text-[14px] leading-relaxed">
                {/* Modern Resume Template */}
                <header className="border-b-2 border-slate-900 pb-8 mb-8">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={resumeData.personalInfo.name}
                        onChange={(e) => handleFieldChange('personalInfo', 'name', e.target.value)}
                        className="text-4xl font-sans font-black tracking-tighter uppercase mb-4 w-full border-b-2 border-slate-300 focus:border-primary outline-none bg-transparent"
                        placeholder="Your Name"
                      />
                      <div className="flex flex-wrap gap-y-2 gap-x-4">
                        <input
                          type="email"
                          value={resumeData.personalInfo.email}
                          onChange={(e) => handleFieldChange('personalInfo', 'email', e.target.value)}
                          className="text-slate-600 font-sans font-medium text-xs border-b border-slate-300 focus:border-primary outline-none bg-transparent px-1"
                          placeholder="email@example.com"
                        />
                        <input
                          type="tel"
                          value={resumeData.personalInfo.phone}
                          onChange={(e) => handleFieldChange('personalInfo', 'phone', e.target.value)}
                          className="text-slate-600 font-sans font-medium text-xs border-b border-slate-300 focus:border-primary outline-none bg-transparent px-1"
                          placeholder="Phone Number"
                        />
                        <input
                          type="text"
                          value={resumeData.personalInfo.address}
                          onChange={(e) => handleFieldChange('personalInfo', 'address', e.target.value)}
                          className="text-slate-600 font-sans font-medium text-xs border-b border-slate-300 focus:border-primary outline-none bg-transparent px-1"
                          placeholder="Address"
                        />
                        <input
                          type="text"
                          value={resumeData.personalInfo.linkedin}
                          onChange={(e) => handleFieldChange('personalInfo', 'linkedin', e.target.value)}
                          className="text-slate-600 font-sans font-medium text-xs border-b border-slate-300 focus:border-primary outline-none bg-transparent px-1"
                          placeholder="LinkedIn URL"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-4xl font-sans font-black tracking-tighter uppercase mb-4">{resumeData.personalInfo.name}</h1>
                      <div className="flex flex-wrap gap-y-1 gap-x-6 text-slate-600 font-sans font-medium text-xs whitespace-nowrap">
                        <span>{resumeData.personalInfo.email}</span>
                        <span>{resumeData.personalInfo.phone}</span>
                        <span>{resumeData.personalInfo.address}</span>
                        {resumeData.personalInfo.linkedin && <span>LinkedIn: {resumeData.personalInfo.linkedin}</span>}
                      </div>
                    </>
                  )}
                </header>

                <section className="mb-8">
                  <h2 className="text-lg font-sans font-bold uppercase tracking-widest border-l-4 border-slate-900 pl-4 mb-4">Summary</h2>
                  {isEditing ? (
                    <textarea
                      value={resumeData.summary}
                      onChange={(e) => handleFieldChange('summary', '', e.target.value)}
                      className="text-slate-700 italic w-full border-b border-slate-300 focus:border-primary outline-none bg-transparent resize-none"
                      rows={3}
                      placeholder="Write a brief summary about yourself..."
                    />
                  ) : (
                    <p className="text-slate-700 italic">{resumeData.summary}</p>
                  )}
                </section>

                <section className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-sans font-bold uppercase tracking-widest border-l-4 border-slate-900 pl-4">Education</h2>
                    {isEditing && (
                      <button
                        onClick={() => addNewItem('education')}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors"
                      >
                        + Add Education
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {resumeData.education.map((edu, i) => (
                      <div key={i} className="relative">
                        {isEditing && (
                          <button
                            onClick={() => removeItem('education', i)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full text-xs hover:bg-destructive/90 transition-colors"
                          >
                            ×
                          </button>
                        )}
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex justify-between gap-4">
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => handleFieldChange('education', `${i}.institution`, e.target.value)}
                                className="font-bold text-slate-900 border-b border-slate-300 focus:border-primary outline-none bg-transparent flex-1"
                                placeholder="Institution Name"
                              />
                              <input
                                type="text"
                                value={`${edu.startDate} – ${edu.endDate}`}
                                onChange={(e) => {
                                  const dates = e.target.value.split(' – ');
                                  handleFieldChange('education', `${i}.startDate`, dates[0] || '');
                                  handleFieldChange('education', `${i}.endDate`, dates[1] || '');
                                }}
                                className="font-bold text-slate-900 border-b border-slate-300 focus:border-primary outline-none bg-transparent w-32"
                                placeholder="Start – End"
                              />
                            </div>
                            <input
                              type="text"
                              value={`${edu.degree} in ${edu.fieldOfStudy}`}
                              onChange={(e) => {
                                const parts = e.target.value.split(' in ');
                                handleFieldChange('education', `${i}.degree`, parts[0] || '');
                                handleFieldChange('education', `${i}.fieldOfStudy`, parts[1] || '');
                              }}
                              className="italic text-slate-700 font-medium border-b border-slate-300 focus:border-primary outline-none bg-transparent w-full"
                              placeholder="Degree in Field of Study"
                            />
                            <textarea
                              value={edu.description}
                              onChange={(e) => handleFieldChange('education', `${i}.description`, e.target.value)}
                              className="text-slate-600 mt-1 w-full border-b border-slate-300 focus:border-primary outline-none bg-transparent resize-none"
                              rows={2}
                              placeholder="Description"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>{edu.institution}</span>
                              <span>{edu.startDate} – {edu.endDate}</span>
                            </div>
                            <div className="italic text-slate-700 font-medium">{edu.degree} in {edu.fieldOfStudy}</div>
                            <p className="text-slate-600 mt-1">{edu.description}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-sans font-bold uppercase tracking-widest border-l-4 border-slate-900 pl-4">Experience</h2>
                    {isEditing && (
                      <button
                        onClick={() => addNewItem('experience')}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors"
                      >
                        + Add Experience
                      </button>
                    )}
                  </div>
                  <div className="space-y-6">
                    {resumeData.experience.length > 0 ? resumeData.experience.map((exp, i) => (
                      <div key={i} className="relative">
                        {isEditing && (
                          <button
                            onClick={() => removeItem('experience', i)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full text-xs hover:bg-destructive/90 transition-colors"
                          >
                            ×
                          </button>
                        )}
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex justify-between gap-4">
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => handleFieldChange('experience', `${i}.company`, e.target.value)}
                                className="font-bold text-slate-900 border-b border-slate-300 focus:border-primary outline-none bg-transparent flex-1"
                                placeholder="Company Name"
                              />
                              <input
                                type="text"
                                value={`${exp.startDate} – ${exp.endDate}`}
                                onChange={(e) => {
                                  const dates = e.target.value.split(' – ');
                                  handleFieldChange('experience', `${i}.startDate`, dates[0] || '');
                                  handleFieldChange('experience', `${i}.endDate`, dates[1] || '');
                                }}
                                className="font-bold text-slate-900 border-b border-slate-300 focus:border-primary outline-none bg-transparent w-32"
                                placeholder="Start – End"
                              />
                            </div>
                            <input
                              type="text"
                              value={exp.position}
                              onChange={(e) => handleFieldChange('experience', `${i}.position`, e.target.value)}
                              className="italic text-slate-700 font-medium border-b border-slate-300 focus:border-primary outline-none bg-transparent w-full"
                              placeholder="Position/Role"
                            />
                            <textarea
                              value={exp.description}
                              onChange={(e) => handleFieldChange('experience', `${i}.description`, e.target.value)}
                              className="text-slate-600 mt-1 w-full border-b border-slate-300 focus:border-primary outline-none bg-transparent resize-none"
                              rows={2}
                              placeholder="Job Description"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between font-bold text-slate-900">
                              <span>{exp.company}</span>
                              <span>{exp.startDate} – {exp.endDate}</span>
                            </div>
                            <div className="italic text-slate-700 font-medium">{exp.position}</div>
                            <p className="text-slate-600 mt-1">{exp.description}</p>
                          </>
                        )}
                      </div>
                    )) : (
                      !isEditing && <p className="text-slate-500 italic">No experience added yet.</p>
                    )}
                    {isEditing && resumeData.experience.length === 0 && (
                      <p className="text-slate-500 italic">Click "Add Experience" to add your work experience.</p>
                    )}
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-8">
                   <section>
                    <h2 className="text-lg font-sans font-bold uppercase tracking-widest border-l-4 border-slate-900 pl-4 mb-4">Skills</h2>
                    {isEditing ? (
                      <textarea
                        value={resumeData.skills.join(', ')}
                        onChange={(e) => handleFieldChange('skills', 'array', e.target.value)}
                        className="text-slate-700 w-full border-b border-slate-300 focus:border-primary outline-none bg-transparent resize-none"
                        rows={3}
                        placeholder="Enter skills separated by commas (e.g., JavaScript, Python, React)"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, i) => (
                          <span key={i} className="text-slate-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-sans font-bold uppercase tracking-widest border-l-4 border-slate-900 pl-4">Achievements</h2>
                      {isEditing && (
                        <button
                          onClick={() => addNewItem('achievements')}
                          className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors"
                        >
                          + Add Achievement
                        </button>
                      )}
                    </div>
                    {resumeData.achievements.length > 0 ? (
                      <ul className="space-y-2 list-disc list-inside text-slate-700">
                        {resumeData.achievements.map((ach, i) => (
                          <li key={i} className="pl-1 relative">
                            {isEditing && (
                              <button
                                onClick={() => removeItem('achievements', i)}
                                className="absolute -top-1 -left-4 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs hover:bg-destructive/90 transition-colors"
                              >
                                ×
                              </button>
                            )}
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={ach.title}
                                  onChange={(e) => handleFieldChange('achievements', `${i}.title`, e.target.value)}
                                  className="font-bold border-b border-slate-300 focus:border-primary outline-none bg-transparent"
                                  placeholder="Achievement Title"
                                />
                                <input
                                  type="text"
                                  value={ach.date}
                                  onChange={(e) => handleFieldChange('achievements', `${i}.date`, e.target.value)}
                                  className="text-sm border-b border-slate-300 focus:border-primary outline-none bg-transparent"
                                  placeholder="Date"
                                />
                                <input
                                  type="text"
                                  value={ach.description}
                                  onChange={(e) => handleFieldChange('achievements', `${i}.description`, e.target.value)}
                                  className="text-sm border-b border-slate-300 focus:border-primary outline-none bg-transparent w-full"
                                  placeholder="Description"
                                />
                              </div>
                            ) : (
                              <>
                                <span className="font-bold">{ach.title}</span> ({ach.date})
                                {ach.description && <p className="text-sm mt-1">{ach.description}</p>}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      !isEditing && <p className="text-slate-500 italic">No achievements added yet.</p>
                    )}
                    {isEditing && resumeData.achievements.length === 0 && (
                      <p className="text-slate-500 italic">Click "Add Achievement" to add your achievements.</p>
                    )}
                  </section>
                </div>

                {resumeData.projects && resumeData.projects.length > 0 && (
                  <section className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-sans font-bold uppercase tracking-widest border-l-4 border-slate-900 pl-4">Projects</h2>
                      {isEditing && (
                        <button
                          onClick={() => addNewItem('projects')}
                          className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors"
                        >
                          + Add Project
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {resumeData.projects.map((proj, i) => (
                        <div key={i} className="relative">
                          {isEditing && (
                            <button
                              onClick={() => removeItem('projects', i)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full text-xs hover:bg-destructive/90 transition-colors"
                            >
                              ×
                            </button>
                          )}
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={proj.title}
                                onChange={(e) => handleFieldChange('projects', `${i}.title`, e.target.value)}
                                className="font-bold text-slate-900 border-b border-slate-300 focus:border-primary outline-none bg-transparent w-full"
                                placeholder="Project Title"
                              />
                              <textarea
                                value={proj.description}
                                onChange={(e) => handleFieldChange('projects', `${i}.description`, e.target.value)}
                                className="text-slate-600 mt-1 w-full border-b border-slate-300 focus:border-primary outline-none bg-transparent resize-none"
                                rows={2}
                                placeholder="Project Description"
                              />
                              <input
                                type="text"
                                value={proj.technologies.join(', ')}
                                onChange={(e) => {
                                  const techs = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                                  handleFieldChange('projects', `${i}.technologies`, techs);
                                }}
                                className="text-xs text-slate-500 mt-1 w-full border-b border-slate-300 focus:border-primary outline-none bg-transparent"
                                placeholder="Technologies (comma separated)"
                              />
                              <input
                                type="text"
                                value={proj.link}
                                onChange={(e) => handleFieldChange('projects', `${i}.link`, e.target.value)}
                                className="text-xs text-slate-500 mt-1 w-full border-b border-slate-300 focus:border-primary outline-none bg-transparent"
                                placeholder="Project Link (optional)"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="font-bold text-slate-900">{proj.title}</div>
                              <p className="text-slate-600 mt-1">{proj.description}</p>
                              <div className="text-xs text-slate-500 mt-1">Technologies: {proj.technologies.join(', ')}</div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Selection Modal */}
      <AnimatePresence>
        {showProjectSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowProjectSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Code className="text-primary" />
                  Select Projects for Resume
                </h2>
                <button
                  onClick={() => setShowProjectSelector(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <AlertCircle size={24} />
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Code className="text-primary" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Projects Available</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't uploaded any projects yet. Add projects to showcase them in your resume.
                  </p>
                  <button
                    onClick={() => {
                      setShowProjectSelector(false);
                      // Navigate to project upload page
                      window.location.href = '/projects';
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all"
                  >
                    Add Projects
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Select the projects you want to include in your resume. These will be highlighted in the Projects section.
                    </p>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {projects.map((project) => (
                      <motion.div
                        key={project._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedProjects.includes(project._id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleProjectSelection(project._id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            selectedProjects.includes(project._id)
                              ? 'border-primary bg-primary'
                              : 'border-border'
                          }`}>
                            {selectedProjects.includes(project._id) && (
                              <Check size={12} className="text-primary-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{project.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {project.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {project.technologies.slice(0, 4).map((tech, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-secondary text-xs rounded-md"
                                >
                                  {tech}
                                </span>
                              ))}
                              {project.technologies.length > 4 && (
                                <span className="px-2 py-1 bg-secondary text-xs rounded-md">
                                  +{project.technologies.length - 4}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{project.category}</span>
                              <span>•</span>
                              <span>
                                {new Date(project.startDate).toLocaleDateString()} - 
                                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Present'}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              {project.projectUrl && (
                                <a
                                  href={project.projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-primary hover:bg-primary/10 rounded transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={14} />
                                </a>
                              )}
                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-primary hover:bg-primary/10 rounded transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Github size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
                    <div className="text-sm text-muted-foreground">
                      {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowProjectSelector(false)}
                        className="px-4 py-2 bg-secondary text-foreground rounded-lg font-medium border border-border hover:bg-secondary/80 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveProjectSelections}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all"
                      >
                        Save Selection
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
