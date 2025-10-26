import { AlertCircle, CheckCircle, Clock, Edit3, FileText, Send, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const App = () => {
  const [students, setStudents] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);
  const [editedEmail, setEditedEmail] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [emailsSent, setEmailsSent] = useState(0);

  // Load data from Excel Sheet1
  useEffect(() => {
    fetch('/collection_field_name_description.xlsx')
      .then(res => res.arrayBuffer())
      .then(buffer => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const mappedStudents = data.map((row, i) => {
          const missingDocs = Object.keys(row)
            .filter(k => k.toLowerCase().includes('documents.missing'))
            .map(k => row[k])
            .filter(Boolean);

          const name =
            row['personalinfo.fullname'] ||
            row['fullname'] ||
            row['Student Name'] ||
            `Student ${i + 1}`;

          const email =
            row['personalinfo.contact.email'] ||
            row['email'] ||
            'unknown@email.com';

          const deadline = row['programinfo.deadline']
            ? new Date(row['programinfo.deadline'])
            : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

          const urgency =
            deadline - new Date() <= 5 * 24 * 60 * 60 * 1000 ? 'high' : 'medium';

          const stage = row['application.status'] || 'Application in Progress';

          return {
            id: i + 1,
            name: name.trim(),
            email: email.trim(),
            stage,
            missingDocs,
            deadline,
            urgency,
          };
        }).filter(s => s.name);

        setStudents(mappedStudents);
        setChatMessages([
          { type: 'agent', text: `Loaded ${mappedStudents.length} students from "${sheetName}".` },
          { type: 'agent', text: "Ask me about missing docs, priority applicants, email drafts, or application status." }
        ]);
      })
      .catch(error => {
        setChatMessages([{ type: 'agent', text: `Error loading data: ${error.message}` }]);
      });
  }, []);

  /** Custom Action: Find Priority Applicants */
  const findPriorityApplicants = () => {
    return students
      .filter(s => s.urgency !== 'low')
      .sort((a, b) => a.deadline - b.deadline);
  };

  /** Custom Action: Draft Personalized Email */
  const draftPersonalizedEmail = (student) => {
    const daysLeft = Math.ceil((student.deadline - new Date()) / (1000 * 60 * 60 * 24));
    const urgent = daysLeft <= 5;
    return {
      subject: urgent
        ? `URGENT: Missing Documents - Deadline ${student.deadline.toLocaleDateString()}`
        : 'Reminder: Missing Documents for Your Application',
      body: `Dear ${student.name.split(' ')[0]},\n\n${urgent ? `Please submit missing documents within ${daysLeft} days to meet the application deadline.` : `Please submit missing documents to complete your application.`}\n\n${student.missingDocs.map(d => `- ${d}`).join('\n')}\n\nBest,\nAdmissions Office`
    };
  };

  /** Custom Action: Update Application Status */
  const updateApplicationStatus = (studentId, newStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, stage: newStatus, missingDocs: [] } : s));
    setChatMessages(prev => [...prev, { type: 'system', text: `Application status for student #${studentId} updated to '${newStatus}'.` }]);
  };

  const generateEmail = student => draftPersonalizedEmail(student);

  const handleGenerateEmail = student => {
    const email = generateEmail(student);
    setSelectedStudent(student);
    setDraftEmail(email);
    setEditedEmail(email.body);
    setEditMode(false);
  };

  const handleApproveEmail = () => {
    setChatMessages(prev => [...prev, { type: 'system', text: `✅ Reminder email sent to ${selectedStudent.name}` }]);
    setEmailsSent(n => n + 1);
    setDraftEmail(null);
    setSelectedStudent(null);
  };

  const interpretQuery = query => {
    const q = query.toLowerCase();
    return {
      wantsMissing: /missing|incomplete|pending/.test(q),
      wantsFinancial: /financial|fee|income/.test(q),
      wantsPriority: /priority|urgent|deadline|due soon/.test(q),
      wantsEmail: /email|draft|reminder/.test(q),
      wantsStatusList: /under review|waitlisted|rejected|accepted|application status/.test(q),
      wantsUpdateStatus: /update status|mark reviewed|set status/.test(q),
    };
  };

  const handleQuery = query => {
    const intent = interpretQuery(query);
    let res = '';

    if (intent.wantsUpdateStatus) {
      // For demo: update first student's status to 'Documents Reviewed'
      if (students.length > 0) {
        updateApplicationStatus(students[0].id, 'Documents Reviewed');
        res = `Updated application status for ${students[0].name} to 'Documents Reviewed'.`;
      } else {
        res = 'No students available to update status.';
      }
    } else if (intent.wantsStatusList) {
      const statuses = ['under review', 'waitlisted', 'rejected', 'accepted'];
      const requestedStatuses = statuses.filter(st => query.toLowerCase().includes(st));
      if (requestedStatuses.length === 0) {
        res = "Please specify a status to filter e.g. 'accepted'.";
      } else {
        requestedStatuses.forEach(st => {
          const filtered = students.filter(s => s.stage.toLowerCase().includes(st));
          if (filtered.length > 0) {
            res += `\nStudents with status '${st}':\n${filtered.map(s => `• ${s.name}`).join('\n')}\n`;
          } else {
            res += `\nNo students found with status '${st}'.\n`;
          }
        });
      }
    } else if (intent.wantsMissing && intent.wantsFinancial) {
      const filtered = students.filter(s => s.missingDocs.some(d => d.toLowerCase().includes('financial')));
      res = filtered.length > 0 ? `Students missing financial documents:\n${filtered.map(s => `• ${s.name}`).join('\n')}` : 'No students missing financial documents.';
    } else if (intent.wantsMissing) {
      const filtered = students.filter(s => s.missingDocs.length > 0);
      res = filtered.length > 0 ? `${filtered.length} students have missing documents:\n${filtered.map(s => `• ${s.name} - Missing: ${s.missingDocs.join(', ')}`).join('\n')}` : 'All students have complete applications.';
    } else if (intent.wantsPriority) {
      const ranked = findPriorityApplicants();
      res = ranked.length > 0 ? `Priority applicants:\n${ranked.map((s, i) => `${i+1}. ${s.name} - ${s.urgency.toUpperCase()} urgency (Deadline: ${s.deadline.toLocaleDateString()})`).join('\n')}` : 'No priority applicants found.';
    } else if (intent.wantsEmail) {
      const missing = students.filter(s => s.missingDocs.length > 0);
      res = `I can draft reminder emails for ${missing.length} students who are missing documents.`;
    } else {
      res = "I can help with:\n• Missing documents\n• Deadlines and priorities\n• Reminder email drafting\n• Listing students by application status\nTry asking 'Who's missing financial documents?' or 'List accepted students'.";
    }
    return res;
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { type: 'user', text: chatInput }]);
    const reply = handleQuery(chatInput);
    setChatMessages(prev => [...prev, { type: 'agent', text: reply }]);
    setChatInput('');
  };

  const priorityList = findPriorityApplicants();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EDMO Agentforce</h1>
            <p className="text-sm text-gray-600">AI Admissions Counselor</p>
          </div>
          <div className="flex gap-6 items-center">
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{emailsSent}</div>
              <div className="text-xs text-gray-600">Emails Sent</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">{priorityList.length}</div>
              <div className="text-xs text-gray-600">Priority Alerts</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="col-span-1 bg-white rounded-lg shadow-md flex flex-col h-[calc(100vh-180px)]">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              AI Assistant
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.type === 'user' ? 'bg-indigo-600 text-white' : msg.type === 'system' ? 'bg-green-50 border border-green-300 text-green-800' : 'bg-gray-100 text-gray-900'}`}>
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about students or deadlines..." className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" onKeyDown={e => e.key === 'Enter' && handleChatSubmit()} />
            <button onClick={handleChatSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"><Send className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Priority + Draft Section */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Priority Applicants ({priorityList.length})
            </h2>
            {priorityList.map(student => {
              const days = Math.ceil((student.deadline - new Date()) / (1000 * 60 * 60 * 24)) || 0;
              return (
                <div key={student.id} className="border border-gray-200 rounded-lg p-4 mb-3 hover:border-indigo-300 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <div className="text-sm text-gray-700 flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" /> Deadline: {student.deadline.toLocaleDateString()} ({days} days)
                      </div>
                      <div className="text-sm text-orange-700 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-4 h-4" /> Missing: {student.missingDocs.length > 0 ? student.missingDocs.join(', ') : 'None'}
                      </div>
                    </div>
                    <button onClick={() => handleGenerateEmail(student)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-indigo-700 flex items-center gap-1"><FileText className="w-4 h-4" /> Draft Email</button>
                  </div>
                </div>
              );
            })}
          </div>

          {draftEmail && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Email Draft - {selectedStudent.name}</h2>
                <button onClick={() => { setSelectedStudent(null); setDraftEmail(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <div className="text-sm text-gray-900">{selectedStudent.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Subject:</label>
                  <div className="text-sm font-semibold text-gray-900">{draftEmail.subject}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Message:</label>
                  {editMode ? (
                    <textarea value={editedEmail} onChange={e => setEditedEmail(e.target.value)} className="w-full h-48 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 mt-1" />
                  ) : (
                    <div className="bg-gray-50 border rounded-lg p-3 text-sm whitespace-pre-line mt-1">{editedEmail}</div>
                  )}
                  {!editMode && (
                    <button onClick={() => setEditMode(true)} className="text-sm text-indigo-600 mt-1 hover:text-indigo-800 flex gap-1 items-center"><Edit3 className="w-3 h-3" /> Edit</button>
                  )}
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={handleApproveEmail} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Approve & Send</button>
                  <button onClick={() => { setDraftEmail(null); setEditMode(false); }} className="border border-gray-300 px-4 py-2 rounded-lg text-gray-800 hover:bg-gray-50">Discard</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
