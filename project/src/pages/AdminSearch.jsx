import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, User, FileText, Trophy, CheckCircle, Clock, Eye } from 'lucide-react';
import axios from 'axios';

export default function AdminSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchAllStudents();
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      const timeoutId = setTimeout(() => {
        searchStudents();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults(allStudents);
    }
  }, [query, allStudents]);

  const fetchAllStudents = async () => {
    setInitialLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const studentsWithCounts = await Promise.all(
        response.data.map(async (student) => {
          const [docCount, achCount] = await Promise.all([
            axios.get(`http://localhost:5000/api/documents/student/${student._id}/count`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => ({ data: 0 })),
            axios.get(`http://localhost:5000/api/achievements/student/${student._id}/count`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => ({ data: 0 }))
          ]);

          return {
            id: student._id,
            name: student.name,
            email: student.email,
            regNo: student.studentDetails?.regNo || 'N/A',
            branch: student.studentDetails?.branch || 'N/A',
            year: student.studentDetails?.year || 'N/A',
            section: student.studentDetails?.section || 'N/A',
            documentCount: docCount.data || 0,
            achievementCount: achCount.data || 0
          };
        })
      );
      
      setAllStudents(studentsWithCounts);
      setSearchResults(studentsWithCounts);
    } catch (error) {
      console.error('Error fetching all students:', error);
      setAllStudents([]);
      setSearchResults([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const searchStudents = async () => {
    if (!query.trim()) {
      setSearchResults(allStudents);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (studentId) => {
    navigate(`/admin/student/${studentId}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-bold text-foreground">Search Students</h2>

      {/* Search Input */}
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Registration Number or Name..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Student List */}
      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden max-w-4xl">
        {initialLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground font-medium">Loading students...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="mx-auto text-muted-foreground mb-3" size={32} />
            <p className="text-foreground font-medium">
              {query.length > 0 ? 'No students found' : 'No students in database'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {query.length > 0 ? 'Try a different registration number or name' : 'Register some students to see them here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reg No</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Year</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Achievements</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {searchResults.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{student.regNo}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{student.branch}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{student.year}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{student.documentCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{student.achievementCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewStudent(student.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
