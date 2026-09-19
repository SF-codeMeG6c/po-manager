import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Lock, Unlock, Trash2, Search, X } from 'lucide-react';

export default function POManager() {
  const [currentView, setCurrentView] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [pos, setPos] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  
  const [jobForm, setJobForm] = useState({
    jobCode: '',
    address: '',
    city: '',
    zipcode: '',
    superName: '',
    superPhone: '',
    superEmail: '',
    lockBoxCode: ''
  });
  
  const [subForm, setSubForm] = useState({
    name: '',
    contact: '',
    address: '',
    city: '',
    zipcode: '',
    phone: '',
    email: '',
    subcode: '',
    tradeCategory: '',
    vendorType: 'SUB'
  });
  
  const [poForm, setPoForm] = useState({
    subcontractorId: '',
    contractAmount: '',
    dateIssued: new Date().toISOString().split('T')[0],
    specifications: '',
    isLocked: false
  });
  
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const [showNewSubForm, setShowNewSubForm] = useState(false);
  const [subSearchTerm, setSubSearchTerm] = useState('');
  const [showNewPOForm, setShowNewPOForm] = useState(false);

  useEffect(() => {
    const savedJobs = JSON.parse(localStorage.getItem('jobs')) || [];
    const savedSubs = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const savedPOs = JSON.parse(localStorage.getItem('pos')) || [];
    setJobs(savedJobs);
    setSubcontractors(savedSubs);
    setPos(savedPOs);
  }, []);

  const saveToStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleJobSubmit = (e) => {
    e.preventDefault();
    if (editingJobId) {
      const updated = jobs.map(j => j.id === editingJobId ? { ...jobForm, id: editingJobId } : j);
      setJobs(updated);
      saveToStorage('jobs', updated);
      setEditingJobId(null);
    } else {
      const newJob = { ...jobForm, id: Date.now().toString() };
      const updated = [...jobs, newJob];
      setJobs(updated);
      saveToStorage('jobs', updated);
    }
    setJobForm({
      jobCode: '', address: '', city: '', zipcode: '',
      superName: '', superPhone: '', superEmail: '', lockBoxCode: ''
    });
  };

  const editJob = (job) => {
    setJobForm(job);
    setEditingJobId(job.id);
    setCurrentView('jobs');
  };

  const deleteJob = (id) => {
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);
    saveToStorage('jobs', updated);
  };

  const handleSubSubmit = (e) => {
    e.preventDefault();
    if (editingSubId) {
      const updated = subcontractors.map(s => s.id === editingSubId ? { ...subForm, id: editingSubId } : s);
      setSubcontractors(updated);
      saveToStorage('subcontractors', updated);
      setEditingSubId(null);
    } else {
      const newSub = { ...subForm, id: Date.now().toString() };
      const updated = [...subcontractors, newSub];
      setSubcontractors(updated);
      saveToStorage('subcontractors', updated);
    }
    setSubForm({
      name: '', contact: '', address: '', city: '', zipcode: '',
      phone: '', email: '', subcode: '', tradeCategory: '', vendorType: 'SUB'
    });
    setShowNewSubForm(false);
  };

  const editSub = (sub) => {
    setSubForm(sub);
    setEditingSubId(sub.id);
    setShowNewSubForm(true);
  };

  const deleteSub = (id) => {
    const updated = subcontractors.filter(s => s.id !== id);
    setSubcontractors(updated);
    saveToStorage('subcontractors', updated);
  };

  const filteredSubs = subcontractors.filter(s =>
    s.name.toLowerCase().includes(subSearchTerm.toLowerCase()) ||
    s.subcode.toLowerCase().includes(subSearchTerm.toLowerCase())
  );

  const handlePOSubmit = (e) => {
    e.preventDefault();
    const selectedJob = jobs.find(j => j.id === selectedJobId);
    if (!selectedJob) return;

    const poCount = pos.filter(p => p.jobId === selectedJobId).length;
    const poNumber = `${selectedJob.jobCode}-${String(poCount + 1).padStart(3, '0')}`;
    
    const newPO = {
      ...poForm,
      id: Date.now().toString(),
      jobId: selectedJobId,
      poNumber,
      createdAt: new Date().toISOString()
    };

    const updated = [...pos, newPO];
    setPos(updated);
    saveToStorage('pos', updated);
    
    setPoForm({
      subcontractorId: '',
      contractAmount: '',
      dateIssued: new Date().toISOString().split('T')[0],
      specifications: '',
      isLocked: false
    });
    setShowNewPOForm(false);
  };

  const togglePOLock = (poId) => {
    const updated = pos.map(p => 
      p.id === poId ? { ...p, isLocked: !p.isLocked } : p
    );
    setPos(updated);
    saveToStorage('pos', updated);
  };

  const deletePO = (id) => {
    const updated = pos.filter(p => p.id !== id);
    setPos(updated);
    saveToStorage('pos', updated);
  };

  const jobPOs = selectedJobId ? pos.filter(p => p.jobId === selectedJobId) : [];
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>PO Manager</h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
        <button
          onClick={() => setCurrentView('jobs')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: currentView === 'jobs' ? '#0066cc' : '#f0f0f0',
            color: currentView === 'jobs' ? 'white' : '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Jobs
        </button>
        <button
          onClick={() => setCurrentView('subcontractors')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: currentView === 'subcontractors' ? '#0066cc' : '#f0f0f0',
            color: currentView === 'subcontractors' ? 'white' : '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Subcontractors
        </button>
        {selectedJobId && (
          <button
            onClick={() => setCurrentView('pos')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: currentView === 'pos' ? '#0066cc' : '#f0f0f0',
              color: currentView === 'pos' ? 'white' : '#333',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            POs ({jobPOs.length})
          </button>
        )}
      </div>

      {currentView === 'jobs' && (
        <div>
          <h2>Job Master</h2>
          
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxHeight: '500px', overflowY: 'auto' }}>
            <h3>{editingJobId ? 'Edit Job' : 'Create New Job'}</h3>
            <form onSubmit={handleJobSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <input type="text" placeholder="Job Code" value={jobForm.jobCode} onChange={(e) => setJobForm({ ...jobForm, jobCode: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" placeholder="Address" value={jobForm.address} onChange={(e) => setJobForm({ ...jobForm, address: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" placeholder="City" value={jobForm.city} onChange={(e) => setJobForm({ ...jobForm, city: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" placeholder="Zipcode" value={jobForm.zipcode} onChange={(e) => setJobForm({ ...jobForm, zipcode: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" placeholder="Super Name" value={jobForm.superName} onChange={(e) => setJobForm({ ...jobForm, superName: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" placeholder="Super Phone" value={jobForm.superPhone} onChange={(e) => setJobForm({ ...jobForm, superPhone: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="email" placeholder="Super Email" value={jobForm.superEmail} onChange={(e) => setJobForm({ ...jobForm, superEmail: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" placeholder="Lock Box Code" value={jobForm.lockBoxCode} onChange={(e) => setJobForm({ ...jobForm, lockBoxCode: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ padding: '10px 16px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                  {editingJobId ? 'Update Job' : 'Create Job'}
                </button>
                {editingJobId && (
                  <button type="button" onClick={() => { setEditingJobId(null); setJobForm({ jobCode: '', address: '', city: '', zipcode: '', superName: '', superPhone: '', superEmail: '', lockBoxCode: '' }); }} style={{ padding: '10px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {jobs.map(job => (
              <div key={job.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', background: selectedJobId === job.id ? '#e6f2ff' : 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{job.jobCode}</h3>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>{job.address}, {job.city} {job.zipcode}</p>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>Super: {job.superName} | {formatPhoneNumber(job.superPhone)}</p>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>Email: {job.superEmail}</p>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>Lock Box: {job.lockBoxCode}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setSelectedJobId(job.id); setCurrentView('pos'); }} style={{ padding: '8px 12px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                      View POs
                    </button>
                    <button onClick={() => editJob(job)} style={{ padding: '8px 12px', background: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                      Edit
                    </button>
                    <button onClick={() => deleteJob(job.id)} style={{ padding: '8px 12px', background: '#cc3333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {jobs.length === 0 && <p style={{ color: '#999' }}>No jobs yet. Create one above.</p>}
          </div>
        </div>
      )}

      {currentView === 'subcontractors' && (
        <div>
          <h2>Subcontractor Master Library</h2>
          
          <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search by name or subcode..."
              value={subSearchTerm}
              onChange={(e) => setSubSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button
              onClick={() => { setShowNewSubForm(!showNewSubForm); setEditingSubId(null); setSubForm({ name: '', contact: '', address: '', city: '', zipcode: '', phone: '', email: '', subcode: '', tradeCategory: '', vendorType: 'SUB' }); }}
              style={{ padding: '10px 16px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
            >
              + New Subcontractor
            </button>
          </div>

          {showNewSubForm && (
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxHeight: '500px', overflowY: 'auto' }}>
              <h3>{editingSubId ? 'Edit Subcontractor' : 'Add New Subcontractor'}</h3>
              <form onSubmit={handleSubSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <input type="text" placeholder="Name" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" placeholder="Contact" value={subForm.contact} onChange={(e) => setSubForm({ ...subForm, contact: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" placeholder="Address" value={subForm.address} onChange={(e) => setSubForm({ ...subForm, address: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" placeholder="City" value={subForm.city} onChange={(e) => setSubForm({ ...subForm, city: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" placeholder="Zipcode" value={subForm.zipcode} onChange={(e) => setSubForm({ ...subForm, zipcode: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" placeholder="Phone" value={subForm.phone} onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="email" placeholder="Email" value={subForm.email} onChange={(e) => setSubForm({ ...subForm, email: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" placeholder="Subcode" value={subForm.subcode} onChange={(e) => setSubForm({ ...subForm, subcode: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" placeholder="Trade Category" value={subForm.tradeCategory} onChange={(e) => setSubForm({ ...subForm, tradeCategory: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <select value={subForm.vendorType} onChange={(e) => setSubForm({ ...subForm, vendorType: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="SUB">Subcontractor (SUB)</option>
                  <option value="Material">Material Supplier</option>
                </select>
                
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{ padding: '10px 16px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                    {editingSubId ? 'Update' : 'Add'}
                  </button>
                  <button type="button" onClick={() => { setShowNewSubForm(false); setEditingSubId(null); }} style={{ padding: '10px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredSubs.map(sub => (
              <div key={sub.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{sub.name} ({sub.subcode})</h3>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>Contact: {sub.contact}</p>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>{sub.address}, {sub.city} {sub.zipcode}</p>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>Phone: {formatPhoneNumber(sub.phone)} | Email: {sub.email}</p>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>Trade: {sub.tradeCategory} | Type: {sub.vendorType}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => editSub(sub)} style={{ padding: '8px 12px', background: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                      Edit
                    </button>
                    <button onClick={() => deleteSub(sub.id)} style={{ padding: '8px 12px', background: '#cc3333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredSubs.length === 0 && <p style={{ color: '#999' }}>No subcontractors found.</p>}
          </div>
        </div>
      )}

      {currentView === 'pos' && selectedJob && (
        <div>
          <h2>Purchase Orders for {selectedJob.jobCode}</h2>
          
          {!showNewPOForm ? (
            <button
              onClick={() => setShowNewPOForm(true)}
              style={{ marginBottom: '20px', padding: '10px 16px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
            >
              + Create New PO
            </button>
          ) : (
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxHeight: '600px', overflowY: 'auto' }}>
              <h3>Create PO</h3>
              <form onSubmit={handlePOSubmit} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ background: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                    <strong>Job:</strong> {selectedJob.jobCode} | <strong>Address:</strong> {selectedJob.address}, {selectedJob.city} {selectedJob.zipcode}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                    <strong>Super:</strong> {selectedJob.superName} ({formatPhoneNumber(selectedJob.superPhone)}) | {selectedJob.superEmail}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Subcontractor</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={poForm.subcontractorId}
                      onChange={(e) => setPoForm({ ...poForm, subcontractorId: e.target.value })}
                      required
                      style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="">Select from library...</option>
                      {subcontractors.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.subcode})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewSubForm(true)}
                      style={{ padding: '8px 12px', background: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Add New
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Contract Amount ($)"
                  value={poForm.contractAmount}
                  onChange={(e) => setPoForm({ ...poForm, contractAmount: e.target.value })}
                  required
                  style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />

                <input
                  type="date"
                  value={poForm.dateIssued}
                  onChange={(e) => setPoForm({ ...poForm, dateIssued: e.target.value })}
                  required
                  style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />

                <textarea
                  placeholder="Job Specifications (large text field)"
                  value={poForm.specifications}
                  onChange={(e) => setPoForm({ ...poForm, specifications: e.target.value })}
                  style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '120px' }}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{ padding: '10px 16px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                    Create PO
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewPOForm(false)}
                    style={{ padding: '10px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {jobPOs.map(po => {
              const sub = subcontractors.find(s => s.id === po.subcontractorId);
              return (
                <div
                  key={po.id}
                  style={{
                    border: po.isLocked ? '2px solid #cc6633' : '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px',
                    background: po.isLocked ? '#fff8f3' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0' }}>
                        {po.poNumber} {po.isLocked && <Lock size={16} style={{ display: 'inline', marginLeft: '8px', color: '#cc6633' }} />}
                      </h3>
                      <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{sub?.name} | {po.dateIssued}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>${parseFloat(po.contractAmount).toFixed(2)}</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => togglePOLock(po.id)}
                          style={{
                            padding: '8px 12px',
                            background: po.isLocked ? '#0066cc' : '#ccc',
                            color: po.isLocked ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {po.isLocked ? 'Unlock' : 'Lock'}
                        </button>
                        {!po.isLocked && (
                          <button
                            onClick={() => deletePO(po.id)}
                            style={{ padding: '8px 12px', background: '#cc3333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {sub && (
                    <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '4px', marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                      <p style={{ margin: '4px 0' }}><strong>Contact:</strong> {sub.contact}</p>
                      <p style={{ margin: '4px 0' }}><strong>Address:</strong> {sub.address}, {sub.city} {sub.zipcode}</p>
                      <p style={{ margin: '4px 0' }}><strong>Phone:</strong> {formatPhoneNumber(sub.phone)} | <strong>Email:</strong> {sub.email}</p>
                      <p style={{ margin: '4px 0' }}><strong>Subcode:</strong> {sub.subcode}</p>
                    </div>
                  )}

                  {po.specifications && (
                    <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '4px', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#333' }}>
                      {po.specifications}
                    </div>
                  )}
                </div>
              );
            })}
            {jobPOs.length === 0 && <p style={{ color: '#999' }}>No POs yet for this job.</p>}
          </div>
        </div>
      )}

      {currentView === 'pos' && !selectedJob && (
        <p style={{ color: '#999' }}>Select a job to view/create POs.</p>
      )}
    </div>
  );
}