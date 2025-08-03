import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Modal,
  Typography, Box, TextField, DialogContent, DialogTitle
} from "@mui/material";
import axios from "axios";
import '../summaryApprovals/summaryApprovals.css'

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  maxHeight: '90vh',
  overflowY: 'auto',
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const SummaryApprovals = () => {
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [open, setOpen] = useState(false);
  const [showRejectField, setShowRejectField] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchPendingSummaries = async () => {
    try {
      const res = await axios.get("http://localhost:7000/fetch-pending-summaries");
      
      // Transform the response data to match expected format
      const transformedData = res.data.map(summary => ({
        id: summary.id || summary.event_history?.id, 
        event_id: summary.event_id || summary.event?.event_id || 'N/A',
        s_reg_no: summary.s_reg_no || summary.student?.reg_number || 'N/A',
        stud_name: summary.stud_name || summary.student?.name || 'N/A',
        event_name: summary.event_name || summary.event?.name || 'N/A',
        category: summary.category || summary.event?.category || 'N/A',
        start_year: summary.start_year || summary.event?.start_year || '',
        end_year: summary.end_year || summary.event?.end_year || '',
        description: summary.description || summary.event_history?.description || '',
        image: summary.image || summary.event_history?.image || '',
      }));
      

      setSummaries(transformedData);
    } catch (error) {
      console.error("Error fetching pending summaries:", error);
      // Handle error appropriately
    }
  };

  useEffect(() => {
    fetchPendingSummaries();
  }, []);

  const handleOpen = (summary) => {
    setSelectedSummary(summary);
    setOpen(true);
    setShowRejectField(false);
    setRejectionReason("");
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSummary(null);
    setShowRejectField(false);
    setRejectionReason("");
  };

  const handleApprove = async () => {
    const summary_confirmation_by = localStorage.getItem("email");
    const summary_confirmed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
    try {
      await axios.put(`http://localhost:7000/approve-summary/${selectedSummary.id}`, {
        summary_confirmation_by,
        summary_confirmed_at
      });
      fetchPendingSummaries();
      handleClose();
    } catch (error) {
      console.error("Error approving summary:", error);
    }
  };
  const handleRejectClick = () => {
    setShowRejectField(true);
  };

  const handleRejectSubmit = async () => {
    const summary_confirmation_by = localStorage.getItem("email");
    const summary_confirmed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
    try {
      await axios.put(`http://localhost:7000/reject-summary/${selectedSummary.id}`, {
        reason: rejectionReason,
        summary_confirmation_by,
        summary_confirmed_at
      });
      fetchPendingSummaries();
      handleClose();
    } catch (error) {
      console.error("Error rejecting summary:", error);
    }
  };

  return (
    <div className="summaryapprovalspage" style={{ padding: "2rem", marginTop: "1.5rem" }}>
      {summaries.length === 0 ? (
        <Typography>No pending summaries found.</Typography>
      ) : (
        <TableContainer component={Paper}className="MuiTableContainer-root">
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#7209b7' }}>
                <TableCell sx={{ color: '#fff' }}><strong>S.No</strong></TableCell>
                <TableCell sx={{ color: '#fff' }}><strong>Reg No</strong></TableCell>
                <TableCell sx={{ color: '#fff' }}><strong>Name</strong></TableCell>
                <TableCell sx={{ color: '#fff' }}><strong>Event</strong></TableCell>
                <TableCell sx={{ color: '#fff' }}><strong>Category</strong></TableCell>
                <TableCell sx={{ color: '#fff' }}><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaries.map((summary) => (
                <TableRow key={summary.id}>
                  <TableCell>{summary.id}</TableCell>
                  <TableCell>{summary.s_reg_no}</TableCell>
                  <TableCell>{summary.stud_name}</TableCell>
                  <TableCell>{summary.event_name}</TableCell>
                  <TableCell>{summary.category}</TableCell>
                  <TableCell>
                    <button
                      className='viewButton'
                      onClick={() => handleOpen(summary)}
                    >
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal to view full details and reject inline */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          {selectedSummary && (
            <>
              <DialogTitle><strong>Event Summary Details</strong></DialogTitle>
              <Box sx={{ mb: 2 }}>
              <Typography sx={{ marginLeft: "25px" }}><strong>Event ID:</strong> {selectedSummary.event_id}</Typography>
                <Typography sx={{ marginLeft: "25px", marginTop: "5px" }}><strong>Student Reg No:</strong> {selectedSummary.s_reg_no}</Typography>
                <Typography sx={{ marginLeft: "25px", marginTop: "5px" }}><strong>Student Name:</strong> {selectedSummary.stud_name}</Typography>
                <Typography sx={{ marginLeft: "25px", marginTop: "5px" }}><strong>Event Name:</strong> {selectedSummary.event_name}</Typography>
                <Typography sx={{ marginLeft: "25px", marginTop: "5px" }}><strong>Category:</strong> {selectedSummary.category}</Typography>
                <Typography sx={{ marginLeft: "25px", marginTop: "5px" }}><strong>Start Year:</strong> {selectedSummary.start_year}</Typography>
                <Typography sx={{ marginLeft: "25px", marginTop: "5px" }}><strong>End Year:</strong> {selectedSummary.end_year}</Typography>
                <Typography sx={{ marginLeft: "25px", marginTop: "5px" }}><strong>Description:</strong></Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', marginTop: "5px", marginLeft: "25px" }}>
                  {selectedSummary.description}
                </Typography>
              </Box>
              
              {selectedSummary.image && (
                <>
                  <Typography sx={{ whiteSpace: 'pre-wrap', marginTop: "5px", marginLeft: "25px" }}><strong>Image:</strong></Typography>
                  <img
                    src={`http://localhost:7000/${selectedSummary.image}`}
                    alt="Event"
                    style={{ width: "100%", marginTop: 8, borderRadius: 8 }}
                  />
                </>
              )}
              
              <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button variant="contained" color="success" onClick={handleApprove}>
                  Approve
                </Button>
                <Button variant="contained" color="error" onClick={handleRejectClick}>
                  Reject
                </Button>
                <Button variant="outlined" onClick={handleClose}>
                  Cancel
                </Button>
              </Box>

              {showRejectField && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Enter Rejection Reason:
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Write reason for rejection"
                  />
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleRejectSubmit}
                      disabled={rejectionReason.trim() === ""}
                    >
                      Submit Rejection
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default SummaryApprovals;