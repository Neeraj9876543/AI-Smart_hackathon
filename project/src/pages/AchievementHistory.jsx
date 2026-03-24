import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Trophy, Filter, Calendar, Award, Eye } from 'lucide-react';
import axios from 'axios';

const typeIcons = {
  'Hackathon': '🏆', 'Internship': '💼', 'Research Paper': '📄',
  'Technical Competition': '⚡', 'Workshop': '🔧', 'Cultural': '🎭', 'Sports': '🏀', 'Other': '🏅'
};

export default function AchievementHistory() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('All');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/achievements/student`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Transform the data to match the expected format
      const transformedAchs = (response.data || []).map(ach => ({
        id: ach._id,
        title: ach.title,
        type: ach.type,
        description: ach.description,
        academicYear: ach.academicYear,
        semester: ach.semester,
        date: new Date(ach.date).toLocaleDateString(),
        hasAttachment: ach.hasAttachment,
        fileName: ach.fileName,
        originalName: ach.originalName,
        status: ach.status,
        uploadedDate: new Date(ach.uploadedDate).toLocaleDateString(),
        rejectionReason: ach.rejectionReason
      }));
      
      setAchievements(transformedAchs);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAchievement = (ach) => {
    if (ach.hasAttachment && ach.fileName) {
      const url = `http://localhost:5000/api/achievements/file/${ach.fileName}`;
      window.open(url, '_blank');
    }
  };

  const years = ['All', ...new Set(achievements.map(a => a.academicYear))];
  const types = ['All', ...new Set(achievements.map(a => a.type))];

  const filtered = achievements.filter(a => {
    if (filterYear !== 'All' && a.academicYear !== filterYear) return false;
    if (filterType !== 'All' && a.type !== filterType) return false;
    return true;
  });

  // Group by academic year
  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.academicYear]) acc[a.academicYear] = [];
    acc[a.academicYear].push(a);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-display font-bold text-foreground">Achievement History</h2>
        <div className="bg-card rounded-2xl border border-border shadow-soft p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground text-sm mt-4">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-display font-bold text-foreground">Achievement History</h2>
        <div className="flex gap-3">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-card rounded-2xl border border-border shadow-soft p-12 text-center">
          <Trophy className="mx-auto text-muted-foreground mb-4" size={40} />
          <h3 className="text-foreground font-bold mb-2">The trophy cabinet is empty.</h3>
          <p className="text-muted-foreground text-sm">Time to win something.</p>
        </div>
      ) : (
        Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([year, items]) => (
          <motion.div
            key={year}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar size={14} /> {year}
            </h3>
            <div className="space-y-3 mb-8">
              {items.map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl border border-border shadow-card p-5 flex items-center justify-between hover:shadow-soft transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{typeIcons[ach.type] || '🏅'}</span>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{ach.title}</h4>
                      <p className="text-xs text-muted-foreground">{ach.type} • {ach.semester} Sem • {ach.date}</p>
                      <p className="text-xs text-muted-foreground mt-1">{ach.description}</p>
                      {ach.status === 'Rejected' && ach.rejectionReason && (
                        <p className="text-xs text-destructive mt-1">Rejected: {ach.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ach.status === 'Verified' ? 'bg-success/10 text-success' : 
                      ach.status === 'Rejected' ? 'bg-destructive/10 text-destructive' : 
                      'bg-warning/10 text-warning'
                    }`}>
                      {ach.status}
                    </span>
                    {ach.hasAttachment && (
                      <button 
                        onClick={() => handleViewAchievement(ach)}
                        className="text-primary text-xs font-medium hover:underline flex items-center gap-1"
                      >
                        <Eye size={12} /> View
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
