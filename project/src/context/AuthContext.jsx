import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const mockStudents = [
  {
    id: '1',
    name: 'Praveen Sai',
    regNo: '21A91A0501',
    branch: 'CSE',
    section: 'A',
    year: '3rd',
    semester: '6th',
    academicYear: '2024-25',
    admissionCategory: 'EAMCET',
    dob: '2003-05-15',
    gender: 'Male',
    phone: '9876543210',
    email: 'praveen@university.edu',
    address: 'Hyderabad, Telangana',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200&h=200',
    profileCompletion: 92,
  },
  {
    id: '2',
    name: 'Ananya Sharma',
    regNo: '21A91A0502',
    branch: 'CSE',
    section: 'B',
    year: '3rd',
    semester: '6th',
    academicYear: '2024-25',
    admissionCategory: 'JEE',
    dob: '2003-08-22',
    gender: 'Female',
    phone: '9876543211',
    email: 'ananya@university.edu',
    address: 'Visakhapatnam, Andhra Pradesh',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    profileCompletion: 85,
  },
  {
    id: '3',
    name: 'Rahul Kumar',
    regNo: '21A91A0503',
    branch: 'ECE',
    section: 'A',
    year: '3rd',
    semester: '6th',
    academicYear: '2024-25',
    admissionCategory: 'EAMCET',
    dob: '2003-02-10',
    gender: 'Male',
    phone: '9876543212',
    email: 'rahul@university.edu',
    address: 'Vijayawada, Andhra Pradesh',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    profileCompletion: 78,
  },
];

const mockDocuments = [
  { id: '1', studentId: '1', type: 'Aadhaar', status: 'Verified', uploadedDate: '2024-01-15', fileName: 'aadhaar-praveen.pdf', originalName: 'Aadhaar Card.pdf', fileUrl: '/uploads/documents/aadhaar-praveen.pdf' },
  { id: '2', studentId: '1', type: 'PAN Card', status: 'Pending', uploadedDate: '2024-02-10', fileName: 'pan-praveen.pdf', originalName: 'PAN Card.pdf', fileUrl: '/uploads/documents/pan-praveen.pdf' },
  { id: '3', studentId: '1', type: 'Mark Memo (Sem 1-4)', status: 'Verified', uploadedDate: '2024-01-20', fileName: 'marks-praveen.pdf', originalName: 'Semester Marks.pdf', fileUrl: '/uploads/documents/marks-praveen.pdf' },
  { id: '4', studentId: '1', type: 'APAAR / ABC ID', status: 'Rejected', uploadedDate: '2024-03-01', fileName: 'apaar-praveen.pdf', originalName: 'APAAR ID.pdf', fileUrl: '/uploads/documents/apaar-praveen.pdf', rejectionReason: 'Document quality is poor, please upload a clear copy' },
  { id: '5', studentId: '1', type: 'Transfer Certificate', status: 'Verified', uploadedDate: '2024-01-10', fileName: 'tc-praveen.pdf', originalName: 'Transfer Certificate.pdf', fileUrl: '/uploads/documents/tc-praveen.pdf' },
  { id: '6', studentId: '2', type: 'Aadhaar', status: 'Verified', uploadedDate: '2024-01-12', fileName: 'aadhaar-ananya.pdf', originalName: 'Aadhaar Card.pdf', fileUrl: '/uploads/documents/aadhaar-ananya.pdf' },
  { id: '7', studentId: '2', type: 'PAN Card', status: 'Verified', uploadedDate: '2024-01-18', fileName: 'pan-ananya.pdf', originalName: 'PAN Card.pdf', fileUrl: '/uploads/documents/pan-ananya.pdf' },
  { id: '8', studentId: '2', type: 'Mark Memo (Sem 1-4)', status: 'Pending', uploadedDate: '2024-02-20', fileName: 'marks-ananya.pdf', originalName: 'Semester Marks.pdf', fileUrl: '/uploads/documents/marks-ananya.pdf' },
  { id: '9', studentId: '3', type: 'Aadhaar', status: 'Pending', uploadedDate: '2024-03-05', fileName: 'aadhaar-rahul.pdf', originalName: 'Aadhaar Card.pdf', fileUrl: '/uploads/documents/aadhaar-rahul.pdf' },
  { id: '10', studentId: '3', type: 'PAN Card', status: 'Pending', uploadedDate: '2024-03-06', fileName: 'pan-rahul.pdf', originalName: 'PAN Card.pdf', fileUrl: '/uploads/documents/pan-rahul.pdf' },
];

const mockAchievements = [
  { id: '1', studentId: '1', title: 'Smart India Hackathon', type: 'Hackathon', academicYear: '2024-25', semester: '5th', description: 'Won first prize in SIH 2024', date: '2024-03-15', status: 'Verified' },
  { id: '2', studentId: '1', title: 'AI Intern at MetaLab', type: 'Internship', academicYear: '2024-25', semester: '5th', description: '3-month internship on ML models', date: '2024-01-10', status: 'Pending' },
  { id: '3', studentId: '1', title: 'Research Paper: Neural Networks', type: 'Research Paper', academicYear: '2023-24', semester: '4th', description: 'Published in IEEE conference', date: '2023-12-20', status: 'Verified' },
  { id: '4', studentId: '1', title: 'AWS Cloud Workshop', type: 'Workshop', academicYear: '2023-24', semester: '4th', description: 'Completed AWS certified workshop', date: '2023-11-05', status: 'Verified' },
  { id: '5', studentId: '1', title: 'Code-a-thon 2023', type: 'Technical Competition', academicYear: '2023-24', semester: '3rd', description: 'Runner-up in coding competition', date: '2023-09-15', status: 'Verified' },
  { id: '6', studentId: '1', title: 'Cultural Fest Dance', type: 'Cultural', academicYear: '2023-24', semester: '3rd', description: 'First place in dance competition', date: '2023-08-20', status: 'Verified' },
  { id: '7', studentId: '2', title: 'Google Summer of Code', type: 'Internship', academicYear: '2024-25', semester: '5th', description: 'Selected for GSoC 2024', date: '2024-05-01', status: 'Verified' },
  { id: '8', studentId: '2', title: 'Web Dev Workshop', type: 'Workshop', academicYear: '2023-24', semester: '4th', description: 'React & Node.js workshop', date: '2023-10-15', status: 'Verified' },
  { id: '9', studentId: '3', title: 'Robotics Competition', type: 'Technical Competition', academicYear: '2024-25', semester: '5th', description: 'Built autonomous robot', date: '2024-02-20', status: 'Pending' },
  { id: '10', studentId: '1', title: 'Basketball Tournament', type: 'Sports', academicYear: '2024-25', semester: '6th', description: 'Inter-college basketball championship', date: '2024-04-10', status: 'Verified' },
  { id: '11', studentId: '1', title: 'ML Workshop at IIT', type: 'Workshop', academicYear: '2024-25', semester: '6th', description: 'Advanced ML techniques workshop', date: '2024-05-20', status: 'Pending' },
  { id: '12', studentId: '1', title: 'HackFest 2024', type: 'Hackathon', academicYear: '2024-25', semester: '6th', description: '24-hour hackathon winner', date: '2024-06-01', status: 'Verified' },
  { id: '13', studentId: '2', title: 'Data Science Bootcamp', type: 'Workshop', academicYear: '2024-25', semester: '6th', description: '2-week intensive bootcamp', date: '2024-04-15', status: 'Pending' },
  { id: '14', studentId: '3', title: 'Circuit Design Contest', type: 'Technical Competition', academicYear: '2023-24', semester: '4th', description: 'Best circuit design award', date: '2023-11-25', status: 'Verified' },
  { id: '15', studentId: '1', title: 'Open Source Contribution', type: 'Hackathon', academicYear: '2023-24', semester: '4th', description: 'Major contribution to React library', date: '2023-12-01', status: 'Verified' },
  { id: '16', studentId: '1', title: 'Tech Talk at DevCon', type: 'Workshop', academicYear: '2024-25', semester: '5th', description: 'Speaker at developer conference', date: '2024-02-15', status: 'Verified' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [students] = useState(mockStudents);
  const [documents, setDocuments] = useState(mockDocuments);
  const [achievements, setAchievements] = useState(mockAchievements);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      axios.get('http://localhost:5000/api/auth/verify')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Compare the chosen role with the role stored in database
      if (user.role !== role) {
        return { success: false, message: 'Invalid role selected for this account' };
      }
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post('http://localhost:5000/api/auth/register', userData);
      
      // Do not auto-login the user upon registration so they can be redirected to the login page
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/auth/profile', profileData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const getStudentDocs = (studentId) => documents.filter(d => d.studentId === studentId);
  const getStudentAchievements = (studentId) => achievements.filter(a => a.studentId === studentId);

  const addAchievement = (achievement) => {
    const newAch = { ...achievement, id: String(achievements.length + 1), status: 'Pending', date: new Date().toISOString().split('T')[0] };
    setAchievements(prev => [newAch, ...prev]);
  };

  const verifyDocument = (docId, newStatus) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus } : d));
  };

  const uploadDocument = (documentData) => {
    const newDoc = {
      ...documentData,
      id: String(documents.length + 1),
      status: 'Pending',
      uploadedDate: new Date().toISOString().split('T')[0]
    };
    setDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  };

  const verifyAchievement = (achId, newStatus) => {
    setAchievements(prev => prev.map(a => a.id === achId ? { ...a, status: newStatus } : a));
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, login, logout, register, updateProfile, loading, students, documents, achievements,
      getStudentDocs, getStudentAchievements, addAchievement, verifyDocument, verifyAchievement,
      setDocuments, uploadDocument
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
