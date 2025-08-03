const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const db = require("./src/config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


const app = express();
const PORT = 7000;


// Middleware
app.use(bodyParser.json());
app.use(cors());


app.post("/register", (req, res) => {
    const { reg_no, event_id } = req.body;

    // Check if already registered
    db.query(
        "SELECT * FROM registrations WHERE reg_no = ? AND event_id = ?",
        [reg_no, event_id],
        (err, existing) => {
            if (err) return res.status(500).json({ message: "Database error" });
            if (existing.length > 0) {
                return res.status(400).json({ message: "You have already registered for this event." });
            }

            // Check max count vs current registrations
            db.query(
                "SELECT max_count FROM events WHERE event_id = ?",
                [event_id],
                (err2, events) => {
                    if (err2) return res.status(500).json({ message: "Database error" });
                    if (events.length === 0) return res.status(404).json({ message: "Event not found" });
                    const max_count = events[0].max_count;

                    db.query(
                        "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?",
                        [event_id],
                        (err3, countResult) => {
                            if (err3) return res.status(500).json({ message: "Database error" });
                            if (countResult[0].count >= max_count) {
                                return res.status(400).json({ message: "Registration limit reached for this event." });
                            }

                            // Insert registration
                            db.query(
                                "INSERT INTO registrations (reg_no, event_id) VALUES (?, ?)",
                                [reg_no, event_id],
                                (err4) => {
                                    if (err4) return res.status(500).json({ message: "Internal server error." });
                                    res.status(200).json({ message: "Registered successfully." });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});


const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}








// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
//app.use('/uploads', express.static('uploads'));
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));








// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });






// Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT role FROM login_info WHERE mail_id = ? AND password = ?";
    db.query(query, [email, password], (err, result) => {
        if (err) return res.status(500).json({ error: "Database query failed" });
        if (result.length === 0) return res.status(404).json({ error: "Invalid credentials" });
        res.status(200).json({ role: result[0].role });
    });
});








// Fetch student details
app.get("/student-details/:email", (req, res) => {
    const { email } = req.params;
    const query = "SELECT reg_no, user_name, start_year, end_year FROM student WHERE mail = ?";
    db.query(query, [email], (err, result) => {
        if (err) return res.status(500).json({ error: "Database query failed" });
        if (result.length === 0) return res.status(404).json({ error: "Student not found" });
        res.status(200).json(result[0]);
    });
});

app.get('/get-registered-events/:email', (req, res) => {
  const email = req.params.email;

  // Assuming you join event_registrations and student table
  const query = `
    SELECT er.*, e.event_name
    FROM event_registrations er
    JOIN student s ON er.reg_no = s.reg_no
    JOIN events e ON er.event_id = e.event_id
    WHERE s.mail = ?
  `;

  db.query(query, [email], (err, result) => {
    if (err) {
      console.error("Error fetching registered events:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(result);
  });
});

app.get('/get-registered-events/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const results = await db.query(
      'SELECT * FROM event_registrations WHERE reg_no = ?', [email]
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


app.get('/get-registration-info/:email', (req, res) => {
  const email = req.params.email;




  const query = "SELECT user_name, reg_no, dept, end_year FROM student WHERE mail = ?";
  db.query(query, [email], (err, result) => {
    if (err) {
      console.error("Error fetching registration info:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(result[0]);
  });
});




app.post('/register-event', (req, res) => {
  const { student_id, event_id, status, registered_at } = req.body;

  // First check if the event exists and get its dates
  db.query(
    'SELECT max_count, accepted_count, start_date, end_date FROM events WHERE event_id = ?',
    [event_id],
    (err, eventResults) => {
      if (err) {
        console.error('DB error on fetching event:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (!eventResults || eventResults.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const { max_count, accepted_count, start_date, end_date } = eventResults[0];

      // Prevent registration if event start_date is before today
      const eventStart = new Date(start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to midnight for date-only comparison
      eventStart.setHours(0, 0, 0, 0);
      if (eventStart < today) {
        return res.status(400).json({ message: 'Registration closed: Event has already started.' });
      }

      // Check if already registered for this specific event
      db.query(
        'SELECT * FROM event_registrations WHERE event_id = ? AND reg_no = ?',
        [event_id, student_id],
        (err, results) => {
          if (err) {
            console.error('DB error on checking registration:', err);
            return res.status(500).json({ message: 'Database error' });
          }

          if (results.length > 0) {
            return res.status(400).json({ message: 'Already registered for this event' });
          }

          // Check for date overlaps with other registered events
          const dateOverlapQuery = `
            SELECT e.event_name, DATE_FORMAT(e.start_date, '%Y-%m-%d') as formatted_start_date,
                   DATE_FORMAT(e.end_date, '%Y-%m-%d') as formatted_end_date
            FROM event_registrations er
            JOIN events e ON er.event_id = e.event_id
            WHERE er.reg_no = ?
            AND (
              (e.start_date BETWEEN ? AND ?) OR
              (e.end_date BETWEEN ? AND ?) OR
              (e.start_date <= ? AND e.end_date >= ?)
            )`;

          db.query(
            dateOverlapQuery,
            [student_id, start_date, end_date, start_date, end_date, start_date, end_date],
            (err, overlapResults) => {
              if (err) {
                console.error('DB error on checking date overlaps:', err);
                return res.status(500).json({ message: 'Database error' });
              }

              if (overlapResults.length > 0) {
                const overlappingEvent = overlapResults[0];
                return res.status(400).json({
                  message: `Cannot register: Date overlap with event "${overlappingEvent.event_name}" (${overlappingEvent.formatted_start_date} to ${overlappingEvent.formatted_end_date})`
                });
              }

              if (accepted_count >= max_count) {
                return res.status(400).json({ message: 'Event is full' });
              }

              // Register the student for the event
              db.query(
                'INSERT INTO event_registrations (event_id, reg_no, reg_status, registration_time) VALUES (?, ?, ?, ?)',
                [event_id, student_id, status, registered_at],
                (err) => {
                  if (err) {
                    console.error('DB error on registration:', err);
                    return res.status(500).json({ message: 'Database error' });
                  }

                  // Update the accepted count
                  db.query(
                    'UPDATE events SET accepted_count = accepted_count + 1, balance_count = balance_count - 1 WHERE event_id = ?',
                    [event_id],
                    (err) => {
                      if (err) {
                        console.error('DB error on updating count:', err);
                        return res.status(500).json({ message: 'Database error' });
                      }
                      res.status(200).json({ message: 'Successfully registered for the event' });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Register team event
app.post('/register-team-event', (req, res) => {
  const { team_name, members } = req.body;

  if (!team_name || !Array.isArray(members) || members.length < 3) {
    return res.status(400).json({ message: "Team name and at least 3 members required" });
  }

  let normalizedMembers = [];
  for (let i = 0; i < 5; i++) {
    if (members[i]) {
      normalizedMembers.push(members[i]);
    } else {
      normalizedMembers.push({ name: "", roll_no: "" });
    }
  }

  const sql = `
    INSERT INTO team_registration
      (team_name, 
       member1_name, member1_roll, 
       member2_name, member2_roll, 
       member3_name, member3_roll,
       member4_name, member4_roll,
       member5_name, member5_roll)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    team_name,
    normalizedMembers[0].name, normalizedMembers[0].roll_no,
    normalizedMembers[1].name, normalizedMembers[1].roll_no,
    normalizedMembers[2].name, normalizedMembers[2].roll_no,
    normalizedMembers[3].name, normalizedMembers[3].roll_no,
    normalizedMembers[4].name, normalizedMembers[4].roll_no,
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error inserting team registration:", err);
      return res.status(500).json({ message: "Failed to register team" });
    }
    res.status(200).json({ message: "Team registered successfully", team_id: result.insertId });
  });
});


// Add this to server.js
app.get('/api/registration-block-status/:reg_no', async (req, res) => {
  const reg_no = req.params.reg_no;
  const now = new Date();

  db.query(
    `SELECT re.event_id, e.end_date, e.event_name
     FROM registered_events re
     JOIN events e ON re.event_id = e.event_id
     WHERE re.reg_no = ? AND re.reg_status = 'approved'`,
    [reg_no],
    (err, rows) => {
      if (err) return res.json({ blocked: false });

      if (!rows.length) return res.json({ blocked: false });

      const checkSummary = (row, cb) => {
        const eventEnd = new Date(row.end_date);
        const diffDays = Math.floor((now - eventEnd) / (1000 * 60 * 60 * 24));
        if (diffDays > 3) {
          db.get(
            'SELECT * FROM event_history WHERE s_reg_no = ? AND event_id = ?',
            [reg_no, row.event_id],
            (err, summaryRow) => {
              if (err) cb(false, row.event_name);
              else cb(!!summaryRow, row.event_name);
            }
          );
        } else cb(true, row.event_name);
      };

      let checked = 0, blocked = false, blockEvent = '';
      rows.forEach(row => {
        checkSummary(row, (hasSummary, eventName) => {
          checked++;
          if (!hasSummary && !blocked) {
            blocked = true;
            blockEvent = eventName;
          }
          if (checked === rows.length) {
            if (blocked) {
              res.json({
                blocked: true,
                message: `You have pending event summary for "${blockEvent}". Please submit before registering for new events.`
              });
            } else {
              res.json({ blocked: false });
            }
          }
        });
      });
    }
  );
});




app.get("/fetch-registrations-admin", (req, res) => {
  db.query("SELECT * FROM event_registrations,student,events where event_registrations.event_id=events.event_id and event_registrations.reg_no=student.reg_no", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.status(200).json(results);
  });
});
app.get("/fetch-registrations-student", (req, res) => {
  const reg_no = req.query.reg_no;
  if (!reg_no) return res.status(400).json({ message: "Missing reg_no parameter" });




  const sql = `
    SELECT * FROM event_registrations
    JOIN student ON event_registrations.reg_no = student.reg_no
    JOIN events ON event_registrations.event_id = events.event_id
    WHERE student.reg_no = ?
  `;




  db.query(sql, [reg_no], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.status(200).json(results);
  });
});


 
app.post('/approve-registration', (req, res) => {
  const { id, confirmed_by } = req.body;




  // First, approve the registration
  const approveQuery = `
    UPDATE event_registrations
    SET reg_status = 'approved',
        reg_rej_reason = NULL,
        reg_confirmation_by = ?,
        reg_confirmed_at = NOW()
    WHERE id = ?
  `;



  db.query(approveQuery, [confirmed_by, id], (err, result) => {
    if (err) {
      console.error('Approval error:', err);
      return res.status(500).json({ message: 'Approval failed' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No registration found with given ID' });
    }




    // Get the event_id from this registration
    db.query('SELECT event_id FROM event_registrations WHERE id = ?', [id], (err2, rows) => {
      if (err2 || rows.length === 0) {
        return res.status(500).json({ message: 'Fetch event_id failed' });
      }
      const eventId = rows[0].event_id;
      // Increment accepted_count for the event
      db.query('UPDATE events SET accepted_count = accepted_count + 1 WHERE event_id = ?', [eventId], (err3) => {
        if (err3) {
          return res.status(500).json({ message: 'Failed to update accepted_count' });
        }
        res.json({ message: 'Registration approved' });
      });
    });
  });
});




app.post('/reject-registration', (req, res) => {
  const { id, reg_rej_reason, confirmed_by } = req.body;




  // Find the event_id for this registration
  db.query('SELECT event_id FROM event_registrations WHERE id = ?', [id], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    const eventId = rows[0].event_id;




    // Reject the registration
    const rejectQuery = `
      UPDATE event_registrations
      SET reg_status = 'rejected',
          reg_rej_reason = ?,
          reg_confirmation_by = ?,
          reg_confirmed_at = NOW()
      WHERE id = ?
    `;




    db.query(rejectQuery, [reg_rej_reason, confirmed_by, id], (err2, result) => {
      if (err2) {
        return res.status(500).json({ message: 'Rejection failed' });
      }




      // Update event counts: balance_count += 1, accepted_count -= 1
      db.query(
        'UPDATE events SET balance_count = balance_count + 1, accepted_count = accepted_count - 1 WHERE event_id = ?',
        [eventId],
        (err3) => {
          if (err3) {
            return res.status(500).json({ message: 'Failed to update event counts' });
          }
          res.json({ message: 'Registration rejected and event counts updated' });
        }
      );
    });
  });
});








// Route: Cancel/Reset registration to pending
app.post('/cancel-registration', (req, res) => {
  const { id } = req.body;




  const query = `
    UPDATE event_registrations
    SET reg_status = 'pending', reg_rej_reason = NULL, reg_confirmation_by = NULL, reg_confirmed_at = NULL
    WHERE id = ?
  `;




  db.query(query, [id], (err) => {
    if (err) {
      console.error('Cancel error:', err);
      return res.status(500).json({ message: 'Cancel failed' });
    }
    res.json({ message: 'Registration reset to pending' });
  });
});




app.post('/submit-for-approval', (req, res) => {
  const {
    event_id,
    category,
    event_name,
    start_date,
    end_date,
    location,
    website_link,
    organization,
    mode,
    event_created_by,
    eligible_dept,
    max_count
  } = req.body;

  // Optional: Validate required fields
  if (
    !event_id || !category || !event_name || !start_date ||
    !end_date || !location || !event_created_by ||
    !eligible_dept || !max_count
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO events (
      category, event_name, start_date, end_date,
      location, website_link, organization, mode,
      event_created_by, eligible_dept, max_count, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    category, event_name, start_date, end_date,
    location, website_link, organization, mode,
    event_created_by, eligible_dept, max_count, 'pending'
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Insert error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.status(201).json({ message: "Event submitted for approval" });
  });
});



// Fetch approved events
app.get("/fetch-approved-events", (req, res) => {
    db.query("SELECT * FROM events WHERE status = 'approved'", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json(results);
    });
});








// Fetch pending events
app.get("/fetch-pending-events", (req, res) => {
    db.query("SELECT * FROM events WHERE status = 'pending'", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json(results);
    });
});








// Update event status
app.put("/update-event-status/:id", (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason, confirmationBy, confirmationAt, eligible_dept,max_count } = req.body;




  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }




  let query;
  let params;




  if (status === "rejected") {
    // Update rejection reason and confirmation info, don't touch eligible_dept
    query = `
      UPDATE events
      SET status = ?, rejection_reason = ?, event_confirmation_by = ?, event_confirmed_at = ?
      WHERE event_id = ?
    `;
    params = [status, rejection_reason, confirmationBy, confirmationAt, id];




  } else if (status === "approved") {
    // Update eligible_dept, clear rejection reason
    query = `
      UPDATE events
      SET status = ?, rejection_reason = NULL, event_confirmation_by = ?, event_confirmed_at = ?, eligible_dept = ? , max_count=?
      WHERE event_id = ?
    `;
    params = [status, confirmationBy, confirmationAt, eligible_dept, max_count,id];




  } else {
    // For pending status (if needed), no change to rejection_reason or eligible_dept
    query = `
      UPDATE events
      SET status = ?, rejection_reason = NULL, event_confirmation_by = ?, event_confirmed_at = ?
      WHERE event_id = ?
    `;
    params = [status, confirmationBy, confirmationAt, id];
  }




  db.query(query, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Update failed" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(200).json({ message: `Event ${id} marked as ${status}` });
  });
});












// Soft delete event
app.delete("/delete-event/:id", (req, res) => {
    const { id } = req.params;
    db.query("UPDATE events SET status = 'deleted' WHERE event_id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Deletion failed" });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Event not found" });
        res.status(200).json({ message: `Event ${id} marked as deleted` });
    });
});








// Submit event history
app.post("/submit-in-eventhistory", upload.single("image"), (req, res) => {
    const { s_reg_no, event_id, description } = req.body;
    const image = req.file ? req.file.path.replace(/\\/g, "/") : null;

    if (!s_reg_no || !event_id || !description || !image) {
        return res.status(400).json({ error: "All fields including image and description are required" });
    }

    // 1. Check if event exists AND is approved
    db.query(
        "SELECT event_id FROM events WHERE event_id = ? AND status = 'approved'",
        [event_id],
        (err, eventResults) => {
            if (err) {
                console.error('Error verifying event:', err);
                return res.status(500).json({ error: "Database error while verifying event" });
            }
            if (eventResults.length === 0) {
                return res.status(400).json({ error: "Event summary can only be added for approved events." });
            }

            // 2. Check if student registration for this event is approved
            db.query(
                "SELECT * FROM event_registrations WHERE event_id = ? AND reg_no = ? AND reg_status = 'approved'",
                [event_id, s_reg_no],
                (err2, regResults) => {
                    if (err2) {
                        console.error('Error verifying registration:', err2);
                        return res.status(500).json({ error: "Database error while verifying registration" });
                    }
                    if (regResults.length === 0) {
                        return res.status(403).json({ error: "You are not approved for this event or not registered." });
                    }

                    // 3. Check if summary already submitted (optional, but recommended)
                    db.query(
                        "SELECT * FROM event_history WHERE event_id = ? AND s_reg_no = ?",
                        [event_id, s_reg_no],
                        (err3, historyResults) => {
                            if (err3) {
                                console.error('Error checking existing summary:', err3);
                                return res.status(500).json({ error: "Database error while checking summary" });
                            }
                            if (historyResults.length > 0) {
                                return res.status(409).json({ error: "Summary already submitted for this event." });
                            }

                            // 4. Insert event summary
                            const insertQuery = `
                                INSERT INTO event_history
                                (s_reg_no, event_id, image, description, status)
                                VALUES (?, ?, ?, ?, 'pending')
                            `;
                            db.query(insertQuery, [s_reg_no, event_id, image, description], (err4) => {
                                if (err4) {
                                    console.error('Error inserting event history:', err4);
                                    return res.status(500).json({ error: "Submission failed" });
                                }
                                res.status(201).json({ message: "Event summary submitted successfully" });
                            });
                        }
                    );
                }
            );
        }
    );
});



// Fetch all event history
app.get("/fetch-event_history", (req, res) => {
    db.query("SELECT * FROM event_history", (err, results) => {
        if (err) return res.status(500).json({ error: "Database query failed" });
        res.status(200).json(results);
    });
});








// Fetch pending summaries only
// Add this route to your server.js




// Fetch pending summaries only
app.get("/fetch-pending-summaries", (req, res) => {
    const query = `
      SELECT eh.*, e.event_name, e.category, e.start_date, e.end_date, e.organization,
       s.user_name AS stud_name, s.start_year, s.end_year
FROM event_history eh
JOIN events e ON eh.event_id = e.event_id        
JOIN student s ON TRIM(LOWER(eh.s_reg_no)) = TRIM(LOWER(s.reg_no))
WHERE eh.status = 'pending';
    `;
   
    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching pending summaries");
        }
        res.json(result);
    });
});




 








app.get("/get-event-history", (req, res) => {
    const { category, end_year, event_id, reg_no } = req.query;




    let query = `
        SELECT
            eh.id, eh.s_reg_no, eh.event_id, eh.image, eh.description, eh.status, eh.rejection_reason,
            e.event_name, e.start_date, e.end_date, e.organization, e.category
        FROM event_history eh
        JOIN events e ON eh.event_id = e.event_id
        WHERE 1 = 1
    `;




    const params = [];
    if (category) { query += ` AND e.category = ?`; params.push(category); }
    if (end_year) { query += ` AND e.end_date LIKE ?`; params.push(`%${end_year}`); } // or another way to filter year
    if (event_id) { query += ` AND eh.event_id = ?`; params.push(event_id); }
    if (reg_no) { query += ` AND eh.s_reg_no LIKE ?`; params.push(`%${reg_no}%`); }




    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: "Database query failed" });
        res.json(results);
    });
});








app.get("/get-event-details/:id", (req, res) => {
    const query = `
        SELECT
            eh.id, eh.s_reg_no, eh.event_id, eh.image, eh.description, eh.status, eh.rejection_reason,
            e.event_name, e.start_date, e.end_date, e.organization, e.category
        FROM event_history eh
        JOIN events e ON eh.event_id = e.event_id
        WHERE eh.id = ?
    `;




    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch event details" });
        if (results.length === 0) return res.status(404).json({ error: "Event not found" });
        res.json(results[0]);
    });
});












// Approve summary
app.put('/approve-summary/:id', (req, res) => {
    const { summary_confirmation_by, summary_confirmed_at } = req.body;
    const query = `
      UPDATE event_history
      SET status = 'approved', rejection_reason = NULL, summary_confirmation_by = ?, summary_confirmed_at = ?
      WHERE id = ?
    `;
    db.query(query, [summary_confirmation_by, summary_confirmed_at, req.params.id], (err, result) => {
      if (err) {
        console.error('Approval error:', err);
        return res.status(500).json({ error: 'Failed to approve summary' });
      }
      res.status(200).json({ message: 'Summary approved successfully' });
    });
  });
 
  // Reject summary with reason
  app.put('/reject-summary/:id', (req, res) => {
    const { reason, summary_confirmation_by, summary_confirmed_at } = req.body;
    const query = `
      UPDATE event_history
      SET status = 'rejected', rejection_reason = ?, summary_confirmation_by = ?, summary_confirmed_at = ?
      WHERE id = ?
    `;
    db.query(query, [reason, summary_confirmation_by, summary_confirmed_at, req.params.id], (err, result) => {
      if (err) {
        console.error('Rejection error:', err);
        return res.status(500).json({ error: 'Failed to reject summary' });
      }
      res.status(200).json({ message: 'Summary rejected successfully' });
    });
  });
 




// Fetch only approved summaries
app.get('/approve-event-history', async (req, res) => {
    const sql = `
      SELECT
        eh.id,
        eh.s_reg_no,
        eh.event_id,
        eh.image,
        eh.description,
        eh.status,
        e.event_name,
        e.start_date,
        e.end_date,
        e.organization AS e_organisers,
        e.category,
        s.user_name AS stud_name,
        s.end_year
      FROM event_history eh
      INNER JOIN events e ON eh.event_id = e.event_id
      INNER JOIN student s ON eh.s_reg_no = s.reg_no
      WHERE eh.status = 'approved'
      ORDER BY eh.event_id ASC
    `;


    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching approved event history:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});








// Fetch event history by student registration number
app.get("/event-history/:regNo", (req, res) => {
    const regNo = req.params.regNo;




    const query = `
        SELECT
            eh.event_id,
            eh.s_reg_no,
            eh.description,
            eh.image,
            eh.status,
            eh.rejection_reason,
            e.event_name,
            e.category,
            e.organization AS e_organisers,
            e.start_date,
            e.end_date
        FROM event_history eh
        JOIN events e ON eh.event_id = e.event_id
        WHERE eh.s_reg_no = ?
    `;




    db.query(query, [regNo], (err, results) => {
        if (err) {
            console.error('Error fetching event history by regNo:', err);
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
    });
});




// Fetch event by ID (only approved)
app.get("/events/:id", (req, res) => {
    const { id } = req.params;
    const query = "SELECT event_name, category, start_date, end_date, organization FROM events WHERE event_id = ? AND status = 'approved'";
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database query failed" });
        if (result.length === 0) return res.status(404).json({ error: "Event not found or not approved" });
        res.status(200).json(result[0]);
    });
});

app.get("/summary-notifications/:regNo", (req, res) => {
    const regNo = req.params.regNo;
    const query = `
        select event_name ,end_date from events e, event_registrations r where e.event_id=r.event_id and r.reg_status="approved" and r.reg_no=? 
    `;
    
    db.query(query, [regNo], (err, results) => {
        if (err) {
            console.error('Error fetching notifications by regNo:', err);
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
    });
});

// Assuming you have a MySQL connection named `db`
// Cancel (delete) a registration
app.delete('/delete-registration', (req, res) => {
    const { event_id, reg_no } = req.query;
    if (!event_id || !reg_no) {
        return res.status(400).json({ message: "Missing event_id or reg_no" });
    }
    db.query(
        "DELETE FROM event_registrations WHERE event_id = ? AND reg_no = ?",
        [event_id, reg_no],
        (err, result) => {
            if (err) {
                console.error("Error deleting registration:", err);
                return res.status(500).json({ message: "Database error" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Registration not found" });
            }
            res.json({ message: "Registration cancelled successfully." });
        }
    );
});




app.get('/event-analyzer', (req, res) => {
  const query = `
    SELECT e.event_name, e.start_date, COUNT(eh.s_reg_no) AS total_students
    FROM events e
    LEFT JOIN event_history eh ON e.event_id = eh.event_id
    GROUP BY e.event_id
    ORDER BY e.start_date;
  `;




  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching event data:', err);
      return res.status(500).json({ message: 'Server error' });
    }




    const formattedData = results.map(event => ({
      event_name: event.event_name,
      total_students: event.total_students,
      start_date: event.start_date,
    }));




    res.json(formattedData);
  });
});




app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
 
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
