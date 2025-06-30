import React, { useState, useEffect } from 'react';
import { BookOpen, Edit3, Save, X, User, Calendar, Target, FileText, Video, Download } from 'lucide-react';
import { getStudyPlans, updateStudyPlan, getUserQuizResults } from '../../utils/storage';
import { StudyPlan, QuizResult } from '../../types';

const StudyPlanManager: React.FC = () => {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    textPlan: '',
    videos: [{ title: '', url: '', duration: '' }],
    notes: [{ title: '', content: '', type: '' }],
    documents: [{ title: '', url: '', type: '' }]
  });

  useEffect(() => {
    const allPlans = getStudyPlans();
    setStudyPlans(allPlans);
  }, []);

  const handleEditPlan = (plan: StudyPlan) => {
    setSelectedPlan(plan);
    setEditForm({
      textPlan: plan.plan.textPlan,
      videos: plan.plan.videos.length > 0 ? plan.plan.videos : [{ title: '', url: '', duration: '' }],
      notes: plan.plan.notes.length > 0 ? plan.plan.notes : [{ title: '', content: '', type: '' }],
      documents: plan.plan.documents.length > 0 ? plan.plan.documents : [{ title: '', url: '', type: '' }]
    });
    setIsEditing(true);
  };

  const handleSavePlan = () => {
    if (!selectedPlan) return;

    const updatedPlan: StudyPlan = {
      ...selectedPlan,
      plan: {
        textPlan: editForm.textPlan,
        videos: editForm.videos.filter(v => v.title.trim()),
        notes: editForm.notes.filter(n => n.title.trim()),
        documents: editForm.documents.filter(d => d.title.trim())
      }
    };

    updateStudyPlan(updatedPlan);
    setStudyPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    setIsEditing(false);
    setSelectedPlan(null);
  };

  const addVideoField = () => {
    setEditForm(prev => ({
      ...prev,
      videos: [...prev.videos, { title: '', url: '', duration: '' }]
    }));
  };

  const addNoteField = () => {
    setEditForm(prev => ({
      ...prev,
      notes: [...prev.notes, { title: '', content: '', type: '' }]
    }));
  };

  const addDocumentField = () => {
    setEditForm(prev => ({
      ...prev,
      documents: [...prev.documents, { title: '', url: '', type: '' }]
    }));
  };

  const removeVideoField = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const removeNoteField = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index)
    }));
  };

  const removeDocumentField = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const getStudentName = (userId: string): string => {
    // In a real app, you'd fetch user data by ID
    return `Student ${userId.slice(-4)}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'from-emerald-500 to-green-600';
    if (score >= 80) return 'from-blue-500 to-cyan-600';
    if (score >= 70) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  if (studyPlans.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="glass-morphism rounded-3xl p-12 max-w-md mx-auto">
          <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-6" />
          <h3 className="text-2xl font-display font-bold text-white mb-4">No Study Plans Yet</h3>
          <p className="text-white/70 text-lg">
            Study plans will appear here when students complete quizzes and AI generates personalized learning paths.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-white mb-3 text-shadow-lg">Study Plan Manager</h2>
        <p className="text-white/70 text-lg">Review and customize AI-generated study plans for your students</p>
      </div>

      {/* Study Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {studyPlans.map((plan) => (
          <div key={plan.id} className="glass-morphism rounded-2xl p-6 border border-white/20 card-hover">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-gradient-to-r ${getScoreColor(plan.score)} rounded-xl flex items-center justify-center shadow-glow`}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">{getStudentName(plan.userId)}</h3>
                  <p className="text-white/70">{plan.subject}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${getScoreColor(plan.score)} text-white`}>
                  {plan.score}%
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Target className="w-4 h-4" />
                <span>Performance: {plan.score >= 80 ? 'Excellent' : plan.score >= 70 ? 'Good' : 'Needs Improvement'}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <h4 className="text-white font-semibold mb-2">AI Recommendation:</h4>
              <p className="text-white/80 text-sm line-clamp-3">{plan.plan.textPlan}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div className="bg-white/5 rounded-lg p-3">
                <Video className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-white/70 text-xs">{plan.plan.videos.length} Videos</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <FileText className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-white/70 text-xs">{plan.plan.notes.length} Notes</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <Download className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-white/70 text-xs">{plan.plan.documents.length} Docs</p>
              </div>
            </div>

            <button
              onClick={() => handleEditPlan(plan)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
            >
              <Edit3 className="w-4 h-4" />
              Customize Plan
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-morphism rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20 shadow-glass">
            <div className="p-6 border-b border-white/20">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white">Edit Study Plan</h3>
                  <p className="text-white/70">{getStudentName(selectedPlan.userId)} - {selectedPlan.subject}</p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Text Plan */}
              <div>
                <label className="block text-white font-semibold mb-2">AI Recommendation Text</label>
                <textarea
                  value={editForm.textPlan}
                  onChange={(e) => setEditForm(prev => ({ ...prev, textPlan: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter personalized study recommendation..."
                />
              </div>

              {/* Videos */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-white">Recommended Videos</h4>
                  <button
                    onClick={addVideoField}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Video
                  </button>
                </div>
                <div className="space-y-3">
                  {editForm.videos.map((video, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white/5 rounded-xl">
                      <input
                        type="text"
                        placeholder="Video Title"
                        value={video.title}
                        onChange={(e) => {
                          const newVideos = [...editForm.videos];
                          newVideos[index].title = e.target.value;
                          setEditForm(prev => ({ ...prev, videos: newVideos }));
                        }}
                        className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <input
                        type="text"
                        placeholder="Video URL"
                        value={video.url}
                        onChange={(e) => {
                          const newVideos = [...editForm.videos];
                          newVideos[index].url = e.target.value;
                          setEditForm(prev => ({ ...prev, videos: newVideos }));
                        }}
                        className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Duration"
                          value={video.duration}
                          onChange={(e) => {
                            const newVideos = [...editForm.videos];
                            newVideos[index].duration = e.target.value;
                            setEditForm(prev => ({ ...prev, videos: newVideos }));
                          }}
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button
                          onClick={() => removeVideoField(index)}
                          className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-white">Study Notes</h4>
                  <button
                    onClick={addNoteField}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Note
                  </button>
                </div>
                <div className="space-y-3">
                  {editForm.notes.map((note, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Note Title"
                          value={note.title}
                          onChange={(e) => {
                            const newNotes = [...editForm.notes];
                            newNotes[index].title = e.target.value;
                            setEditForm(prev => ({ ...prev, notes: newNotes }));
                          }}
                          className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type (PDF, Notes, etc.)"
                            value={note.type}
                            onChange={(e) => {
                              const newNotes = [...editForm.notes];
                              newNotes[index].type = e.target.value;
                              setEditForm(prev => ({ ...prev, notes: newNotes }));
                            }}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                          />
                          <button
                            onClick={() => removeNoteField(index)}
                            className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        placeholder="Note Content"
                        value={note.content}
                        onChange={(e) => {
                          const newNotes = [...editForm.notes];
                          newNotes[index].content = e.target.value;
                          setEditForm(prev => ({ ...prev, notes: newNotes }));
                        }}
                        rows={3}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-white">Documents</h4>
                  <button
                    onClick={addDocumentField}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Document
                  </button>
                </div>
                <div className="space-y-3">
                  {editForm.documents.map((doc, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white/5 rounded-xl">
                      <input
                        type="text"
                        placeholder="Document Title"
                        value={doc.title}
                        onChange={(e) => {
                          const newDocs = [...editForm.documents];
                          newDocs[index].title = e.target.value;
                          setEditForm(prev => ({ ...prev, documents: newDocs }));
                        }}
                        className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      <input
                        type="text"
                        placeholder="Document URL"
                        value={doc.url}
                        onChange={(e) => {
                          const newDocs = [...editForm.documents];
                          newDocs[index].url = e.target.value;
                          setEditForm(prev => ({ ...prev, documents: newDocs }));
                        }}
                        className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type (PDF, Worksheet, etc.)"
                          value={doc.type}
                          onChange={(e) => {
                            const newDocs = [...editForm.documents];
                            newDocs[index].type = e.target.value;
                            setEditForm(prev => ({ ...prev, documents: newDocs }));
                          }}
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <button
                          onClick={() => removeDocumentField(index)}
                          className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/20 flex gap-4">
              <button
                onClick={handleSavePlan}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanManager;