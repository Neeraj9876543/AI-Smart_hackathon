import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Users, Trophy, FileCheck, Clock, TrendingUp } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAchievements: 0,
    verifiedDocuments: 0,
    pendingDocuments: 0,
    achievementsByCategory: {},
    achievementsByDepartment: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/stats-simple', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { icon: Users, label: 'Total Students', value: stats.totalStudents, color: 'bg-primary/10 text-primary' },
    { icon: Trophy, label: 'Total Achievements', value: stats.totalAchievements, color: 'bg-warning/10 text-warning' },
    { icon: FileCheck, label: 'Verified Documents', value: stats.verifiedDocuments, color: 'bg-success/10 text-success' },
    { icon: Clock, label: 'Pending Documents', value: stats.pendingDocuments, color: 'bg-destructive/10 text-destructive' },
  ];

  const doughnutData = {
    labels: Object.keys(stats.achievementsByCategory),
    datasets: [{ 
      data: Object.values(stats.achievementsByCategory), 
      backgroundColor: ['#2563EB', '#06B6D4', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#EC4899'], 
      borderWidth: 0 
    }]
  };

  const barData = {
    labels: Object.keys(stats.achievementsByDepartment),
    datasets: [{ 
      label: 'Achievements', 
      data: Object.values(stats.achievementsByDepartment), 
      backgroundColor: '#2563EB', 
      borderRadius: 8, 
      barThickness: 40 
    }]
  };

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
        {statsCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card p-6 rounded-2xl border border-border shadow-soft"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value.toLocaleString()}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-soft">
          <h3 className="font-bold text-foreground mb-6">Achievements by Category</h3>
          {Object.keys(stats.achievementsByCategory).length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No achievement data available
            </div>
          ) : (
            <div className="max-w-[280px] mx-auto">
              <Doughnut data={doughnutData} options={{ 
                plugins: { 
                  legend: { 
                    position: 'bottom', 
                    labels: { 
                      padding: 16, 
                      usePointStyle: true,
                      pointStyleWidth: 8
                    } 
                  } 
                }, 
                cutout: '65%' 
              }} />
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-soft">
          <h3 className="font-bold text-foreground mb-6">Achievements by Department</h3>
          {Object.keys(stats.achievementsByDepartment).length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No department data available
            </div>
          ) : (
            <Bar data={barData} options={{ 
              plugins: { legend: { display: false } }, 
              scales: { 
                y: { 
                  beginAtZero: true, 
                  grid: { color: 'rgba(0,0,0,0.04)' } 
                }, 
                x: { 
                  grid: { display: false } 
                } 
              } 
            }} />
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-foreground">Recent Student Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reg No</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Achievement</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {stats.recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground text-sm">
                    No recent activity found
                  </td>
                </tr>
              ) : (
                stats.recentActivity.map((activity, i) => (
                  <tr key={i} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{activity.studentName}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{activity.studentRegNo}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{activity.studentBranch}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{activity.achievementTitle}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{activity.achievementType}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        activity.status === 'Verified' ? 'bg-success/10 text-success' : 
                        activity.status === 'Rejected' ? 'bg-destructive/10 text-destructive' : 
                        'bg-warning/10 text-warning'
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
