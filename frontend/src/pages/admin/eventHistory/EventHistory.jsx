import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  Button,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  TablePagination,
  Menu,
  MenuItem,
  Modal,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import axios from "axios";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import "./eventHistory.css";

const EventHistory = () => {
  const [eventHistory, setEventHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRegNo, setFilterRegNo] = useState("");
  const [filterCategory, setFilterCategory] = useState([]);
  const [filterEventId, setFilterEventId] = useState([]);
  const [filterEndYear, setFilterEndYear] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const open = Boolean(anchorEl);

  const imageBaseUrl = "http://localhost:7000/";
  

  const categories = [
    "HACKATHON","PITCH DESK","WORKSHOP","CONFERENCE","PAPER PRESENTATION ","PROJECT PRESENTATION","PATENT FILING","INTERNSHIP","SPORTS","OTHERS"
  ];
  const eventIds = Array.from({ length: 85 }, (_, index) => index + 1);
  const years = Array.from({ length: 10 }, (_, index) => 2021 + index);

  useEffect(() => {
    fetchAllEventHistory();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [filteredData]);

  const fetchAllEventHistory = async () => {
    try {
      const response = await axios.get("http://localhost:7000/approve-event-history");
      const approvedEvents = response.data.filter(event => event.status === "approved");
      setEventHistory(approvedEvents);
      setFilteredData(approvedEvents);
    } catch (error) {
      console.error("Error fetching event history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...eventHistory];
    if (filterRegNo) {
      filtered = filtered.filter(ev =>
        ev.s_reg_no.toLowerCase().includes(filterRegNo.toLowerCase())
      );
    }
    if (filterCategory.length > 0) {
      filtered = filtered.filter(ev => filterCategory.includes(ev.category));
    }
    if (filterEventId.length > 0) {
      filtered = filtered.filter(ev => filterEventId.includes(ev.event_id));
    }
    if (filterEndYear.length > 0) {
      filtered = filtered.filter(ev => filterEndYear.includes(ev.end_year));
    }
    setFilteredData(filtered);
  };

  const handleDownloadClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // PDF Export
  const exportToPDF = () => {
  if (!filteredData || filteredData.length === 0) {
    alert("No data to export.");
    handleClose();
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
  doc.text("Event Summary Report", 40, 20);

  const tableColumn = [
    "Reg No",
    "Student Name",
    "End Year",
    "Event Name",
    "Category",
    "Organisers",
    "Start Date",
    "End Date",
    "Image link"
  ];

  const tableRows = filteredData.map(row => [
    row.s_reg_no || "N/A",
    row.stud_name || "N/A",
    row.end_year || "N/A",
    row.event_name || "N/A",
    row.category || "N/A",
    row.e_organisers || "N/A",
    row.start_date || "N/A",
    row.end_date || "N/A",
    "" // Placeholder for hyperlink
  ]);

  autoTable(doc, {
  head: [tableColumn],
  body: tableRows,
  startY: 30,
  margin: { top: 30 },
  styles: {
    fontSize: 8,
    cellPadding: 3,
    overflow: 'linebreak'
  },
  columnStyles: {
    3: { cellWidth: 100 },
    4: { cellWidth: 80 },
    5: { cellWidth: 100 },
    6: { cellWidth: 80 },
    7: { cellWidth: 80 },
    8: { cellWidth: 80 },
  },
  headStyles: { fillColor: [22, 160, 133], fontSize: 9 },
  didDrawCell: data => {
    if (data.section === 'body' && data.column.index === 8 && filteredData[data.row.index]?.image) {
      const imageUrl = `${imageBaseUrl}${filteredData[data.row.index].image}`;
      doc.setTextColor(0, 0, 255);
      doc.textWithLink("View Image", data.cell.x + 2, data.cell.y + 10, { url: imageUrl });
      doc.setTextColor(0, 0, 0);
    }
  }
});

  doc.save("Event_History.pdf");
  handleClose();
};


  // Excel Export
  const exportToExcel = () => {
  if (!filteredData || filteredData.length === 0) {
    alert("No data to export.");
    handleClose();
    return;
  }

  const tableRows = filteredData.map(row => ({
    "Reg No": row.s_reg_no || "N/A",
    "Student Name": row.stud_name || "N/A",
    "End Year": row.end_year || "N/A",
    "Event Name": row.event_name || "N/A",
    "Category": row.category || "N/A",
    "Organisers": row.e_organisers || "N/A",
    "Start Date": row.start_date || "N/A",
    "End Date": row.end_date || "N/A",
    "Image Link": row.image
      ? { f: `HYPERLINK("${imageBaseUrl}${row.image}", "View Image")` }
      : "N/A"
  }));

  const worksheet = XLSX.utils.json_to_sheet(tableRows, { cellFormula: true });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Event History");

  XLSX.writeFile(workbook, 'event_summary.xlsx');
  handleClose();
};

  const handleOpenFilterModal = () => setOpenFilterModal(true);
  const handleCloseFilterModal = () => setOpenFilterModal(false);

  const handleFilter = () => {
    handleSearch();
    setPage(0);
    handleCloseFilterModal();
  };

  return (
    <Box className="event-history-container">
      <Box display="flex" gap={2} alignItems="center" mb={2} marginTop={"35px"}>
        <TextField
          label="Search by Reg No"
          variant="outlined"
          size="small"
          value={filterRegNo}
          onChange={(e) => setFilterRegNo(e.target.value)}
        />
        <Button
          variant="outlined"
          sx={{ color: "#8013bd", borderColor: "#8013bd" }}
          startIcon={<FilterAltIcon />}
          onClick={handleOpenFilterModal}
        >
          Filter
        </Button>
        <IconButton onClick={handleDownloadClick}>
          <DownloadIcon sx={{ color: "#8013bd" }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <MenuItem onClick={exportToExcel}>Download as Excel</MenuItem>
          <MenuItem onClick={exportToPDF}>Download as PDF</MenuItem>
        </Menu>
      </Box>

      {/* Filter Modal */}
      <Modal open={openFilterModal} onClose={handleCloseFilterModal}>
        <Box sx={{
          p: 4, width: 600, margin: "auto", backgroundColor: "white",
          borderRadius: 2, position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)"
        }}>
          <Typography variant="h6">Filter Events</Typography>
          <Box mt={2}>
            <TextField
              label="Reg No"
              variant="outlined"
              size="small"
              fullWidth
              value={filterRegNo}
              onChange={(e) => setFilterRegNo(e.target.value)}
            />
          </Box>
          <Box mt={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Category</InputLabel>
              <Select
                multiple
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box mt={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Event ID</InputLabel>
              <Select
                multiple
                value={filterEventId}
                onChange={(e) => setFilterEventId(e.target.value)}
                label="Event ID"
              >
                {eventIds.map((id) => (
                  <MenuItem key={id} value={id}>
                    {id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box mt={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>End Year</InputLabel>
              <Select
                multiple
                value={filterEndYear}
                onChange={(e) => setFilterEndYear(e.target.value)}
                label="End Year"
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button onClick={handleCloseFilterModal} color="secondary">Cancel</Button>
            <Button onClick={handleFilter} color="primary">Apply Filter</Button>
          </Box>
        </Box>
      </Modal>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{width:"100%"}}>
            <TableHead sx={{ backgroundColor: "#7209b7" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Reg No</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>End Year</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Event Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Organisers</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Image</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow
                    key={page * rowsPerPage + index}
                    sx={{ backgroundColor: index % 2 === 0 ? "#f5f5f5" : "#ffffff" }}
                  >
                    <TableCell>{row.s_reg_no}</TableCell>
                    <TableCell>{row.stud_name}</TableCell>
                    <TableCell>{row.end_year}</TableCell>
                    <TableCell>{row.event_name}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.start_date}</TableCell>
                    <TableCell>{row.end_date}</TableCell>
                    <TableCell>{row.e_organisers}</TableCell>
                    <TableCell>
                      <a
                        href={`http://localhost:7000/${row.image}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1976d2", textDecoration: "underline" }}
                      >
                        Download Image
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 15]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={Math.min(page, Math.ceil(filteredData.length / rowsPerPage) - 1)}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default EventHistory;
