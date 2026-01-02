import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Spinner, 
  Alert, 
  Button, 
  Card, 
  Row, 
  Col, 
  Badge
} from 'react-bootstrap';
import { 
  FiCheck, 
  FiX, 
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock
} from 'react-icons/fi';
import axios from 'axios';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO
} from 'date-fns';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const response = await axios.get(`/api/attendance/me?startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Convert attendance array to object with date as key
      const attendanceMap = {};
      response.data.data.forEach(record => {
        const dateKey = format(parseISO(record.date), 'yyyy-MM-dd');
        attendanceMap[dateKey] = record;
      });
      
      setAttendanceData(attendanceMap);
    } catch (err) {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchAttendanceData();
    fetchTodayAttendance();
  }, [currentMonth, fetchAttendanceData]);

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/attendance/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTodayAttendance(response.data.data);
    } catch (err) {
      console.error('Failed to check today attendance:', err);
    }
  };

  const markAttendance = async (status) => {
    if (todayAttendance) {
      setError('Attendance already marked for today');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/attendance', 
        { status },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Check if status was automatically changed to late
      const actualStatus = response.data.data.status;
      const autoLateMessage = response.data.message;
      
      if (autoLateMessage && actualStatus === 'late' && status === 'present') {
        setSuccess('Automatically marked as late (after 10:30 AM IST)');
      } else {
        setSuccess(`Marked as ${actualStatus} successfully!`);
      }
      
      // Refresh data
      await fetchTodayAttendance();
      await fetchAttendanceData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'success',
      absent: 'danger',
      late: 'warning'
    };
    return colors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      present: <FiCheck />,
      absent: <FiX />,
      late: <FiClock />
    };
    return icons[status] || null;
  };

  const renderCalendarDays = () => {
    const days = getDaysInMonth();

    return days.map((day, index) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const attendance = attendanceData[dateKey];
      const isCurrentMonth = isSameMonth(day, currentMonth);
      const isTodayDate = isToday(day);

      return (
        <Col 
          key={index} 
          className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''}`}
          onClick={() => attendance && console.log('Attendance:', attendance)}
        >
          <div className="calendar-day-content">
            <div className="calendar-date">{format(day, 'd')}</div>
            {attendance && (
              <div className={`calendar-status status-${attendance.status}`}>
                {getStatusIcon(attendance.status)}
              </div>
            )}
          </div>
        </Col>
      );
    });
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 mt-4">
      <style jsx>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #dee2e6;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .calendar-header {
          background: #f8f9fa;
          padding: 12px 8px;
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
          border-bottom: 1px solid #dee2e6;
        }
        
        .calendar-day {
          min-height: 80px;
          background: white;
          padding: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .calendar-day:hover {
          background: #f8f9fa;
        }
        
        .calendar-day.other-month {
          background: #f8f9fa;
          opacity: 0.5;
        }
        
        .calendar-day.today {
          background: #e3f2fd;
        }
        
        .calendar-day-content {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .calendar-date {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .calendar-status {
          margin-top: auto;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 0.75rem;
          margin-left: auto;
        }
        
        .status-present {
          background: #d4edda;
          color: #155724;
        }
        
        .status-absent {
          background: #f8d7da;
          color: #721c24;
        }
        
        .status-late {
          background: #fff3cd;
          color: #856404;
        }
        
        .attendance-summary {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .summary-card {
          flex: 1;
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
        }
      `}</style>

      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">Attendance</h2>
              <p className="text-muted mb-0">Mark and view your attendance calendar</p>
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      {/* Today's Attendance Card */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title className="d-flex align-items-center">
            <FiCalendar className="me-2" />
            Today's Attendance - {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </Card.Title>
          
          {todayAttendance ? (
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <Badge bg={getStatusColor(todayAttendance.status)} className="d-flex align-items-center me-3">
                  {getStatusIcon(todayAttendance.status)}
                  <span className="ms-1">{todayAttendance.status}</span>
                </Badge>
                <span className="text-muted">
                  Checked in at {format(parseISO(todayAttendance.checkInTime), 'h:mm a')}
                </span>
                {todayAttendance.notes && (
                  <span className="ms-3 text-muted">
                    Notes: {todayAttendance.notes}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="d-flex gap-2 flex-wrap">
              <Button 
                variant="success" 
                onClick={() => markAttendance('present')}
                disabled={submitting}
                className="d-flex align-items-center px-4 py-2"
                size="lg"
              >
                <FiCheck className="me-2" />
                {submitting ? 'Marking...' : 'Present'}
              </Button>
              <Button 
                variant="danger" 
                onClick={() => markAttendance('absent')}
                disabled={submitting}
                className="d-flex align-items-center px-4 py-2"
                size="lg"
              >
                <FiX className="me-2" />
                {submitting ? 'Marking...' : 'Absent'}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Attendance Summary */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Monthly Summary</Card.Title>
          <div className="attendance-summary">
            <div className="summary-card" style={{ background: '#d4edda' }}>
              <div className="text-success fw-bold">Present</div>
              <div className="h4 mb-0">
                {Object.values(attendanceData).filter(a => a.status === 'present').length}
              </div>
            </div>
            <div className="summary-card" style={{ background: '#f8d7da' }}>
              <div className="text-danger fw-bold">Absent</div>
              <div className="h4 mb-0">
                {Object.values(attendanceData).filter(a => a.status === 'absent').length}
              </div>
            </div>
            <div className="summary-card" style={{ background: '#fff3cd' }}>
              <div className="text-warning fw-bold">Late</div>
              <div className="h4 mb-0">
                {Object.values(attendanceData).filter(a => a.status === 'late').length}
              </div>
            </div>
            <div className="summary-card" style={{ background: '#e2e3e5' }}>
              <div className="text-secondary fw-bold">Total Days</div>
              <div className="h4 mb-0">
                {Object.values(attendanceData).length}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Calendar */}
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigateMonth('prev')}
              className="d-flex align-items-center"
            >
              <FiChevronLeft />
            </Button>
            <h4 className="mb-0">
              {format(currentMonth, 'MMMM yyyy')}
            </h4>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigateMonth('next')}
              className="d-flex align-items-center"
            >
              <FiChevronRight />
            </Button>
          </div>

          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-header">
                {day}
              </div>
            ))}
            {renderCalendarDays()}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Attendance;
