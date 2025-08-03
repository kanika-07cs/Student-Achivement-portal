import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  TextField,
  IconButton
} from '@mui/material';
import axios from 'axios';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import '../eventSummary/eventSummary.css';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import { Paper, Grid } from '@mui/material';

const EventSummary = () => {
  const [showModal, setShowModal] = useState(false);
  const [eventHistory, setEventHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState([]);
  const [formData, setFormData] = useState({
    s_reg_no: '',
    stud_name: '',
    start_year: '',
    end_year: '',
    event_id: '',
    category: '',
    event_name: '',
    e_organisers: '',
    start_date: '',
    end_date: ''
  });
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState('');

  const email = localStorage.getItem('email');

  // Load student data and event information
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get student details
        const studentRes = await fetch(`http://localhost:7000/student-details/${email}`);
        const studentData = await studentRes.json();
        if (studentRes.ok) {
          setFormData(prev => ({
            ...prev,
            s_reg_no: studentData.reg_no,
            stud_name: studentData.user_name || studentData.name || '',
            start_year: studentData.start_year || '',
            end_year: studentData.end_year || ''
          }));

          // Fetch event history
          await fetchEventHistory(studentData.reg_no);

          // Fetch notifications (approved registrations)
          const notifRes = await fetch(`http://localhost:7000/summary-notifications/${studentData.reg_no}`);
          const notifData = await notifRes.json();
          if (notifRes.ok) setNotifications(notifData);

          // Fetch all approved event registrations for this student
          const regRes = await fetch(`http://localhost:7000/fetch-registrations-student?reg_no=${studentData.reg_no}`);
          const regData = await regRes.json();
          if (regRes.ok) {
            // Only keep those with reg_status === 'approved'
            setApprovedRegistrations(regData.filter(r => r.reg_status === 'approved'));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    if (email) loadData();
    // eslint-disable-next-line
  }, [email]);

  function getTodayIST() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + (istOffset - now.getTimezoneOffset() * 60 * 1000));
  }

  function toMidnightIST(dateStr) {
    const date = new Date(dateStr);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    return new Date(Date.UTC(year, month, day, 0, 0, 0) + istOffsetMs);
  }

  // Fetch event history
  const fetchEventHistory = async (regNo) => {
    try {
      const res = await fetch(`http://localhost:7000/event-history/${regNo}`);
      const data = await res.json();
      if (res.ok) setEventHistory(data);
    } catch (error) {
      console.error('Error fetching event history:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Set of event_ids for which summary is already submitted
  const submittedEventIds = new Set(eventHistory.map(e => parseInt(e.event_id)));
  
  // Only show events with approved registration and no summary yet
  const eventsNeedingSummary = approvedRegistrations.filter(
    reg => !submittedEventIds.has(parseInt(reg.event_id))
  );

  // Handle event selection for summary submission
  const handleEventSelect = async (eventId) => {
    try {
      // Only allow selection if event is in eventsNeedingSummary
      const reg = eventsNeedingSummary.find(e => String(e.event_id) === String(eventId));
      if (!reg) {
        alert('You can only add summary for events where your registration is approved and not yet submitted.');
        return;
      }
      // Fetch event details (will only return if approved)
      const response = await axios.get(`http://localhost:7000/events/${eventId}`);
      if (response.status === 200 && response.data) {
        const eventData = response.data;
        setFormData(prev => ({
          ...prev,
          event_id: eventId,
          category: eventData.category || '',
          event_name: eventData.event_name || '',
          e_organisers: eventData.organization || '',
          start_date: formatDate(eventData.start_date) || '',
          end_date: formatDate(eventData.end_date) || '',
        }));
        setShowModal(true);
      }
    } catch (error) {
      alert('Event is not approved or not found.');
      console.error('Error fetching event details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });
    formDataToSend.append('description', description);
    if (image) formDataToSend.append('image', image);
    formDataToSend.append('status', 'pending');

    try {
      const res = await axios.post('http://localhost:7000/submit-in-eventhistory',
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.status === 201) {
        alert('Event summary submitted successfully!');
        await fetchEventHistory(formData.s_reg_no);
        // Also refresh notifications
        const notifRes = await fetch(`http://localhost:7000/summary-notifications/${formData.s_reg_no}`);
        const notifData = await notifRes.json();
        setNotifications(notifData);
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error submitting event summary:', error);
      alert('Failed to submit event summary');
    }
  };

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      event_id: '',
      category: '',
      event_name: '',
      e_organisers: '',
      start_date: '',
      end_date: ''
    }));
    setDescription('');
    setImage(null);
    setFileName('');
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'approved': return <Chip label="Approved" color="success" size="small" />;
      case 'rejected': return <Chip label="Rejected" color="error" size="small" />;
      default: return <Chip label="Pending" color="warning" size="small" />;
    }
  };

  // Notification logic
  const pendingNotifications = notifications.filter(
  notif => !submittedEventIds.has(parseInt(notif.event_id))
);
  const notificationMessages = pendingNotifications
    .map(({ end_date, event_name }) => {
      if (!end_date) return null;
      const msInDay = 24 * 60 * 60 * 1000;
      const endDateIST = toMidnightIST(end_date);
      const todayIST = getTodayIST();
      const todayMidnightIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());
      const daysPassed = Math.floor((todayMidnightIST - endDateIST) / msInDay);

      if (daysPassed >= 0 && daysPassed < 3) {
        const daysLeft = 3 - daysPassed;
        return `${daysLeft} day${daysLeft > 1 ? 's' : ''} left to upload event summary for ${event_name}`;
      } else if (daysPassed === 3) {
        return `Today is the last day to upload event summary for ${event_name}`;
      }
      return null;
    })
    .filter(Boolean);

  return (
    <div className="eventsummarypage">
      {/* Notification for events needing summary */}
      <div className="searchNadd">
        {/* Search and Add button */}
        <div className="search-add-wrapper">
          <input
            type="text"
            placeholder="    Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {/* Only enable Add button if there are events needing summary */}
          <button
            onClick={() => setShowModal(true)}
            className='add-btn'
            disabled={eventsNeedingSummary.length === 0}
          >
            Add Event Summary
          </button>
        </div>
      </div>

      {/* Event summaries list */}
      <div className="all-events-box">
        <h3>Notifications:</h3>
        {notificationMessages.length === 0 ? (
          <Typography variant="body2" color="textSecondary">No notifications.</Typography>
        ) : (
          <ul>
            {notificationMessages.map((msg, idx) => (
              <li key={idx} style={{ color: "#e67e22", fontWeight: 500 }}>{msg}</li>
            ))}
          </ul>
        )}
        <Typography variant="h6" gutterBottom><br />
          ALL EVENT SUMMARIES ({eventHistory.length})
        </Typography>
        <div className="grid-two-columns">
          {eventHistory
            .filter(event =>
              event.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              event.category?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(event => (
              <Card
                key={event.id || `${event.s_reg_no}_${event.event_id}`}
                onClick={() => setSelectedEvent(event)}
                className="event-card"
              >
                <CardContent>
                  <Typography variant="subtitle1">{event.event_name}</Typography>
                  <Typography variant="body2">Category: {event.category}</Typography>
                  <Typography variant="caption">Date: {formatDate(event.start_date)}</Typography>
                  <Box mt={1}>{getStatusChip(event.status)}</Box>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedEvent.event_name}
            <Box mt={1}>{getStatusChip(selectedEvent.status)}</Box>
          </DialogTitle>

          <DialogContent dividers sx={{ background: "#f8f9fa" }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, background: "white", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Event Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="flex-start" mb={2}>
                    <CategoryIcon sx={{ mr: 1.5, mt: 0.5, color: "black" }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                      <Typography sx={{ fontWeight: 500 }}>{selectedEvent.category}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="flex-start">
                    <BusinessIcon sx={{ mr: 1.5, mt: 0.5, color: "black" }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Organizers</Typography>
                      <Typography sx={{ fontWeight: 500 }}>{selectedEvent.e_organisers}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="flex-start" mb={2}>
                    <CalendarMonthIcon sx={{ mr: 1.5, mt: 0.5, color: "black" }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Dates</Typography>
                      <Typography sx={{ fontWeight: 500 }}>
                        {new Date(selectedEvent.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} – {new Date(selectedEvent.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({Math.round((new Date(selectedEvent.end_date) - new Date(selectedEvent.start_date)) / (1000 * 60 * 60 * 24)) + 1} days)
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="flex-start">
                    <DescriptionIcon sx={{ mr: 1.5, mt: 0.5, color: "black" }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      <Typography sx={{ fontWeight: 500 }}>{selectedEvent.description}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              {selectedEvent.image && (
                <Box mt={3} textAlign="center" >
                  <Box><Typography variant="subtitle2" color="text.secondary" gutterBottom align="left">
                    <FolderSharedIcon sx={{ mr: 1.5, mt: 0.5, color: "black" }} />Submitted Proof:
                  </Typography></Box>
                  <Box
                    component="img"
                    src={`http://localhost:7000/${selectedEvent.image}`}
                    alt="Event proof"
                    sx={{
                      width: '100%',
                      objectFit: 'contain',
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  />
                </Box>
              )}
              {selectedEvent.status === 'rejected' && selectedEvent.rejection_reason && (
                <Box
                  mt={3}
                  sx={{
                    backgroundColor: '#fdecea',
                    borderLeft: '4px solid #e74c3c',
                    p: 2,
                    borderRadius: 1,
                    color: '#c0392b',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                  }}
                >
                  <Typography variant="h6" color="error" sx={{ mb: 1 }}>
                    Rejection Reason
                  </Typography>
                  <Typography>{selectedEvent.rejection_reason}</Typography>
                </Box>
              )}
            </Paper>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1.5 }}>
            <Button onClick={() => setSelectedEvent(null)} color="primary" variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Add Event Summary Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Add Event Summary</h2>
            <form onSubmit={handleSubmit}>
              {/* Student Info (read-only) */}
              <TextField
                label="Registration Number"
                value={formData.s_reg_no}
                InputProps={{ readOnly: true }}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Student Name"
                value={formData.stud_name}
                InputProps={{ readOnly: true }}
                fullWidth
                margin="normal"
              />
              {/* Event Selection Dropdown */}
              <TextField
                select
                
                value={formData.event_id}
                onChange={(e) => handleEventSelect(e.target.value)}
                fullWidth
                margin="normal"
                SelectProps={{
                  native: true
                }}
                required
              >
                <option value="">-- Select Event --</option>
                {eventsNeedingSummary.map(ev => (
                  <option key={ev.event_id} value={ev.event_id}>
                    {ev.event_name} ({ev.category})
                  </option>
                ))}
              </TextField>
              <TextField
                label="Event Name"
                value={formData.event_name}
                InputProps={{ readOnly: true }}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Category"
                value={formData.category}
                InputProps={{ readOnly: true }}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Dates"
                value={`${formData.start_date} to ${formData.end_date}`}
                InputProps={{ readOnly: true }}
                fullWidth
                margin="normal"
              />
              {/* Description */}
              <TextField
                label="Description"
                multiline
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                margin="normal"
                required
              />
              {/* Image Upload */}
              <Box mt={2}>
                <input
                  accept="image/*"
                  id="event-proof-upload"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setImage(e.target.files[0]);
                      setFileName(e.target.files[0].name);
                    }
                  }}
                />
                <label htmlFor="event-proof-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Proof
                  </Button>
                </label>
                {fileName && (
                  <Box ml={2} display="inline">
                    {fileName}
                    <IconButton
                      size="small"
                      onClick={() => {
                        setImage(null);
                        setFileName('');
                      }}
                    >
                      ×
                    </IconButton>
                  </Box>
                )}
              </Box>
              {/* Form Actions */}
              <div className="modal-buttons">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Submit
                </Button>
                <Button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  variant="outlined"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSummary;
