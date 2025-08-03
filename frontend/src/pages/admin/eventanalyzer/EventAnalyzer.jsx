import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography
} from '@mui/material';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import './EventAnalyzer.css';

const EventAnalyzer = () => {
  const [eventData, setEventData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    fetchEventAnalyzerData();
    setIsDarkMode(document.body.classList.contains('dark-mode'));
  }, []);

  const fetchEventAnalyzerData = async () => {
    try {
      const response = await axios.get('http://localhost:7000/event-analyzer');
      if (Array.isArray(response.data)) {
        setEventData(response.data);
        processMonthlyData(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const processMonthlyData = (data) => {
    const monthCounts = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    data.forEach(event => {
      if (event.start_date) {
        const dateObj = new Date(event.start_date);
        if (!isNaN(dateObj)) {
          const month = dateObj.toLocaleString('default', { month: 'short' });
          if (monthCounts[month] !== undefined) {
            monthCounts[month] += parseInt(event.total_students) || 0;
          }
        }
      }
    });

    setMonthlyData(Object.keys(monthCounts).map(month => ({
      month,
      students: monthCounts[month]
    })));
  };

  const chartColors = {
    light: {
      text: '#7e57c2',
      axis: '#7e57c2',
      tooltipBg: '#fff',
      tooltipBorder: '#7e57c2',
      cursor: 'rgba(126,87,194,0.08)'
    },
    dark: {
      text: '#ffffff',
      axis: '#ffffff',
      tooltipBg: '#232323',
      tooltipBorder: '#7e57c2',
      cursor: 'rgba(126,87,194,0.18)'
    }
  };

  const currentColors = isDarkMode ? chartColors.dark : chartColors.light;

  // Custom tick component for precise control
  const CustomTick = ({ x, y, payload }) => (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        dx={-5}
        fill={currentColors.text}
        fontSize={12}
        fontWeight="bold"
        textAnchor="end"
      >
        {payload.value}
      </text>
    </g>
  );

  return (
    <div className="event-analyzer-container">
      <Typography
        variant="h4"
        gutterBottom
        align="center"
        style={{ 
          color: currentColors.text,
          fontWeight: 'bold'
        }}
      >
        Event Analyzer
      </Typography>

      <div style={{ 
        display: 'flex', 
        gap: '30px', 
        marginTop: '30px', 
        flexWrap: 'wrap',
        width: '100%',
        overflow: 'visible'
      }}>
        <div className="event-analyzer-chart" style={{ minWidth: '800px' }}>
          <Typography
            variant="h6"
            align="center"
            gutterBottom
            style={{ 
              marginBottom: '20px',
              color: currentColors.text
            }}
          >
            Monthly Student Participation
          </Typography>
          
          <div style={{ 
            width: '100%', 
            height: '400px',
            overflowX: 'visible',
            overflowY: 'hidden'
          }}>
            <BarChart
              width={800}  // Fixed width for precise control
              height={400}
              data={monthlyData}
              margin={{ top: 40, right: 40, left: 0, bottom: 20 }}
              barSize={24}
              barCategoryGap={7} // Physical 7px spacing
            >
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#42a5f5" stopOpacity={0.95} />
                  <stop offset="60%" stopColor="#7e57c2" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#ab47bc" stopOpacity={0.8} />
                </linearGradient>
                <filter id="shadow" height="130%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#7e57c2" floodOpacity="0.25" />
                </filter>
              </defs>
              
              <XAxis
                dataKey="month"
                axisLine={{ stroke: currentColors.axis }}
                tickLine={false}
                interval={0}
                height={60}
                tick={<CustomTick />}
              />
              
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 14, fontWeight: 'bold', fill: currentColors.text }}
                axisLine={{ stroke: currentColors.axis }}
                tickLine={false}
              />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: currentColors.tooltipBg,
                  border: `1px solid ${currentColors.tooltipBorder}`,
                  borderRadius: 8,
                  color: currentColors.text,
                  boxShadow: '0 2px 8px rgba(126,87,194,0.2)'
                }}
                cursor={{ fill: currentColors.cursor }}
              />
              
              <Bar
                dataKey="students"
                fill="url(#colorStudents)"
                filter="url(#shadow)"
                animationDuration={1800}
                animationEasing="ease-out"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '400px' }}>
          <TableContainer component={Paper} elevation={3} style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: currentColors.text === '#ffffff' ? '#5c6bc0' : '#3f51b5' }}>
                  <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Event Name</TableCell>
                  <TableCell align="center" style={{ color: '#fff', fontWeight: 'bold' }}>Total Students</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eventData.length > 0 ? (
                  eventData
                    .filter(event => event.total_students > 0)
                    .map((event, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{event.event_name}</TableCell>
                        <TableCell align="center">{event.total_students}</TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </div>
  );
};

export default EventAnalyzer;
