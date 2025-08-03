import * as React from 'react';
import axios from "axios";
import '../approvals/approvals.css';
import {
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogActions,
  DialogContent, DialogTitle, CircularProgress, Typography,
  Snackbar, Alert, TextField
} from '@mui/material';

const Approvals = () => {
  const [pendingEvents, setPendingEvents] = React.useState([]);
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  const [rejectionMode, setRejectionMode] = React.useState(false);
  const [approvalMode, setApprovalMode] = React.useState(false);
  const [editableEvent, setEditableEvent] = React.useState({});
  const [rejectionReason, setRejectionReason] = React.useState('');

  // Add Event dialog state
  const [addEventOpen, setAddEventOpen] = React.useState(false);
  const [newEvent, setNewEvent] = React.useState({
    event_id: "",
    category: "",
    event_name: "",
    start_date: "",
    end_date: "",
    location: "",
    website_link: "",
    organization: "",
    mode: "",
    event_created_by: localStorage.getItem("email") || "",
    eligible_dept: "",
    max_count: ""
  });

  React.useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = () => {
    axios.get("http://localhost:7000/fetch-pending-events")
      .then(res => {
        setPendingEvents(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load events.");
        setLoading(false);
      });
  };

  const formatKey = (key) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const openModal = (event) => {
    setSelectedEvent(event);
    setEditableEvent({ ...event, eligible_dept: event.eligible_dept || '', max_count: event.max_count || "" });
    setRejectionMode(false);
    setApprovalMode(false);
    setRejectionReason('');
    setOpen(true);
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setEditableEvent({});
    setRejectionMode(false);
    setApprovalMode(false);
    setRejectionReason('');
    setOpen(false);
  };

  const handleStatusUpdate = (id, status, rejection_reason = '') => {
    const confirmationBy = localStorage.getItem("email");
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offsetMs);
    const confirmationAt = localTime.toISOString().slice(0, 19).replace('T', ' ');

    axios.put(`http://localhost:7000/update-event-status/${id}`, {
      ...editableEvent,
      status,
      rejection_reason,
      confirmationBy,
      confirmationAt,
      eligible_dept: editableEvent.eligible_dept,
      max_count: editableEvent.max_count
    })
      .then(() => {
        setPendingEvents(prev => prev.filter(e => e.event_id !== id));
        setSnackbar({
          open: true,
          message: `Event ${status === 'approved' ? 'approved' : 'rejected'} successfully!`,
          severity: 'success'
        });
        closeModal();
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: "Failed to update event status.",
          severity: 'error'
        });
      });
  };

  const handleRejectClick = () => {
    setRejectionMode(true);
  };

  const handleConfirmReject = () => {
    if (rejectionReason.trim() === '') {
      setSnackbar({ open: true, message: 'Please enter a rejection reason.', severity: 'error' });
      return;
    }
    handleStatusUpdate(selectedEvent.event_id, 'rejected', rejectionReason);
  };

  const handleApproveClick = () => {
    setApprovalMode(true);
  };

  const handleConfirmApprove = () => {
    if (!editableEvent.eligible_dept || editableEvent.eligible_dept.trim() === '') {
      setSnackbar({ open: true, message: 'Please enter eligible departments.', severity: 'error' });
      return;
    }
    handleStatusUpdate(selectedEvent.event_id, 'approved');
  };

  const handleFieldChange = (key, value) => {
    setEditableEvent(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // --- Add Event Dialog handlers ---
  const handleAddEventOpen = () => {
    setNewEvent({
      event_id: "",
      category: "",
      event_name: "",
      start_date: "",
      end_date: "",
      location: "",
      website_link: "",
      organization: "",
      mode: "",
      event_created_by: localStorage.getItem("email") || "",
      eligible_dept: "",
      max_count: ""
    });
    setAddEventOpen(true);
  };

  const handleAddEventClose = () => {
    setAddEventOpen(false);
  };

  const handleNewEventChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEventSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...newEvent,
      event_created_by: localStorage.getItem("email") || ""
    };
    axios.post("http://localhost:7000/submit-for-approval", payload)
      .then(() => {
        setSnackbar({ open: true, message: "Event submitted for approval!", severity: "success" });
        setAddEventOpen(false);
        fetchPendingEvents();
      })
      .catch(() => {
        setSnackbar({ open: true, message: "Failed to submit event.", severity: "error" });
      });
  };

  if (loading)
    return <div style={{ textAlign: 'center', marginTop: '2rem' }}><CircularProgress /></div>;

  if (error)
    return <Typography color="error" align="center">{error}</Typography>;

  return (
    <div className='approvalspage' style={{ padding: '2rem', marginTop: "20px" }}>
      {/* Add Event Button */}
      <button
        style={{ marginBottom: '1.5rem' }}
        onClick={handleAddEventOpen} className='eventbtn'
      >
        Add Event
      </button>

      {/* Add Event Dialog */}
      <Dialog open={addEventOpen} onClose={handleAddEventClose} fullWidth>
        <DialogTitle>Add New Event</DialogTitle>
        <form onSubmit={handleAddEventSubmit}>
          <DialogContent>
            <TextField
              label="Event ID"
              name="event_id"
              value={newEvent.event_id}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Category"
              name="category"
              value={newEvent.category}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Event Name"
              name="event_name"
              value={newEvent.event_name}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Start Date"
              name="start_date"
              type="date"
              value={newEvent.start_date}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="End Date"
              name="end_date"
              type="date"
              value={newEvent.end_date}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Location"
              name="location"
              value={newEvent.location}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Website Link"
              name="website_link"
              value={newEvent.website_link}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Organization"
              name="organization"
              value={newEvent.organization}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Mode"
              name="mode"
              value={newEvent.mode}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Event Created By"
              name="event_created_by"
              value={localStorage.getItem("email") || ""}
              fullWidth
              margin="normal"
              disabled
            />
            <TextField
              label="Eligible Departments"
              name="eligible_dept"
              value={newEvent.eligible_dept}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Max Count"
              name="max_count"
              type="number"
              value={newEvent.max_count}
              onChange={handleNewEventChange}
              fullWidth
              margin="normal"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddEventClose} color="secondary">Cancel</Button>
            <Button type="submit" color="primary" variant="contained">Submit</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Table */}
      {pendingEvents.length === 0 ? (
        <Typography>No pending events.</Typography>
      ) : (
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <TableContainer component={Paper}>
            <Table className="responsive-table">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#7209b7' }}>
                  <TableCell sx={{ color: '#fff' }}><strong>Event ID</strong></TableCell>
                  <TableCell sx={{ color: '#fff' }}><strong>Event Name</strong></TableCell>
                  <TableCell sx={{ color: '#fff' }}><strong>Category</strong></TableCell>
                  <TableCell sx={{ color: '#fff' }}><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingEvents.map(event => (
                  <TableRow key={event.event_id}>
                    <TableCell>{event.event_id}</TableCell>
                    <TableCell>{event.event_name}</TableCell>
                    <TableCell>{event.category}</TableCell>
                    <TableCell>
                      <button className='viewButton' onClick={() => openModal(event)}>View</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* View/Edit Dialog */}
      <Dialog open={open} onClose={closeModal} fullWidth>
        <DialogTitle><strong>Event Details</strong></DialogTitle>
        <DialogContent dividers>
          {selectedEvent && Object.entries(editableEvent).map(([key, val]) => {
            const hiddenFields = ["status", "rejection_reason", "event_confirmation_by", "event_confirmed_at", "accepted_count", "balance_count"];
            if (hiddenFields.includes(key)) return null;

            // Show event_created_by as read-only in approval mode
            if (approvalMode && key === "event_created_by") {
              return (
                <div key={key} style={{ marginBottom: '1rem' }}>
                  <TextField
                    label={formatKey(key)}
                    fullWidth
                    value={val || ''}
                    disabled
                  />
                </div>
              );
            }

            return (
              <div key={key} style={{ marginBottom: '1rem' }}>
                {approvalMode ? (
                  <TextField
                    label={formatKey(key)}
                    fullWidth
                    type={key === "max_count" ? "number" : "text"}
                    value={val || ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                  />
                ) : (
                  <p className='modal-texts'>
                    <strong>{formatKey(key)}:</strong> {val || 'N/A'}
                  </p>
                )}
              </div>
            );
          })}

          {rejectionMode && (
            <TextField
              label="Rejection Reason"
              multiline
              rows={4}
              fullWidth
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              margin="normal"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} color="secondary">Cancel</Button>
          {rejectionMode ? (
            <Button onClick={handleConfirmReject} color="error">Confirm Reject</Button>
          ) : approvalMode ? (
            <Button onClick={handleConfirmApprove} color="primary">Confirm Approval</Button>
          ) : (
            <>
              <Button onClick={handleRejectClick} color="error">Reject</Button>
              <Button onClick={handleApproveClick} color="primary">Approve</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Approvals;
