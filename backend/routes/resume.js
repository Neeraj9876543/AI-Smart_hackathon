const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const Achievement = require('../models/Achievement');
const Project = require('../models/Project');
const User = require('../models/User');
const Resume = require('../models/Resume');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// OpenAI initialization is now inside the route handler to ensure env variables are fresh

function generateBasicResume(user, achievements, documents, projects) {
  const resumeData = {
    personalInfo: {
      name: user.name || '',
      email: user.email || '',
      phone: user.studentDetails?.phone || '',
      address: user.studentDetails?.address || '',
      linkedin: '',
      github: '',
      website: ''
    },
    summary: `Motivated ${user.studentDetails?.branch || 'Computer Science'} student with a strong academic background and passion for technology.`,
    education: [{
      institution: 'University College of Engineering',
      degree: 'Bachelor of Technology',
      fieldOfStudy: user.studentDetails?.branch || 'Computer Science Engineering',
      startDate: '2021',
      endDate: '2025',
      description: `Currently pursuing ${user.studentDetails?.branch || 'CSE'} with focus on software development and problem-solving.`
    }],
    experience: [],
    skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Problem Solving', 'Team Collaboration'],
    achievements: achievements.map(a => ({
      title: a.title,
      date: a.date,
      description: a.description
    })),
    projects: projects.map(p => ({
      title: p.title,
      description: p.description,
      technologies: p.technologies,
      link: p.projectUrl || p.githubUrl || ''
    })),
    languages: ['English']
  };

  // Extract skills from documents and projects
  if (documents.length > 0) {
    resumeData.skills.push('Document Analysis', 'Technical Writing');
  }
  
  // Add unique technologies from projects
  const projectTechs = new Set();
  projects.forEach(p => {
    p.technologies.forEach(tech => projectTechs.add(tech));
  });
  resumeData.skills.push(...Array.from(projectTechs));

  return resumeData;
}

async function extractTextFromFile(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (mimeType.startsWith('image/')) {
      // For images, we just return the filename as context for now.
      // In a real scenario, we might use OCR.
      return `[IMAGE: ${path.basename(filePath)}]`;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    return "";
  }
}

// Generate Resume Content
router.post('/generate', auth, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { selectedProjects } = req.body;
    const user = await User.findById(studentId);
    
    // Fetch all achievements
    const achievements = await Achievement.find({ studentId });
    
    // Fetch all documents
    const documents = await Document.find({ studentId });

    // Fetch selected projects or all projects if none specified
    let projects;
    if (selectedProjects && selectedProjects.length > 0) {
      projects = await Project.find({ 
        _id: { $in: selectedProjects },
        studentId 
      });
    } else {
      // Default to projects marked for resume
      projects = await Project.find({ 
        studentId, 
        isSelectedForResume: true 
      });
    }

    // Extract text from documents (limit to 10 most recent to avoid context bloat)
    // In a real app, we might let the user pick which documents to use.
    let studentContext = `Student Name: ${user.name}\nEmail: ${user.email}\n`;
    if (user.studentDetails) {
      studentContext += `Major: ${user.studentDetails.branch}\nReg No: ${user.studentDetails.regNo}\nAddress: ${user.studentDetails.address}\nPhone: ${user.studentDetails.phone}\n`;
    }

    studentContext += "\nACHIEVEMENTS:\n";
    achievements.forEach(a => {
      studentContext += `- ${a.title} (${a.type}): ${a.description}. Date: ${a.date}\n`;
    });

    studentContext += "\nPROJECTS:\n";
    projects.forEach(p => {
      studentContext += `- ${p.title}: ${p.description}. Technologies: ${p.technologies.join(', ')}. Status: ${p.status}. `;
      if (p.startDate) studentContext += `Started: ${new Date(p.startDate).toLocaleDateString()}. `;
      if (p.endDate) studentContext += `Completed: ${new Date(p.endDate).toLocaleDateString()}. `;
      if (p.projectUrl) studentContext += `URL: ${p.projectUrl}. `;
      if (p.githubUrl) studentContext += `GitHub: ${p.githubUrl}. `;
      studentContext += `\n`;
    });

    studentContext += "\nDOCUMENT CONTENTS:\n";
    for (const doc of documents) {
      const filePath = path.join(__dirname, '..', doc.fileUrl.startsWith('/') ? doc.fileUrl.substring(1) : doc.fileUrl);
      if (fs.existsSync(filePath)) {
        const text = await extractTextFromFile(filePath, doc.mimeType);
        studentContext += `\n--- Document: ${doc.type} (${doc.originalName}) ---\n${text.substring(0, 1000)}...\n`;
      }
    }

    const prompt = `
      You are an expert resume builder AI. Based on the following student details, achievements, and document contents, generate a professional resume in JSON format.
      The JSON should strictly follow this structure:
      {
        "personalInfo": { "name": "", "email": "", "phone": "", "address": "", "linkedin": "", "github": "", "website": "" },
        "summary": "Professional summary...",
        "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "description": "" }],
        "experience": [{ "company": "", "position": "", "location": "", "startDate": "", "endDate": "", "description": "" }],
        "skills": ["Skill1", "Skill2"],
        "achievements": [{ "title": "", "date": "", "description": "" }],
        "projects": [{ "title": "", "description": "", "technologies": [], "link": "" }],
        "languages": ["English"]
      }

      Student Context:
      ${studentContext}

      Important: 
      - Extract any relevant skills mentioned in documents.
      - Properly format dates.
      - Make the summary impactful.
      - If details like LinkedIn/GitHub are missing, leave them empty.
      - Education should include their current college if mentioned.
      - Return ONLY the JSON object.
    `;

    console.log(`--- NEW RESUME GENERATION ATTEMPT ---`);
    console.log(`Student ID: ${studentId}`);
    console.log(`Documents: ${documents.length}, Achievements: ${achievements.length}`);

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("CRITICAL: OPENROUTER_API_KEY is missing in .env!");
      return res.status(500).json({ message: "API Key is missing on server" });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY.trim(),
      baseURL: "https://openrouter.ai/api/v1",
    });

    let response;
    const modelsToTry = [
      "meta-llama/llama-3.2-1b-instruct:free",
      "huggingfaceh4/zephyr-7b-beta:free",
      "openchat/openchat-7b:free"
    ];

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}...`);
        response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
        });
        if (response) {
          console.log(`Success with model: ${model}`);
          break;
        }
      } catch (err) {
        console.error(`Failed with ${model}: ${err.message}`);
        lastError = err;
      }
    }

    if (!response) {
      console.log('All AI models failed, using fallback resume generation');
      // Fallback to basic resume generation
      const resumeData = generateBasicResume(user, achievements, documents, projects);
      
      try {
        // Save or Update Resume in DB
        let resume = await Resume.findOne({ studentId });
        
        if (resume) {
          resume.content = resumeData;
          await resume.save();
        } else {
          resume = new Resume({
            studentId,
            content: resumeData,
          });
          await resume.save();
        }

        return res.json({
          message: 'Resume generated successfully (using fallback template)',
          resume: resumeData,
        });
      } catch (saveError) {
        console.error('Error saving resume:', saveError);
        return res.status(500).json({
          message: 'Error saving resume data',
          error: saveError.message
        });
      }
    }

    let content = response.choices[0].message.content;
    console.log("AI Response received. Length:", content.length);
    
    // Cleanup AI response in case it wraps JSON in markdown blocks
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      content = content.split('```')[1].split('```')[0];
    }

    const resumeData = JSON.parse(content.trim());

    // Save or Update Resume in DB
    let resume = await Resume.findOne({ studentId });
    if (resume) {
      resume.content = resumeData;
      await resume.save();
    } else {
      resume = new Resume({
        studentId,
        content: resumeData,
      });
      await resume.save();
    }

    res.json({
      message: 'Resume generated successfully',
      resume: resume.content,
    });

  } catch (error) {
    console.error('Detailed Resume generation error:', error);
    res.status(500).json({ 
      message: 'Error generating resume with AI', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get student's resume
router.get('/', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ studentId: req.user.userId });
    if (!resume) {
      return res.status(404).json({ message: 'No resume found' });
    }
    res.json(resume.content);
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update resume (manual edits)
router.put('/', auth, async (req, res) => {
  try {
    let resume = await Resume.findOne({ studentId: req.user.userId });
    if (!resume) {
      resume = new Resume({
        studentId: req.user.userId,
        content: req.body,
      });
    } else {
      resume.content = req.body;
    }
    await resume.save();
    res.json({ message: 'Resume updated successfully', resume: resume.content });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
