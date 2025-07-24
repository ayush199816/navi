import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Table, 
  Spinner, 
  Alert, 
  Button, 
  Card, 
  Row, 
  Col, 
  Badge,
  InputGroup,
  FormControl
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
  FiFilter
} from 'react-icons/fi';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

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
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', variant: 'warning', icon: <FiEdit className="me-1" /> },
      published: { label: 'Published', variant: 'success', icon: <FiEye className="me-1" /> },
      archived: { label: 'Archived', variant: 'secondary', icon: <FiClock className="me-1" /> }
    };
    const { label, variant, icon } = statusMap[status] || { label: status, variant: 'primary', icon: null };
    return (
      <Badge bg={variant} className="d-flex align-items-center">
        {icon}
        {label}
      </Badge>
    );
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">My Itineraries</h2>
              <p className="text-muted mb-0">Manage your travel itineraries</p>
            </div>
            <Button 
              as={Link} 
              to="/agent/itineraries/create" 
              variant="primary" 
              className="d-flex align-items-center shadow-sm"
            >
              <FiPlus className="me-2" /> Create New Itinerary
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-center mb-4">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-white">
                  <FiSearch />
                </InputGroup.Text>
                <FormControl
                  placeholder="Search itineraries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text className="bg-white">
                  <FiFilter className="me-1" />
                  Status
                </InputGroup.Text>
                <FormControl
                  as="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </FormControl>
              </InputGroup>
            </Col>
            <Col md={3} className="text-md-end">
              <span className="text-muted">
                Showing {filteredItineraries.length} of {itineraries.length} itineraries
              </span>
            </Col>
          </Row>

          {filteredItineraries.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <FiMapPin size={48} className="text-muted" />
              </div>
              <h4 className="text-muted mb-3">No itineraries found</h4>
              <p className="text-muted mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first itinerary to get started.'}
              </p>
              <Button 
                as={Link} 
                to="/agent/itineraries/create" 
                variant="outline-primary"
                className="px-4"
              >
                <FiPlus className="me-2" /> Create Itinerary
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Destination</th>
                    <th>Travel Dates</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItineraries.map((itinerary) => (
                    <tr key={itinerary._id} className="align-middle">
                      <td className="fw-semibold">
                        <div className="d-flex align-items-center">
                          <div className="me-2">
                            <FiMapPin className="text-primary" />
                          </div>
                          <div>
                            <div>{itinerary.title || 'Untitled Itinerary'}</div>
                            <small className="text-muted">
                              {itinerary.duration || 'N/A'} days
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiMapPin className="text-muted me-2" />
                          {itinerary.destination || 'Not specified'}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiCalendar className="text-muted me-2" />
                          {itinerary.arrivalDate 
                            ? format(parseISO(itinerary.arrivalDate), 'MMM d, yyyy')
                            : 'Not set'}
                          
                          {itinerary.departureDate && (
                            <>
                              <span className="mx-1">-</span>
                              {format(parseISO(itinerary.departureDate), 'MMM d, yyyy')}
                            </>
                          )}
                        </div>
                      </td>
                      <td>{getStatusBadge(itinerary.status)}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiClock className="text-muted me-2" />
                          {format(parseISO(itinerary.createdAt), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <Button 
                            as={Link}
                            to={`/agent/itineraries/edit/${itinerary._id}`}
                            variant="outline-primary"
                            size="sm"
                            className="d-flex align-items-center"
                          >
                            <FiEdit className="me-1" /> Edit
                          </Button>
                          <Button 
                            as={Link}
                            to={`/itinerary/${itinerary._id}`}
                            variant="outline-secondary"
                            size="sm"
                            className="d-flex align-items-center"
                            target="_blank"
                          >
                            <FiEye className="me-1" /> View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ItineraryList;
