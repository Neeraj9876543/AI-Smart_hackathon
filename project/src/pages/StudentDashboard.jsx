import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, FileCheck, Calendar, Percent, ArrowUpRight } from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-card p-6 rounded-2xl border border-border shadow-soft"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
      <Icon size={20} />
    </div>
    <p className="text-muted-foreground text-sm font-medium">{label}</p>
    <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
    <p className="text-xs text-muted-foreground mt-2">{subtext}</p>
  </motion.div>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch achievements and documents in parallel
      const [achievementsRes, documentsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/achievements/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/documents/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      setAchievements(achievementsRes.data || []);
      setDocuments(documentsRes.data || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
      // Set empty arrays on error to prevent undefined issues
      setAchievements([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate profile completion based on filled fields
  const calculateProfileCompletion = () => {
    if (!user?.studentDetails) return 0;
    
    const fields = [
      'regNo', 'branch', 'section', 'year', 'semester', 'academicYear',
      'admissionCategory', 'dob', 'gender', 'phone', 'address', 'fathersName',
      'mothersName', 'bloodGroup', 'nationality', 'religion', 'category',
      'incomeRange', 'disability', 'emergencyContact', 'emergencyPhone',
      'tenthSchool', 'tenthPercentage', 'tenthYear', 'intermediateCollege',
      'intermediatePercentage', 'intermediateYear', 'jeeRank', 'eamcetRank'
    ];
    
    const filledFields = fields.filter(field => 
      user.studentDetails[field] && 
      user.studentDetails[field] !== '' && 
      user.studentDetails[field] !== null
    ).length;
    
    return Math.round((filledFields / fields.length) * 100);
  };

  const verifiedAchievements = (achievements || []).filter(a => a.status === 'Verified').length;
  const verifiedDocuments = (documents || []).filter(d => d.status === 'Verified').length;

  const typeCount = (achievements || []).reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  const doughnutData = {
    labels: Object.keys(typeCount),
    datasets: [{
      data: Object.values(typeCount),
      backgroundColor: ['#2563EB', '#06B6D4', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#EC4899'],
      borderWidth: 0,
    }]
  };

  const yearCount = (achievements || []).reduce((acc, a) => {
    acc[a.academicYear] = (acc[a.academicYear] || 0) + 1;
    return acc;
  }, {});

  const barData = {
    labels: Object.keys(yearCount),
    datasets: [{
      label: 'Achievements',
      data: Object.values(yearCount),
      backgroundColor: '#2563EB',
      borderRadius: 8,
      barThickness: 32,
    }]
  };

  const recentAchievements = (achievements || []).slice(0, 4);
  const profileCompletion = calculateProfileCompletion();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-soft">
              <div className="animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-xl mb-4"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Trophy} 
          label="Total Achievements" 
          value={(achievements || []).length} 
          subtext={`${verifiedAchievements} verified`} 
          colorClass="bg-warning/10 text-warning" 
          index={0} 
        />
        <StatCard 
          icon={FileCheck} 
          label="Documents Verified" 
          value={`${verifiedDocuments}/${(documents || []).length}`} 
          subtext={`${(documents || []).length - verifiedDocuments} pending review`} 
          colorClass="bg-success/10 text-success" 
          index={1} 
        />
        <StatCard 
          icon={Calendar} 
          label="Current Semester" 
          value={user?.studentDetails?.semester || '?'} 
          subtext={`Academic Year ${user?.studentDetails?.academicYear || '?'}`} 
          colorClass="bg-primary/10 text-primary" 
          index={2} 
        />
        <StatCard 
          icon={Percent} 
          label="Profile Completion" 
          value={`${profileCompletion}%`} 
          subtext={profileCompletion < 100 ? "Complete your profile for better visibility" : "Profile is complete!"} 
          colorClass="bg-accent/10 text-accent" 
          index={3} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-soft overflow-hidden"
        >
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-foreground">Recent Achievements</h3>
            <button 
              onClick={() => navigate('/achievements')}
              className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Achievement</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {!(recentAchievements || []).length ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground text-sm">
                      No achievements yet. Start uploading your achievements!
                    </td>
                  </tr>
                ) : (
                  (recentAchievements || []).map((item, i) => (
                    <tr key={item._id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-sm text-foreground">{item.title}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.type}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'Verified' ? 'bg-success/10 text-success' : 
                          item.status === 'Rejected' ? 'bg-destructive/10 text-destructive' : 
                          'bg-warning/10 text-warning'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Upload CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="gradient-dark rounded-3xl p-8 text-primary-foreground relative overflow-hidden shadow-xl"
        >
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Manage Your Uploads</h3>
            <p className="text-primary-foreground/70 text-sm mb-6">View, manage, or delete your documents and achievements.</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/achievement-upload')}
                className="bg-card text-foreground py-3 rounded-xl font-bold text-sm hover:bg-card/90 transition-colors"
              >
                Upload New
              </button>
              <button 
                onClick={() => navigate('/my-uploads')}
                className="bg-card/20 text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-card/30 transition-colors border border-primary-foreground/30"
              >
                Manage Uploads
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-soft"
        >
          <h3 className="font-bold text-foreground mb-6">Achievement Categories</h3>
          {Object.keys(typeCount).length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No achievement data available
            </div>
          ) : (
            <div className="max-w-[280px] mx-auto">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8 } } }, cutout: '65%' }} />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-soft"
        >
          <h3 className="font-bold text-foreground mb-6">Achievements by Year</h3>
          {Object.keys(yearCount).length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No achievement data available
            </div>
          ) : (
            <Bar data={barData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
