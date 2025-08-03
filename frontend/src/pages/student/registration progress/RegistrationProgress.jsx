// registrationProgress.jsx
import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Divider
} from '@mui/material';
import axios from 'axios';
import './registrationProgress.css';

const RegistrationProgress = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleOpenModal = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label="Pending" color="warning" size="small" />;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const r = localStorage.getItem("reg_no");
      if (!r) return alert("Registration number not found in localStorage");

      try {
        const response = await axios.get(`http://localhost:7000/fetch-registrations-student?reg_no=${r}`);
        setAllEvents(response.data);
      } catch (error) {
        console.error('Error fetching registration data:', {
          message: error.message,
          response: error.response?.data
        });
        alert('Failed to load data. Please check console for details.');
      }
    };

    fetchData();
  }, []);

  // Cancel Event Handler
  const handleCancelEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to cancel this event?")) return;
    try {
      // Adjust endpoint as per your backend API
      await axios.delete(
        `http://localhost:7000/delete-registration?event_id=${eventId}&reg_no=${selectedEvent.reg_no}`
      );
      // Remove the cancelled event from the UI
      setAllEvents(prev => prev.filter(ev => ev.event_id !== eventId));
      setModalOpen(false);
    } catch (err) {
      alert("Failed to cancel event. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="registration-container">
      <div className="all-events-box" style={{ padding: '15px', borderRadius: '8px' }}>
        <Typography variant="h6" gutterBottom>ALL REGISTRATION EVENTS ({allEvents.length})</Typography>
        <div className="grid-two-columns" style={{ maxHeight: '600px', overflowY: 'auto', marginTop: '10px' }}>
          {allEvents.map(event => (
            <Card
              key={event.event_id}
              onClick={() => handleOpenModal(event)}
              style={{ marginBottom: '10px', cursor: 'pointer' }}
            >
              <CardContent>
                <Typography variant="subtitle1">{event.event_name}</Typography>
                <Typography variant="body2">Category: {event.category}</Typography>
                <Typography variant="caption" display="block">
                  Student: {event.user_name}
                </Typography>
                {getStatusChip(event.reg_status)}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>
              {selectedEvent.event_name} - {selectedEvent.category}
              <div style={{ marginTop: '8px' }}>
                {getStatusChip(selectedEvent.reg_status)}
              </div>
            </DialogTitle>
            <DialogContent dividers>
              <div style={{ padding: '16px' }}>
                <Typography variant="h6" gutterBottom style={{ marginBottom: '16px' }}>
                  Student Details
                </Typography>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <Typography variant="subtitle2">Name</Typography>
                    <Typography>{selectedEvent.user_name}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2">Registration Number</Typography>
                    <Typography>{selectedEvent.reg_no}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2">Department</Typography>
                    <Typography>{selectedEvent.dept}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2">Batch Year</Typography>
                    <Typography>{selectedEvent.end_year}</Typography>
                  </div>
                </div>

                <Divider style={{ margin: '24px 0' }} />

                <Typography variant="h6" gutterBottom style={{ marginBottom: '16px' }}>
                  Event Details
                </Typography>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <Typography variant="subtitle2">Event ID</Typography>
                    <Typography>{selectedEvent.event_id}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2">Event Name</Typography>
                    <Typography>{selectedEvent.event_name}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2">Category</Typography>
                    <Typography>{selectedEvent.category}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2">Status</Typography>
                    <Typography>{selectedEvent.reg_status}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2">Start Date</Typography>
                    <Typography>
                      {selectedEvent.start_date ? new Date(selectedEvent.start_date).toLocaleDateString() : ""}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2">End Date</Typography>
                    <Typography>
                      {selectedEvent.end_date ? new Date(selectedEvent.end_date).toLocaleDateString() : ""}
                    </Typography>
                  </div>
                </div>

                {selectedEvent.description && (
                  <>
                    <Divider style={{ margin: '24px 0' }} />
                    <Typography variant="h6" gutterBottom>Description</Typography>
                    <Typography>{selectedEvent.description}</Typography>
                  </>
                )}

                {selectedEvent.reg_status === 'rejected' && selectedEvent.reg_rej_reason && (
                  <>
                    <Divider style={{ margin: '24px 0' }} />
                    <Typography variant="h6" gutterBottom>Rejection Reason</Typography>
                    <Typography color="error" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedEvent.reg_rej_reason}
                    </Typography>
                  </>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              {/* Cancel Event button only for pending status */}
              {selectedEvent?.reg_status === 'pending' && (
                <Button
                  onClick={() => handleCancelEvent(selectedEvent.event_id)}
                  color="error"
                  variant="contained"
                >
                  Cancel Event
                </Button>
              )}
              <Button onClick={handleCloseModal} color="primary" variant="contained">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default RegistrationProgress;
