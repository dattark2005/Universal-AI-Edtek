import React, { useState } from 'react';
import { Upload, Send, Users } from 'lucide-react';
import { SUBJECTS } from '../../utils/mockData';
import { Assignment } from '../../types';
import { saveAssignment, getCurrentUser, getUserClassrooms } from '../../utils/storage';

const UploadAssignment: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [classroomId, setClassroomId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const user = getCurrentUser();
  const teacherClassrooms = user ? getUserClassrooms(user.id, 'teacher') : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim() || !dueDate) return;

    setIsSubmitting(true);

    const assignment: Assignment = {
      id: Math.random().toString(36).substr(2, 9),
      teacherId: user.id,
      teacherName: user.name,
      classroomId: classroomId || undefined,
      title: title.trim(),
      description: description.trim(),
      subject,
      dueDate: new Date(dueDate),
      createdAt: new Date()
    };

    saveAssignment(assignment);
    
    // Reset form
    setTitle('');
    setDescription('');
    setClassroomId('');
    setDueDate('');
    setIsSubmitting(false);
    setSubmitted(true);

    // Reset submitted state after 3 seconds
    setTimeout(() => setSubmitted(false), 3000);
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-8 mb-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-300" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Assignment Posted!</h3>
          <p className="text-white/70">
            Your assignment has been successfully posted and is now visible to students
            {classroomId ? ' in the selected classroom' : ' in all classrooms'}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Upload New Assignment</h2>
      
      {teacherClassrooms.length === 0 && (
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-300" />
            <span className="text-blue-300 font-medium">No Classrooms</span>
          </div>
          <p className="text-white/70 text-sm">
            Create a classroom first to organize your assignments and connect with students.
          </p>
        </div>
      )}
      
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-white font-medium mb-2">
              Assignment Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Enter assignment title..."
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-white font-medium mb-2">
                Subject
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {SUBJECTS.map((subj) => (
                  <option key={subj} value={subj} className="bg-gray-800">
                    {subj}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="classroom" className="block text-white font-medium mb-2">
                Classroom (Optional)
              </label>
              <select
                id="classroom"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="" className="bg-gray-800">All Students</option>
                {teacherClassrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id} className="bg-gray-800">
                    {classroom.name} ({classroom.students.length} students)
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="dueDate" className="block text-white font-medium mb-2">
              Due Date
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-white font-medium mb-2">
              Assignment Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Provide detailed instructions for the assignment..."
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !description.trim() || !dueDate}
            className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold transition-colors ${
              isSubmitting || !title.trim() || !description.trim() || !dueDate
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Upload className="w-5 h-5" />
            {isSubmitting ? 'Posting Assignment...' : 'Post Assignment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadAssignment;