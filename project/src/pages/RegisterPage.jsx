import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, User, Users, BookOpen, Building } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Student specific state
  const [studentDetails, setStudentDetails] = useState({
    regNo: '',
    branch: '',
    section: '',
    year: '',
    semester: '',
    academicYear: '',
    admissionCategory: '',
    dob: '',
    gender: '',
    phone: '',
    address: ''
  });

  // Faculty specific state
  const [facultyDetails, setFacultyDetails] = useState({
    employeeId: '',
    department: '',
    designation: '',
    specialization: '',
    phone: '',
    officeLocation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const userData = {
      name,
      email,
      password,
      role,
      profileImage: ''
    };

    if (role === 'student') {
      userData.studentDetails = studentDetails;
    } else if (role === 'faculty') {
      userData.facultyDetails = facultyDetails;
    }
    
    const result = await register(userData);
    
    if (result.success) {
      navigate(role === 'admin' ? '/admin' : role === 'faculty' ? '/faculty' : '/dashboard');
    } else {
      setError(result.message || 'Registration failed');
    }
    setLoading(false);
  };

  const handleStudentChange = (field, value) => {
    setStudentDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleFacultyChange = (field, value) => {
    setFacultyDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-primary-foreground" style={{
              width: `${80 + i * 60}px`, height: `${80 + i * 60}px`,
              top: `${10 + i * 15}%`, left: `${5 + i * 12}%`, opacity: 0.1 + i * 0.03
            }} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-primary-foreground"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <GraduationCap size={28} />
            </div>
            <span className="font-display font-bold text-2xl">Student Success Hub</span>
          </div>
          <h2 className="text-4xl font-display font-black leading-tight mb-4">
            Join Our<br />Academic Community.
          </h2>
          <p className="text-primary-foreground/70 max-w-md leading-relaxed">
            Create your account and start tracking your academic journey today.
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
              <GraduationCap className="text-primary-foreground" size={20} />
            </div>
            <span className="font-display font-bold text-xl text-foreground">Student Success Hub</span>
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Create account</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign up to get started with your academic portfolio</p>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Toggle */}
            <div className="flex bg-secondary rounded-lg p-1">
              {['student', 'faculty'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-150 capitalize flex items-center justify-center gap-2 ${
                    role === r ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {r === 'student' ? <Users size={16} /> : <BookOpen size={16} />}
                  {r}
                </button>
              ))}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 6 characters)"
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role-specific fields */}
            {role === 'student' && (
              <div className="space-y-4 p-4 bg-card/50 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User size={18} />
                  Student Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Registration Number</label>
                    <input
                      type="text"
                      value={studentDetails.regNo}
                      onChange={(e) => handleStudentChange('regNo', e.target.value)}
                      placeholder="e.g., 21A91A0501"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Branch</label>
                    <select
                      value={studentDetails.branch}
                      onChange={(e) => handleStudentChange('branch', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    >
                      <option value="">Select Branch</option>
                      <option value="CSE">Computer Science</option>
                      <option value="ECE">Electronics & Communication</option>
                      <option value="EEE">Electrical & Electronics</option>
                      <option value="MECH">Mechanical</option>
                      <option value="CIVIL">Civil</option>
                      <option value="IT">Information Technology</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Section</label>
                    <input
                      type="text"
                      value={studentDetails.section}
                      onChange={(e) => handleStudentChange('section', e.target.value)}
                      placeholder="e.g., A, B, C"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Year</label>
                    <select
                      value={studentDetails.year}
                      onChange={(e) => handleStudentChange('year', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Semester</label>
                    <select
                      value={studentDetails.semester}
                      onChange={(e) => handleStudentChange('semester', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    >
                      <option value="">Select Semester</option>
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                      <option value="3rd">3rd Semester</option>
                      <option value="4th">4th Semester</option>
                      <option value="5th">5th Semester</option>
                      <option value="6th">6th Semester</option>
                      <option value="7th">7th Semester</option>
                      <option value="8th">8th Semester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Academic Year</label>
                    <input
                      type="text"
                      value={studentDetails.academicYear}
                      onChange={(e) => handleStudentChange('academicYear', e.target.value)}
                      placeholder="e.g., 2024-25"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Admission Category</label>
                    <select
                      value={studentDetails.admissionCategory}
                      onChange={(e) => handleStudentChange('admissionCategory', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="EAMCET">EAMCET</option>
                      <option value="JEE">JEE Main</option>
                      <option value="Management">Management</option>
                      <option value="NRI">NRI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={studentDetails.dob}
                      onChange={(e) => handleStudentChange('dob', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                    <select
                      value={studentDetails.gender}
                      onChange={(e) => handleStudentChange('gender', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={studentDetails.phone}
                      onChange={(e) => handleStudentChange('phone', e.target.value)}
                      placeholder="10-digit phone number"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
                    <textarea
                      value={studentDetails.address}
                      onChange={(e) => handleStudentChange('address', e.target.value)}
                      placeholder="Enter your full address"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      rows="2"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {role === 'faculty' && (
              <div className="space-y-4 p-4 bg-card/50 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <BookOpen size={18} />
                  Faculty Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Employee ID</label>
                    <input
                      type="text"
                      value={facultyDetails.employeeId}
                      onChange={(e) => handleFacultyChange('employeeId', e.target.value)}
                      placeholder="e.g., EMP001"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Department</label>
                    <select
                      value={facultyDetails.department}
                      onChange={(e) => handleFacultyChange('department', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="CSE">Computer Science</option>
                      <option value="ECE">Electronics & Communication</option>
                      <option value="EEE">Electrical & Electronics</option>
                      <option value="MECH">Mechanical</option>
                      <option value="CIVIL">Civil</option>
                      <option value="IT">Information Technology</option>
                      <option value="H&S">Humanities & Sciences</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Designation</label>
                    <select
                      value={facultyDetails.designation}
                      onChange={(e) => handleFacultyChange('designation', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    >
                      <option value="">Select Designation</option>
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Lab Instructor">Lab Instructor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Specialization</label>
                    <input
                      type="text"
                      value={facultyDetails.specialization}
                      onChange={(e) => handleFacultyChange('specialization', e.target.value)}
                      placeholder="e.g., Machine Learning, Database Systems"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={facultyDetails.phone}
                      onChange={(e) => handleFacultyChange('phone', e.target.value)}
                      placeholder="10-digit phone number"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Office Location</label>
                    <input
                      type="text"
                      value={facultyDetails.officeLocation}
                      onChange={(e) => handleFacultyChange('officeLocation', e.target.value)}
                      placeholder="e.g., Room 201, CSE Block"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-primary-foreground py-3.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
