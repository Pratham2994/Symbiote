// SignupSteps.jsx
import React, { useState, useEffect } from 'react';
import { Plus, X, FileText, Github, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { toast } from 'react-toastify';

// Add custom scrollbar styles
const scrollbarStyles = `
  .simplebar-scrollbar::before {
    background-color: #8B5CF6 !important;
    border-radius: 4px !important;
  }
  .simplebar-track.simplebar-vertical {
    background-color: transparent !important;
  }
`;

const EQ_QUESTIONS = [
  {
    question: "Your team members disagree on an approach. What do you do?",
    options: [
      "Stick with your own idea and push forward.",
      "Explain your approach logically and let the team decide.",
      "Try to merge ideas into a compromise.",
      "Let others take the lead while you execute.",
      "Drop your idea to maintain harmony."
    ]
  },
  {
    question: "A teammate is struggling to complete their task. How do you react?",
    options: [
      "Ignore it and focus on your part.",
      "Suggest they try looking at documentation.",
      "Offer to split their workload and help.",
      "Fully take over their task.",
      "Encourage them but let them figure it out."
    ]
  },
  {
    question: "The hackathon has a last-minute rule change. What do you do?",
    options: [
      "Panic and stick to the original plan.",
      "Suggest adjusting a small part of the project.",
      "Quickly brainstorm with the team for an alternative.",
      "Let the team decide and go with the flow.",
      "Insist on starting over for a perfect solution."
    ]
  },
  {
    question: "A teammate criticizes your code. What is your response?",
    options: [
      "Defend it and explain why it's correct.",
      "Ask for clarification but stick to your way if unconvinced.",
      "Consider their point and modify it if reasonable.",
      "Accept their suggestion and apply it.",
      "Let them rewrite the code however they want."
    ]
  }
];

const SKILLS = [
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "CSS",
  "HTML",
  "MongoDB",
  "Express",
  "Java",
  "C++",
  "C#",
  "SQL",
  "TypeScript",
  "Redux",
  "Git"
];

const SignupSteps = ({ email, password, onClose }) => {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [profile, setProfile] = useState({
    resume: null,
    githubLink: '',
    aboutMe: '',
    otherLinks: ['']
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [eqAnswers, setEqAnswers] = useState({
    q1: null,
    q2: null,
    q3: null,
    q4: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Add useEffect to reset scroll position when step changes
  useEffect(() => {
    const scrollContainer = document.querySelector('.simplebar-content-wrapper');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [step]);

  const validateOtp = () => {
    if (!otp || otp.length !== 6) {
      setErrors(prev => ({ ...prev, otp: 'Please enter a valid 6-digit OTP' }));
      return false;
    }
    return true;
  };

  const validateUrl = (url) => {
    if (!url) return true; // Empty URLs are allowed (optional)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profile.resume) {
      newErrors.resume = 'Resume is required (PDF format)';
    } else if (!profile.resume.type.includes('pdf')) {
      newErrors.resume = 'Please upload a PDF file';
    }
    if (!profile.githubLink) {
      newErrors.githubLink = 'GitHub link is required';
    } else if (!profile.githubLink.includes('github.com')) {
      newErrors.githubLink = 'Please enter a valid GitHub URL';
    }
    if (selectedSkills.length === 0) {
      newErrors.skills = 'Please select at least one skill';
    }
    if (!profile.aboutMe) {
      newErrors.aboutMe = 'Please enter a short bio';
    }
    
    // Validate other links
    profile.otherLinks.forEach((link, index) => {
      if (link && !validateUrl(link)) {
        newErrors[`otherLink${index}`] = 'Please enter a valid URL';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEq = () => {
    const newErrors = {};
    if (Object.values(eqAnswers).some(answer => answer === null)) {
      newErrors.eq = 'Please answer all questions';
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setProfile(prev => ({ ...prev, resume: file }));
        setErrors(prev => ({ ...prev, resume: '' }));
      } else {
        setErrors(prev => ({ ...prev, resume: 'Please upload a PDF file' }));
      }
    }
  };

  const addLink = () => {
    setProfile(prev => ({
      ...prev,
      otherLinks: [...prev.otherLinks, '']
    }));
  };

  const removeLink = (index) => {
    setProfile(prev => ({
      ...prev,
      otherLinks: prev.otherLinks.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index, value) => {
    setProfile(prev => ({
      ...prev,
      otherLinks: prev.otherLinks.map((link, i) => i === index ? value : link)
    }));
  };

  const handleSkillClick = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  // For steps 1 and 2, we simply validate and move on.
  const handleNext = () => {
    if (step === 1) {
      if (validateOtp()) {
        setStep(2);
        setErrors({});
      }
    } else if (step === 2) {
      if (validateProfile()) {
        setStep(3);
        setErrors({});
      }
    }
  };

  // In step 3, the Submit button now calls handleRegister to actually perform registration.
  const handleRegister = async () => {
    if (!validateEq()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', 'Student');
      // For username, here we use the GitHub username as a placeholder:
      const username = profile.githubLink.split('/').pop();
      formData.append('username', username);
      formData.append('githubLink', profile.githubLink);
      formData.append('aboutMe', profile.aboutMe);
      formData.append('skills', selectedSkills.join(', '));
      formData.append('otherLinks', JSON.stringify(profile.otherLinks));
      if (profile.resume) {
        formData.append('resume', profile.resume);
      }
      formData.append('eqAnswers', JSON.stringify(eqAnswers));
      // Send registration request to backend
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Signup successful! Welcome to Symbiote.', {
          style: {
            background: '#0B0B0B',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
            color: '#E5E7EB'
          },
          progressStyle: {
            background: '#8B5CF6'
          }
        });
        onClose();
      } else {
        toast.error(data.message || 'Registration failed', {
          style: {
            background: '#0B0B0B',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
            color: '#E5E7EB'
          },
          progressStyle: {
            background: '#8B5CF6'
          }
        });
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.', {
        style: {
          background: '#0B0B0B',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
          color: '#E5E7EB'
        },
        progressStyle: {
          background: '#8B5CF6'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      <SimpleBar className="max-h-[490px]">
        <div className="space-y-6 pr-4">
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                  setErrors(prev => ({ ...prev, otp: '' }));
                }}
                className={`w-full px-4 py-2 rounded-lg bg-symbiote-purple/20 border ${
                  errors.otp ? 'border-red-500' : 'border-venom-purple/30'
                } focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20`}
                placeholder="Enter 6-digit OTP"
                disabled={loading}
              />
              {errors.otp && (
                <p className="mt-1 text-sm text-red-500">{errors.otp}</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              

              <div>
                <label className="block text-sm font-medium mb-2">GitHub Profile</label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ghost-lilac/60" />
                  <input
                    type="url"
                    value={profile.githubLink}
                    onChange={(e) => {
                      setProfile(prev => ({ ...prev, githubLink: e.target.value }));
                      setErrors(prev => ({ ...prev, githubLink: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg bg-symbiote-purple/20 border ${
                      errors.githubLink ? 'border-red-500' : 'border-venom-purple/30'
                    } focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20`}
                    placeholder="https://github.com/yourusername"
                    disabled={loading}
                  />
                </div>
                {errors.githubLink && (
                  <p className="mt-1 text-sm text-red-500">{errors.githubLink}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Your Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(skill => (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => handleSkillClick(skill)}
                      className={`px-3 py-1 rounded-full border transition-colors ${
                        selectedSkills.includes(skill)
                          ? 'bg-venom-purple text-white border-venom-purple'
                          : 'bg-venom-purple/10 text-ghost-lilac border-venom-purple/20 hover:bg-venom-purple/20'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                {errors.skills && (
                  <p className="mt-1 text-sm text-red-500">{errors.skills}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">About Me</label>
                <textarea
                  value={profile.aboutMe}
                  onChange={(e) => {
                    setProfile(prev => ({ ...prev, aboutMe: e.target.value }));
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-symbiote-purple/20 border border-venom-purple/30 focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20"
                  placeholder="Tell us about yourself"
                  disabled={loading}
                ></textarea>
                {errors.aboutMe && (
                  <p className="mt-1 text-sm text-red-500">{errors.aboutMe}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">Other Links (Optional)</label>
                {profile.otherLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ghost-lilac/60" />
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => {
                          updateLink(index, e.target.value);
                          setErrors(prev => ({ ...prev, [`otherLink${index}`]: '' }));
                        }}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg bg-symbiote-purple/20 border ${
                          errors[`otherLink${index}`] ? 'border-red-500' : 'border-venom-purple/30'
                        } focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20`}
                        placeholder="https://"
                        disabled={loading}
                      />
                    </div>
                    {index === profile.otherLinks.length - 1 ? (
                      <button
                        type="button"
                        onClick={addLink}
                        className="p-2 rounded-lg bg-venom-purple/20 hover:bg-venom-purple/30 border border-venom-purple/30 transition-colors"
                        disabled={loading}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors"
                        disabled={loading}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                ))}
                {Object.entries(errors)
                  .filter(([key]) => key.startsWith('otherLink'))
                  .map(([key, error]) => (
                    <p key={key} className="mt-1 text-sm text-red-500">{error}</p>
                  ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Resume (PDF)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <div className={`px-4 py-2 rounded-lg border ${
                      errors.resume ? 'border-red-500' : 'border-venom-purple/30'
                    } bg-symbiote-purple/20 cursor-pointer hover:bg-symbiote-purple/30 transition-colors flex items-center gap-2`}>
                      <FileText className="w-5 h-5" />
                      <span>{profile.resume ? profile.resume.name : 'Choose PDF file'}</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </label>
                </div>
                {errors.resume && (
                  <p className="mt-1 text-sm text-red-500">{errors.resume}</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              {EQ_QUESTIONS.map((q, qIndex) => (
                <div key={qIndex} className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-venom-purple font-semibold text-lg">Q{qIndex + 1}</span>
                    <p className="text-lg font-medium">{q.question}</p>
                  </div>
                  <div className="grid gap-3 pl-8">
                    {q.options.map((option, oIndex) => (
                      <button
                        key={oIndex}
                        type="button"
                        onClick={() => setEqAnswers(prev => ({ ...prev, [`q${qIndex + 1}`]: oIndex + 1 }))}
                        className={`p-4 text-left rounded-lg border transition-colors ${
                          eqAnswers[`q${qIndex + 1}`] === oIndex + 1
                            ? 'bg-venom-purple text-white border-venom-purple'
                            : 'bg-venom-purple/5 text-ghost-lilac border-venom-purple/20 hover:bg-venom-purple/10'
                        }`}
                        disabled={loading}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {errors.eq && (
                <p className="text-sm text-red-500">{errors.eq}</p>
              )}
            </div>
          )}

          {errors.submit && (
            <p className="text-sm text-red-500 text-center">{errors.submit}</p>
          )}

          <div className="flex gap-4">
            {step === 3 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-venom-purple/20 text-venom-purple rounded-lg font-semibold border border-venom-purple/30 hover:bg-venom-purple/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={step === 3 ? handleRegister : handleNext}
              className={`py-3 bg-venom-purple rounded-lg font-semibold shadow-neon hover:shadow-lg hover:bg-venom-purple/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                step === 3 ? 'flex-1' : 'w-full'
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                step === 3 ? 'Submit' : 'Next'
              )}
            </button>
          </div>
        </div>
      </SimpleBar>
    </>
  );
};

export default SignupSteps;
