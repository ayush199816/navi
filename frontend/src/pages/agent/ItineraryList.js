import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Spinner, 
  Alert, 
  Button, 
  Card, 
  Row, 
  Col, 
  Badge,
  InputGroup,
  Form,
  Dropdown,
  ButtonGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FiEdit, 
  FiEye, 
  FiPlus, 
  FiSearch, 
  FiCalendar, 
  FiMapPin, 
  FiClock,
  FiFilter,
  FiExternalLink,
  FiMoreVertical,
  FiTrash2,
  FiCopy,
  FiDownload,
  FiShare2
} from 'react-icons/fi';
import axios from 'axios';
import { format, parseISO, differenceInDays, formatDistanceToNow } from 'date-fns';
import styled from 'styled-components';

// Styled Components
const StyledContainer = styled(Container)`
  padding-top: 2rem;
  padding-bottom: 4rem;
`;

const SearchCard = styled(Card)`
  margin-bottom: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid #f1f3f5;
  
  .form-control, .form-select {
    border-radius: 8px;
    border: 1px solid #e9ecef;
    padding: 0.6rem 1rem;
    font-size: 0.95rem;
    
    &:focus {
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
      border-color: #86b7fe;
    }
  }
`;

const ItineraryCard = styled(Card)`
  transition: all 0.2s ease-in-out;
  border: 1px solid #e9ecef;
  margin-bottom: 1.5rem;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border-color: #dee2e6;
  }
  
  .card-img-top {
    height: 160px;
    object-fit: cover;
    background: linear-gradient(45deg, #f8f9fa, #e9ecef);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #adb5bd;
  }
  
  .status-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 1;
  }
  
  .action-dropdown {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 2;
  }
`;

const EmptyState = styled.div`
  padding: 5rem 2rem;
  text-align: center;
  background: #fff;
  border: 2px dashed #e9ecef;
  border-radius: 12px;
  margin: 2rem 0;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #0d6efd;
    background-color: #f8f9ff;
  }
  
  .icon {
    font-size: 4rem;
    color: #adb5bd;
    margin-bottom: 1.5rem;
    opacity: 0.8;
  }
  
  h4 {
    color: #343a40;
    margin-bottom: 1rem;
    font-weight: 600;
  }
  
  p {
    color: #6c757d;
    max-width: 500px;
    margin: 0 auto 2rem;
    font-size: 1.05rem;
    line-height: 1.6;
  }
  
  .btn {
    padding: 0.6rem 1.5rem;
    font-weight: 500;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(13, 110, 253, 0.2);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(13, 110, 253, 0.3);
    }
  }
`;

const ItineraryList = () => {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const response = await axios.get('/api/v1/itinerary-creator/agent');
        setItineraries(response.data.data || []);
      } catch (err) {
        setError('Failed to load itineraries. Please try again later.');
        console.error('Error fetching itineraries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItineraries();
  }, []);

  const filteredItineraries = itineraries.filter(itinerary => {
    const matchesSearch = 
      itinerary.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itinerary.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || itinerary.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading your itineraries...</p>
      </Container>
    );
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { 
        label: 'Draft', 
        variant: 'warning', 
        icon: <FiEdit className="me-1" />,
        bg: 'bg-warning-light',
        text: 'text-warning'
      },
      published: { 
        label: 'Published', 
        variant: 'success', 
        icon: <FiEye className="me-1" />,
        bg: 'bg-success-light',
        text: 'text-success'
      },
      archived: { 
        label: 'Archived', 
        variant: 'secondary', 
        icon: <FiClock className="me-1" />,
        bg: 'bg-secondary-light',
        text: 'text-secondary'
      }
    };
    
    const { label, variant, icon, bg, text } = statusMap[status] || { 
      label: status, 
      variant: 'primary',
      icon: null,
      bg: 'bg-primary-light',
      text: 'text-primary'
    };
    
    return (
      <span className={`badge ${bg} ${text} d-inline-flex align-items-center`}>
        {icon}
        {label}
      </span>
    );
  };

  // Format date range for display
  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return 'Not set';
    
    const start = parseISO(startDate);
    let formatted = format(start, 'MMM d, yyyy');
    
    if (endDate) {
      const end = parseISO(endDate);
      formatted += ` - ${format(end, 'MMM d, yyyy')}`;
      
      // Add duration in days
      const days = differenceInDays(end, start) + 1;
      formatted += ` (${days} ${days === 1 ? 'day' : 'days'})`;
    }
    
    return formatted;
  };

const getRandomPlaceholderImage = (title) => {
  const placeholders = [
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502602897457-915e98221d42?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502602897457-915e98221d42?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  ];
  const index = title ? title.length % placeholders.length : 0;
  return placeholders[index];
};

  return (
    <StyledContainer>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold" style={{ color: '#212529' }}>My Itineraries</h1>
          <p className="text-muted mb-0">Create and manage your travel plans</p>
        </div>
        <Button 
          as={Link} 
          to="/agent/itineraries/create" 
          variant="primary" 
          className="d-flex align-items-center"
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            fontWeight: '500',
            boxShadow: '0 2px 10px rgba(13, 110, 253, 0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          <FiPlus className="me-2" style={{ marginTop: '-2px' }} /> Create New
        </Button>
      </div>

      <SearchCard>
        <Card.Body className="p-4">
          <h5 className="mb-3 fw-semibold" style={{ color: '#343a40' }}>Search & Filter</h5>
          <Row className="g-3 align-items-center">
            <Col md={6} lg={4}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0" style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by title or destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                  style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                />
              </InputGroup>
            </Col>
            <Col md={6} lg={3}>
              <div className="d-flex align-items-center">
                <span className="text-muted me-2 fw-medium">Status:</span>
                <Form.Select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-auto"
                  style={{
                    minWidth: '140px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Form.Select>
              </div>
            </Col>
            <Col md={12} lg={5} className="text-lg-end">
              <span className="text-muted">
                Showing <strong>{filteredItineraries.length}</strong> of <strong>{itineraries.length}</strong> itineraries
              </span>
            </Col>
          </Row>
        </Card.Body>
      </SearchCard>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {filteredItineraries.length === 0 ? (
        <EmptyState>
          <div className="icon">
            <FiMapPin size={64} />
          </div>
          <h4>
            {searchTerm || statusFilter !== 'all' 
              ? 'No matching itineraries found' 
              : 'No itineraries yet'}
          </h4>
          <p className="mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'We couldn\'t find any itineraries matching your search. Try adjusting your filters or search term.'
              : 'You haven\'t created any travel itineraries yet. Start planning your next adventure!'}
          </p>
          <Button 
            as={Link} 
            to="/agent/itineraries/create" 
            variant="primary"
            className="px-4 py-2"
          >
            <FiPlus className="me-2" /> Create Your First Itinerary
          </Button>
        </EmptyState>
      ) : (
        <Row>
          {filteredItineraries.map((itinerary) => {
            const startDate = itinerary.arrivalDate ? parseISO(itinerary.arrivalDate) : null;
            const endDate = itinerary.departureDate ? parseISO(itinerary.departureDate) : null;
            const duration = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : null;
            
            return (
              <Col key={itinerary._id} xl={4} lg={6} className="mb-4">
                <ItineraryCard>
                  <div className="card-img-top position-relative" style={{
                    backgroundImage: `url(${getRandomPlaceholderImage(itinerary.title)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    <div className="position-absolute w-100 h-100" style={{
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)'
                    }} />
                    {itinerary.destination && (
                      <h5 className="position-relative text-white mb-0 fw-semibold">
                        {itinerary.destination}
                      </h5>
                    )}
                  </div>
                  
                  <div className="status-badge">
                    {getStatusBadge(itinerary.status)}
                  </div>
                  
                  <div className="action-dropdown">
                    <Dropdown as={ButtonGroup}>
                      <Dropdown.Toggle 
                        variant="light" 
                        size="sm" 
                        className="rounded-circle p-1"
                        style={{
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FiMoreVertical size={16} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu align="end">
                        <Dropdown.Item as={Link} to={`/agent/itineraries/edit/${itinerary._id}`}>
                          <FiEdit className="me-2" /> Edit
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to={`/itinerary/${itinerary._id}`} target="_blank">
                          <FiExternalLink className="me-2" /> View Live
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item className="text-danger">
                          <FiTrash2 className="me-2" /> Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                  
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="mb-1" style={{ fontSize: '1.1rem' }}>
                        {itinerary.title || 'Untitled Itinerary'}
                      </Card.Title>
                    </div>
                    
                    {itinerary.destination && (
                      <div className="text-muted mb-3 d-flex align-items-center">
                        <FiMapPin size={14} className="me-2" />
                        {itinerary.destination}
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <FiCalendar size={14} className="me-2 text-muted" />
                        <small className="text-muted">
                          {formatDateRange(itinerary.arrivalDate, itinerary.departureDate)}
                        </small>
                      </div>
                      {duration && (
                        <Badge bg="light" text="dark" className="ms-2">
                          {duration} {duration === 1 ? 'day' : 'days'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <FiClock size={14} className="me-1" />
                        Created {formatDistanceToNow(parseISO(itinerary.createdAt), { addSuffix: true })}
                      </small>
                      <div className="d-flex">
                        <Button 
                          as={Link}
                          to={`/agent/itineraries/edit/${itinerary._id}`}
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                        >
                          <FiEdit size={16} />
                        </Button>
                        <Button 
                          as={Link}
                          to={`/itinerary/${itinerary._id}`}
                          variant="outline-secondary"
                          size="sm"
                          target="_blank"
                        >
                          <FiExternalLink size={16} />
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </ItineraryCard>
              </Col>
            );
          })}
        </Row>
      )}
    </StyledContainer>
  );
};

export default ItineraryList;
