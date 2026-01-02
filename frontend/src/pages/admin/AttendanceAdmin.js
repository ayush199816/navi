import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Spinner, 
  Alert, 
  Button, 
  Card, 
  Row, 
  Col, 
  Badge,
  Form
} from 'react-bootstrap';
import { 
  FiCheck, 
  FiX, 
  FiClock, 
  FiChevronLeft,
  FiChevronRight,
  FiUser
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

const AttendanceAdmin = () => {
  const [attendanceData, setAttendanceData] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users?role=operations&limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      let url = `/api/attendance?startDate=${startDate}&endDate=${endDate}`;
      if (selectedUser !== 'all') {
        url += `&userId=${selectedUser}`;
      }
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Convert attendance array to object with date-user as key
      const attendanceMap = {};
      response.data.data.forEach(record => {
        const dateKey = format(parseISO(record.date), 'yyyy-MM-dd');
        const userKey = `${dateKey}-${record.user._id}`;
        attendanceMap[userKey] = record;
      });
      
      setAttendanceData(attendanceMap);
    } catch (err) {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [currentMonth, selectedUser, fetchAttendanceData]);

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getStatusIcon = (status) => {
    const icons = {
      present: <FiCheck />,
      absent: <FiX />,
      late: <FiClock />
    };
    return icons[status] || null;
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  };

  const renderCalendarDays = () => {
    const days = getDaysInMonth();

    return days.map((day, index) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const isCurrentMonth = isSameMonth(day, currentMonth);
      const isTodayDate = isToday(day);

      return (
        <Col 
          key={index} 
          className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''}`}
        >
          <div className="calendar-day-content">
            <div className="calendar-date">{format(day, 'd')}</div>
            <div className="calendar-users">
              {users.map(user => {
                const attendanceKey = `${dateKey}-${user._id}`;
                const attendance = attendanceData[attendanceKey];
                if (!attendance) return null;
                
                return (
                  <div 
                    key={user._id}
                    className={`calendar-status status-${attendance.status}`}
                    title={`${user.name}: ${attendance.status}`}
                  >
                    {getStatusIcon(attendance.status)}
                  </div>
                );
              })}
            </div>
          </div>
        </Col>
      );
    });
  };

  const renderUserList = () => {
    const attendanceByUser = {};
    
    Object.values(attendanceData).forEach(record => {
      const userId = record.user._id;
      if (!attendanceByUser[userId]) {
        attendanceByUser[userId] = {
          user: record.user,
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        };
      }
      attendanceByUser[userId][record.status]++;
      attendanceByUser[userId].total++;
    });

    return Object.values(attendanceByUser).map(({ user, present, absent, late, total }) => (
      <tr key={user._id}>
        <td>
          <div className="d-flex align-items-center">
            <div className="user-avatar me-3">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="fw-semibold text-dark">{user.name}</div>
              <div className="text-muted small">{user.email}</div>
            </div>
          </div>
        </td>
        <td>
          <Badge bg="success" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
            <FiCheck className="me-1" />
            {present}
          </Badge>
        </td>
        <td>
          <Badge bg="danger" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
            <FiX className="me-1" />
            {absent}
          </Badge>
        </td>
        <td>
          <Badge bg="warning" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
            <FiClock className="me-1" />
            {late}
          </Badge>
        </td>
        <td>
          <Badge bg="secondary" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
            {total}
          </Badge>
        </td>
        <td>
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className="progress-bar bg-success" 
              style={{ width: `${(present / total) * 100}%` }}
            />
          </div>
          <small className="text-muted">{Math.round((present / total) * 100)}%</small>
        </td>
      </tr>
    ));
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
          min-height: 100px;
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
          margin-bottom: 4px;
        }
        
        .calendar-users {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          margin-top: auto;
        }
        
        .calendar-status {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 0.7rem;
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
        
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #6c63ff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
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
              <h2 className="mb-0">Attendance Management</h2>
              <p className="text-muted mb-0">View and manage attendance for all operations users</p>
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Filters */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <FiUser className="me-2" />
                  Select User
                </Form.Label>
                <Form.Select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="all">All Users</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8} className="d-flex align-items-end">
              <div className="attendance-summary w-100">
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
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Calendar */}
      <Card className="shadow-sm mb-4">
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
              {selectedUser !== 'all' && (
                <span className="text-muted ms-2">
                  - {users.find(u => u._id === selectedUser)?.name}
                </span>
              )}
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

      {/* User Summary Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>User Attendance Summary</Card.Title>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Total Days</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {renderUserList()}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AttendanceAdmin;
