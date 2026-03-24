import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, GraduationCap, Calendar, Edit3, Save, X } from 'lucide-react';

export default function StudentProfile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    
    const fields = [
      user.name,
      user.email,
      user.studentDetails?.phone,
      user.studentDetails?.address,
      user.studentDetails?.dob,
      user.studentDetails?.gender,
      user.studentDetails?.regNo,
      user.studentDetails?.branch,
      user.studentDetails?.section,
      user.studentDetails?.semester,
      user.studentDetails?.academicYear,
      user.studentDetails?.year,
      user.studentDetails?.admissionCategory
    ];
    
    const filledFields = fields.filter(field => 
      field !== undefined && field !== null && field !== ''
    ).length;
    
    return Math.round((filledFields / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  const initForm = () => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.studentDetails?.phone || '',
        address: user.studentDetails?.address || '',
        dob: user.studentDetails?.dob ? new Date(user.studentDetails.dob).toISOString().split('T')[0] : '',
        gender: user.studentDetails?.gender || '',
        regNo: user.studentDetails?.regNo || '',
        branch: user.studentDetails?.branch || '',
        section: user.studentDetails?.section || '',
        semester: user.studentDetails?.semester || '',
        academicYear: user.studentDetails?.academicYear || '',
        year: user.studentDetails?.year || '',
        admissionCategory: user.studentDetails?.admissionCategory || ''
      });
    }
  };

  React.useEffect(() => {
    initForm();
  }, [user]);

  const handleSave = async () => {
    await updateProfile({
      name: form.name,
      email: form.email,
      studentDetails: {
        phone: form.phone,
        address: form.address,
        dob: form.dob,
        gender: form.gender,
        regNo: form.regNo,
        branch: form.branch,
        section: form.section,
        semester: form.semester,
        academicYear: form.academicYear,
        year: form.year,
        admissionCategory: form.admissionCategory
      }
    });
    setEditing(false);
  };

  const handleCancel = () => {
    initForm();
    setEditing(false);
  };

  const renderSection = (title, children) => (
    <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
      <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );

  const renderField = (label, staticValue, field) => (
    <div>
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      {editing && field ? (
        <input
          value={form[field] || ''}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      ) : (
        <p className="text-sm font-medium text-foreground">{staticValue || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-foreground">Student Profile</h2>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary">
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 gradient-brand text-primary-foreground rounded-lg text-sm font-medium">
              <Save size={16} /> Save
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary">
            <Edit3 size={16} /> Edit Profile
          </button>
        )}
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-soft p-6 flex flex-col sm:flex-row items-center gap-6"
      >
        <div className="w-24 h-24 rounded-2xl gradient-brand flex items-center justify-center text-primary-foreground text-3xl font-bold overflow-hidden">
          {user?.photo ? (
            <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name?.charAt(0)
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
          <p className="text-muted-foreground text-sm">{user?.studentDetails?.regNo || 'N/A'} • {user?.studentDetails?.branch || 'N/A'} • {user?.studentDetails?.year || 'N/A'} Year</p>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Profile Completion</span>
              <span className="text-xs font-bold text-foreground">{profileCompletion}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full gradient-brand rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {renderSection("Personal Details", 
            <div className="grid grid-cols-2 gap-4">
              {renderField("Full Name", user?.name, "name")}
              {renderField("Date of Birth", user?.studentDetails?.dob ? new Date(user.studentDetails.dob).toLocaleDateString() : '', "dob")}
              {renderField("Gender", user?.studentDetails?.gender, "gender")}
              {renderField("Email", user?.email, "email")}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {renderSection("Academic Details", 
            <div className="grid grid-cols-2 gap-4">
              {renderField("Registration No.", user?.studentDetails?.regNo, "regNo")}
              {renderField("Branch", user?.studentDetails?.branch, "branch")}
              {renderField("Section", user?.studentDetails?.section, "section")}
              {renderField("Semester", user?.studentDetails?.semester, "semester")}
              {renderField("Academic Year", user?.studentDetails?.academicYear, "academicYear")}
              {renderField("Year", user?.studentDetails?.year, "year")}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {renderSection("Admission Details", 
            <div className="grid grid-cols-2 gap-4">
              {renderField("Admission Category", user?.studentDetails?.admissionCategory, "admissionCategory")}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {renderSection("Contact Details", 
            <div className="grid grid-cols-1 gap-4">
              {renderField("Phone", user?.studentDetails?.phone, "phone")}
              {renderField("Address", user?.studentDetails?.address, "address")}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
