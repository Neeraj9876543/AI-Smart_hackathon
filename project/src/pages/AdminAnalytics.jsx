import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Download, FileText, BarChart3 } from 'lucide-react';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    achievementTypes: {},
    yearWiseAchievements: {},
    deptWiseAchievements: {},
    studentsWithAchievements: [],
    totalAchievements: 0,
    totalStudents: 0,
    studentsWithAchievementsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = {
    labels: Object.keys(analyticsData.achievementTypes),
    datasets: [{ 
      data: Object.values(analyticsData.achievementTypes), 
      backgroundColor: ['#2563EB', '#06B6D4', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#EC4899'], 
      borderWidth: 0 
    }]
  };

  const barYearData = {
    labels: Object.keys(analyticsData.yearWiseAchievements).sort(),
    datasets: [{ 
      label: 'Achievements', 
      data: Object.keys(analyticsData.yearWiseAchievements).sort().map(year => analyticsData.yearWiseAchievements[year]), 
      backgroundColor: '#2563EB', 
      borderRadius: 8, 
      barThickness: 40 
    }]
  };

  const barDeptData = {
    labels: Object.keys(analyticsData.deptWiseAchievements),
    datasets: [{ 
      label: 'Achievements', 
      data: Object.values(analyticsData.deptWiseAchievements), 
      backgroundColor: '#06B6D4', 
      borderRadius: 8, 
      barThickness: 40 
    }]
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-display font-bold text-foreground">Reports & Analytics</h2>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            <Download size={16} /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 gradient-brand text-primary-foreground rounded-lg text-sm font-medium">
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-soft">
          <h3 className="font-bold text-foreground mb-6">Achievement Types Distribution</h3>
          <div className="max-w-[300px] mx-auto">
            <Pie data={pieData} options={{ plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } } } }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-soft">
          <h3 className="font-bold text-foreground mb-6">Year-wise Achievements</h3>
          <Bar data={barYearData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-soft">
          <h3 className="font-bold text-foreground mb-6">Department-wise Achievements</h3>
          <Bar data={barDeptData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }} />
        </motion.div>

        {/* Students with achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-foreground">Students with Achievements</h3>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">Loading analytics data...</div>
            ) : analyticsData.studentsWithAchievements.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">No students with achievements found</div>
            ) : (
              analyticsData.studentsWithAchievements.map(student => (
                <div key={student.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.regNo} • {student.branch}</p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">{student.achievementCount} achievements</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
