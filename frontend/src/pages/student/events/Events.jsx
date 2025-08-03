import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
} from "@mui/material";
import "../Events/events.css";

const columns = [
  { id: "event_id", label: "Event ID", minWidth: 100 },
  { id: "reg_button", label: "Registration", minWidth: 100 },
  { id: "event_name", label: "Event Name", minWidth: 200 },
  { id: "category", label: "Category", minWidth: 150 },
  { id: "event_type", label: "Event Type", minWidth: 150 },
  { id: "eligible_dept", label: "Eligible Departments", minWidth: 150 },
  { id: "start_date", label: "Start Date", minWidth: 150 },
  { id: "end_date", label: "End Date", minWidth: 150 },
  { id: "location", label: "Location", minWidth: 180 },
  { id: "website_link", label: "Website URL", minWidth: 150 },
  { id: "mode", label: "Mode of Event", minWidth: 100 },
  { id: "organization", label: "Conducted by", minWidth: 180 },
  { id: "max_count", label: "Max Count", minWidth: 150 },
  { id: "accepted_count", label: "Accepted Count", minWidth: 150 },
  { id: "balance_count", label: "Pending Count", minWidth: 150 },
];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [newEvent, setNewEvent] = useState({
    event_name: "",
    category: "",
    start_date: "",
    end_date: "",
    location: "",
    website_link: "",
    mode: "",
    organization: "",
  });
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [blockRegistration, setBlockRegistration] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  // Team registration state - initially 3 members
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState([
    { name: "", rollNo: "" },
    { name: "", rollNo: "" },
    { name: "", rollNo: "" },
  ]);

  // Fetch approved events
  const fetchApprovedEvents = () => {
    setLoading(true);
    axios
      .get("http://localhost:7000/fetch-approved-events")
      .then((response) => {
        setEvents(response.data);
        setFilteredEvents(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching approved events:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApprovedEvents();
    const interval = setInterval(fetchApprovedEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch registered events for current user
  useEffect(() => {
    const email = localStorage.getItem("email");
    axios
      .get(`http://localhost:7000/get-registered-events/${email}`)
      .then((res) => {
        setRegisteredEventIds(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = events.filter((event) =>
      event.event_name.toLowerCase().includes(query)
    );
    setFilteredEvents(filtered);
    setPage(0);
  };

  const handleClose = () => {
    setNewEvent({
      event_name: "",
      category: "",
      start_date: "",
      end_date: "",
      location: "",
      website_link: "",
      mode: "",
      organization: "",
    });
    setOpen(false);
  };

  const handleInputChange = (event) => {
    setNewEvent({ ...newEvent, [event.target.name]: event.target.value });
  };

  function getCurrentTime() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offsetMs);
    return localTime.toISOString().slice(0, 19).replace("T", " ");
  }

  const handleAddEvent = () => {
    const email = localStorage.getItem("email");
    const now = getCurrentTime();
    const eventData = {
      ...newEvent,
      event_created_by: email,
      event_created_at: now,
    };

    axios
      .post("http://localhost:7000/submit-for-approval", eventData)
      .then(() => {
        setSnackbarMessage("Event submitted for approval!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        handleClose();
      })
      .catch(() => {
        setSnackbarMessage("Failed to submit event.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });
  };

  const handleRegisterClick = (event) => {
    const email = localStorage.getItem("email");
    axios
      .get(`http://localhost:7000/get-registration-info/${email}`)
      .then((res) => {
        setStudentDetails(res.data);
        setSelectedEvent(event);

        if (event.event_type === "Team") {
          setTeamName("");
          setTeamMembers([
            { name: res.data.user_name || "", rollNo: res.data.reg_no || "" }, // pre-fill first member
            { name: "", rollNo: "" },
            { name: "", rollNo: "" },
          ]);
        } else {
          setTeamName("");
          setTeamMembers([
            { name: "", rollNo: "" },
            { name: "", rollNo: "" },
            { name: "", rollNo: "" },
          ]);
        }

        setRegisterModalOpen(true);
      })
      .catch((err) => {
        console.error("Failed to fetch student details:", err);
      });
  };

  const handleConfirmRegister = () => {
    if (!studentDetails || !selectedEvent) return;

    if (selectedEvent.event_type === "Team") {
      if (!teamName.trim()) {
        setSnackbarMessage("Please enter a team name.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
      // Check first 3 members for mandatory inputs
      for (let i = 0; i < 3; i++) {
        if (
          !teamMembers[i] ||
          !teamMembers[i].name.trim() ||
          !teamMembers[i].rollNo.trim()
        ) {
          setSnackbarMessage(
            `Please fill the name and roll number for member ${i + 1}.`
          );
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          return;
        }
      }
    }

    // Prevent duplicate registration
    if (registeredEventIds.includes(selectedEvent.event_id)) {
      setSnackbarMessage("You have already registered for this event!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setRegisterModalOpen(false);
      return;
    }

    // Check event capacity
    if (
      selectedEvent.accepted_count >= selectedEvent.max_count ||
      selectedEvent.balance_count === 0
    ) {
      setSnackbarMessage("This event is already full!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setRegisterModalOpen(false);
      return;
    }

    // Check event start date
    const now = new Date();
    const eventStartDate = new Date(selectedEvent.start_date);
    if (eventStartDate < now) {
      setSnackbarMessage("Cannot register for past events.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setRegisterModalOpen(false);
      return;
    }

    const formatDateTime = (date) => {
      const pad = (n) => n.toString().padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
      )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
      )}`;
    };

    let regData = {};
    let apiUrl = "";
    if (selectedEvent.event_type === "Team") {
      // Only include members with both name and rollNo filled
      const filteredMembers = teamMembers.filter(
        (m) => m.name.trim() && m.rollNo.trim()
      );
      regData = {
        team_name: teamName.trim(),
        members: filteredMembers.map((m) => ({
          name: m.name.trim(),
          roll_no: m.rollNo.trim(),
        })),
        event_id: selectedEvent.event_id,
        status: "pending",
        registered_at: formatDateTime(new Date()),
        registered_by: studentDetails.reg_no,
      };
      apiUrl = "http://localhost:7000/register-team-event";
    } else {
      regData = {
        student_id: studentDetails.reg_no,
        event_id: selectedEvent.event_id,
        status: "pending",
        registered_at: formatDateTime(new Date()),
      };
      apiUrl = "http://localhost:7000/register-event";
    }

    axios
      .post(apiUrl, regData)
      .then(() => {
        setSnackbarMessage("Successfully registered for the event!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setRegisterModalOpen(false);
        setRegisteredEventIds((prev) => [...prev, selectedEvent.event_id]);

        // Update counts locally
        const updatedEvents = events.map((event) => {
          if (event.event_id === selectedEvent.event_id) {
            return {
              ...event,
              accepted_count: event.accepted_count + 1,
              balance_count: Math.max(0, event.balance_count - 1),
            };
          }
          return event;
        });
        setEvents(updatedEvents);
        setFilteredEvents(updatedEvents);
        fetchApprovedEvents();
      })
      .catch((error) => {
        let errorMessage = "Failed to register for the event.";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        if (errorMessage.includes("Date overlap")) {
          setRegisterModalOpen(false);
        }
      });
  };

  useEffect(() => {
    const checkBlock = async () => {
      if (!studentDetails) return;
      try {
        const res = await axios.get(
          `http://localhost:7000/api/registration-block-status/${studentDetails.reg_no}`
        );
        setBlockRegistration(res.data.blocked);
        setBlockMessage(res.data.message || "");
      } catch {
        setBlockRegistration(false);
        setBlockMessage("");
      }
    };
    checkBlock();
  }, [studentDetails, events]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <main className="main-content">
      <div className="eventspage">
        <div className="searchNaddd">
          <div className="searchbar">
            <TextField
              label="Search by Event Name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <button onClick={() => setOpen(true)} className="addeventbtn">
            Add Event
          </button>
        </div>

        {blockRegistration && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {blockMessage ||
              "You are blocked from registering for new events due to pending event summaries."}
          </Alert>
        )}

        {/* Add Event Modal */}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogContent>
            {Object.keys(newEvent).map((key, index) => (
              <TextField
                key={key}
                name={key}
                label={key.replace("_", " ").toUpperCase()}
                fullWidth
                margin="dense"
                type={key.includes("date") ? "date" : "text"}
                value={newEvent[key]}
                onChange={handleInputChange}
                autoFocus={index === 0}
                InputLabelProps={key.includes("date") ? { shrink: true } : {}}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleAddEvent} color="primary">
              Submit for Approval
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Register Modal */}
        <Dialog open={registerModalOpen} onClose={() => setRegisterModalOpen(false)}>
          <DialogTitle>Register for Event</DialogTitle>
          <DialogContent dividers>
            {studentDetails && selectedEvent && (
              <div style={{ minWidth: 340 }}>
                {/* Event Details */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 600,
                    color: "#8013bd",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ marginRight: 8 }}>🏷️</span> Event Details
                </div>
                <div
                  style={{
                    background: "#f9f9f9",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 8,
                    border: "1px solid #e3e3e3",
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#888" }}>Event ID:</span>{" "}
                    <b>#{selectedEvent.event_id}</b>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#888" }}>Event Name:</span>{" "}
                    <b>{selectedEvent.event_name}</b>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#888" }}>Category:</span>
                    <span
                      style={{
                        background: "#f5ecfe",
                        color: "#8013bd",
                        borderRadius: 12,
                        padding: "2px 12px",
                        fontSize: "0.9em",
                        marginLeft: 8,
                      }}
                    >
                      {selectedEvent.category}
                    </span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#888" }}>Start Date:</span>
                    <span style={{ marginLeft: 8, color: "#1976d2" }}>🕒</span>
                    <b>{selectedEvent.start_date?.split("T")[0]}</b>
                  </div>
                  <div>
                    <span style={{ color: "#888" }}>End Date:</span>
                    <span style={{ marginLeft: 8, color: "#1976d2" }}>🕒</span>
                    <b>{selectedEvent.end_date?.split("T")[0]}</b>
                  </div>
                </div>

                {/* Team Registration Form */}
                {selectedEvent.event_type === "Team" ? (
                  <div>
                    <TextField
                      fullWidth
                      margin="dense"
                      label="Team Name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                      sx={{ mb: 2 }}
                    />
                    {teamMembers.map((member, index) => (
                      <div key={index} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        <TextField
                          label={`Member ${index + 1} Name`}
                          value={member.name}
                          onChange={(e) => {
                            const newMembers = [...teamMembers];
                            newMembers[index].name = e.target.value;
                            setTeamMembers(newMembers);
                          }}
                          required={index < 3}
                          fullWidth
                        />
                        <TextField
                          label={`Member ${index + 1} Roll Number`}
                          value={member.rollNo}
                          onChange={(e) => {
                            const newMembers = [...teamMembers];
                            newMembers[index].rollNo = e.target.value;
                            setTeamMembers(newMembers);
                          }}
                          required={index < 3}
                          fullWidth
                        />
                      </div>
                    ))}
                    {teamMembers.length < 5 && (
                      <Button
                        variant="outlined"
                        onClick={() => setTeamMembers([...teamMembers, { name: "", rollNo: "" }])}
                        sx={{ mb: 2 }}
                      >
                        Add More Members
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <p>Registering as Individual participant.</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "flex-end", gap: 2 }}>
            <Button
              onClick={() => setRegisterModalOpen(false)}
              style={{ background: "#f5ecfe", color: "#8013bd", width: "50%" }}
              sx={{ fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRegister}
              style={{ background: "#f5ecfe", color: "#8013bd", width: "50%" }}
              sx={{ fontWeight: 600 }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Events Table */}
        <Paper sx={{ width: "100%", overflow: "auto" }}>
          <TableContainer
            className="responsive-table-wrapper"
            sx={{ maxHeight: "70vh", overflowX: "auto" }}
          >
            <div style={{ width: "max-content" }}>
              <Table stickyHeader sx={{ maxWidth: 1400 }}>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell key={column.id} style={{ minWidth: column.minWidth }}>
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEvents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((event) => {
                      const eventStartDate = new Date(event.start_date);
                      eventStartDate.setHours(0, 0, 0, 0);
                      const isPastEvent = eventStartDate < today;
                      const isFull =
                        event.balance_count === 0 || event.accepted_count >= event.max_count;

                      return (
                        <TableRow hover role="checkbox" tabIndex={-1} key={event.event_id}>
                          <TableCell>{event.event_id}</TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              disabled={
                                isPastEvent ||
                                isFull ||
                                blockRegistration ||
                                registeredEventIds.includes(event.event_id)
                              }
                              onClick={() => {
                                if (isPastEvent) return;
                                if (isFull) {
                                  alert("Max count reached, you can't register for this event.");
                                  return;
                                }
                                handleRegisterClick(event);
                              }}
                              style={{
                                background: isPastEvent || isFull ? "#ffeaea" : "#f5ecfe",
                                color: isPastEvent || isFull ? "#d32f2f" : "#8013bd",
                                cursor: isPastEvent || isFull ? "not-allowed" : "pointer",
                                fontWeight: 550,
                                minWidth: 130,
                                fontSize: "0.95rem",
                                padding: "8px 16px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isPastEvent
                                ? "Not Active"
                                : isFull
                                ? "Full"
                                : registeredEventIds.includes(event.event_id)
                                ? "Registered"
                                : "Register"}
                            </Button>
                          </TableCell>
                          <TableCell>{event.event_name}</TableCell>
                          <TableCell>{event.category}</TableCell>
                          <TableCell>{event.event_type}</TableCell>
                          <TableCell>{event.eligible_dept}</TableCell>
                          <TableCell>{event.start_date?.split("T")[0]}</TableCell>
                          <TableCell>{event.end_date?.split("T")[0]}</TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell>
                            {event.website_link ? (
                              <a
                                href={event.website_link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Link
                              </a>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{event.mode}</TableCell>
                          <TableCell>{event.organization}</TableCell>
                          <TableCell>{event.max_count}</TableCell>
                          <TableCell>{event.accepted_count}</TableCell>
                          <TableCell>{event.balance_count}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredEvents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </div>
    </main>
  );
};

export default Events;
