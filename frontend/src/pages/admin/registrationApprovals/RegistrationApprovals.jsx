import React, { useEffect, useState } from 'react';
import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';

import './RegistrationApprovals.css';

const RegistrationApprovals = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all registrations and keep all statuses
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:7000/fetch-registrations-admin');
      setAllEvents(response.data);
    } catch (error) {
      console.error('Error fetching registration data:', {
        message: error.message,
        response: error.response?.data,
      });
      alert('Failed to load data. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group registrations by event_name
  // We'll show only pending students under each event
  const groupedByEventName = allEvents.reduce((acc, event) => {
    // Initialize if does not exist
    if (!acc[event.event_name]) acc[event.event_name] = [];
    acc[event.event_name].push(event);
    return acc;
  }, {});

  // Open event modal to show all pending students for that event
  const handleOpenModal = (eventName) => {
    setSelectedEventName(eventName);
    setSelectedStudent(null);
    setShowRejectionInput(false);
    setRejectionReason('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEventName(null);
    setSelectedStudent(null);
    setShowRejectionInput(false);
    setRejectionReason('');
  };

  const handleSelectStudent = (student) => {
    // Reset rejection input each time a different student is clicked
    setSelectedStudent(student);
    setShowRejectionInput(false);
    setRejectionReason('');
  };

  const handleApprove = async (student) => {
    try {
      await axios.post('http://localhost:7000/approve-registration', {
        id: student.id,
        reg_status: 'approved',
      });
      await fetchData();
      // Refresh modal views:
      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent(null);
      }
    } catch (err) {
      alert('Approval failed.');
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    try {
      await axios.post('http://localhost:7000/reject-registration', {
        id: selectedStudent.id,
        reg_status: 'rejected',
        reg_rej_reason: rejectionReason,
      });
      await fetchData();
      setShowRejectionInput(false);
      setRejectionReason('');
      setSelectedStudent(null);
    } catch (err) {
      alert('Rejection failed.');
      console.error(err);
    }
  };

  // Filter pending students for modal display of selected event
  const pendingStudentsForSelectedEvent = selectedEventName
    ? groupedByEventName[selectedEventName].filter((s) => s.reg_status === 'pending')
    : [];

  return (
    <div className="registration-container" style={{ padding: 16 }}>
      <Typography variant="h6" gutterBottom>
        Pending Registrations By Event
      </Typography>

      {loading && <Typography>Loading...</Typography>}

      {!loading && Object.keys(groupedByEventName).length === 0 && (
        <Typography>No registrations found.</Typography>
      )}

      {!loading &&
        Object.entries(groupedByEventName).map(([eventName, registrations]) => {
          // Count pending registrations for this event
          const pendingCount = registrations.filter((r) => r.reg_status === 'pending').length;

          if (pendingCount === 0) return null; // Don't show events with no pending students

          return (
            <div
              key={eventName}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid #ddd',
                cursor: 'pointer',
              }}
              onClick={() => handleOpenModal(eventName)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleOpenModal(eventName);
              }}
            >
              <Typography variant="subtitle1">
                {eventName} ({pendingCount} pending)
              </Typography>
            </div>
          );
        })}

      {/* Modal to show pending students for the selected event */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEventName} - Pending Students
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            size="large"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {pendingStudentsForSelectedEvent.length === 0 && (
            <Typography>No pending students for this event.</Typography>
          )}
          <List>
            {pendingStudentsForSelectedEvent.map((student) => (
              <ListItem
                button
                key={student.id}
                selected={selectedStudent?.id === student.id}
                onClick={() => handleSelectStudent(student)}
                divider
              >
                <ListItemText primary={student.user_name} />
              </ListItem>
            ))}
          </List>

          {selectedStudent && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Student Details</Typography>
              <Typography>
                <strong>Roll Number:</strong> {selectedStudent.reg_no}
              </Typography>
              <Typography>
                <strong>Department:</strong> {selectedStudent.dept}
              </Typography>
              <Typography>
                <strong>Batch Year:</strong> {selectedStudent.end_year}
              </Typography>

              {/* Show rejection reason if student rejected */}
              {selectedStudent.reg_status === 'rejected' && selectedStudent.reg_rej_reason && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="error">
                    Rejection Reason:
                  </Typography>
                  <Typography color="error">{selectedStudent.reg_rej_reason}</Typography>
                </>
              )}

              {/* Approve/Reject buttons only if pending */}
              {selectedStudent.reg_status === 'pending' && (
                <>
                  <Divider sx={{ my: 2 }} />

                  {!showRejectionInput ? (
                    <div style={{ display: 'flex', gap: 16 }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleApprove(selectedStudent)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => setShowRejectionInput(true)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Rejection Reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <Button variant="contained" color="error" onClick={handleReject}>
                          Submit Rejection
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setShowRejectionInput(false);
                            setRejectionReason('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} variant="outlined" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RegistrationApprovals;
