import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { FiDownload, FiPlus, FiTrash2, FiCalendar, FiUser, FiMail, FiPhone, FiMapPin, FiHome, FiClock } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const CreateItinerary = () => {
  const [formData, setFormData] = useState({
    // Agency Details
    agencyName: '',
    agentName: '',
    email: '',
    contactNumber: '',
    
    // Customer Details
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    
    // Travel Details
    destination: '',
    arrivalDate: '',
    departureDate: '',
    
    // Hotel Details
    hotelName: '',
    hotelAddress: '',
    checkInDate: '',
    checkOutDate: '',
    roomType: '',
    
    // Flight Details
    flightNumber: '',
    airline: '',
    departureAirport: '',
    arrivalAirport: '',
    departureTime: '',
    arrivalTime: '',
    
    // Itinerary Days
    days: [
      { 
        day: 1, 
        date: '',
        activities: [
          { time: '09:00', description: 'Breakfast at hotel' },
          { time: '10:00', description: 'City tour' },
          { time: '13:00', description: 'Lunch at local restaurant' },
          { time: '15:00', description: 'Visit landmarks' },
          { time: '19:00', description: 'Dinner at hotel' }
        ]
      }
    ]
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDayChange = (dayIndex, field, value) => {
    const updatedDays = [...formData.days];
    updatedDays[dayIndex][field] = value;
    setFormData(prev => ({
      ...prev,
      days: updatedDays
    }));
  };

  const handleActivityChange = (dayIndex, activityIndex, field, value) => {
    const updatedDays = [...formData.days];
    updatedDays[dayIndex].activities[activityIndex][field] = value;
    setFormData(prev => ({
      ...prev,
      days: updatedDays
    }));
  };

  const addDay = () => {
    const newDay = {
      day: formData.days.length + 1,
      date: '',
      activities: [
        { time: '09:00', description: 'Breakfast' },
        { time: '12:00', description: 'Lunch' },
        { time: '19:00', description: 'Dinner' }
      ]
    };
    setFormData(prev => ({
      ...prev,
      days: [...prev.days, newDay]
    }));
  };

  const addActivity = (dayIndex) => {
    const updatedDays = [...formData.days];
    updatedDays[dayIndex].activities.push({ time: '', description: '' });
    setFormData(prev => ({
      ...prev,
      days: updatedDays
    }));
  };

  const removeActivity = (dayIndex, activityIndex) => {
    const updatedDays = [...formData.days];
    updatedDays[dayIndex].activities.splice(activityIndex, 1);
    setFormData(prev => ({
      ...prev,
      days: updatedDays
    }));
  };

  const generatePDF = async () => {
    try {
      setError('');
      setSuccess('Generating PDF...');
      
      // Create a temporary div to hold the PDF content
      const content = document.createElement('div');
      content.style.padding = '20px';
      content.style.fontFamily = 'Arial, sans-serif';
      content.style.maxWidth = '800px';
      content.style.margin = '0 auto';
      content.style.backgroundColor = 'white';
      content.style.position = 'absolute';
      content.style.left = '-9999px';
      
      // Add header
      content.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 5px;">${formData.agencyName || 'Travel Agency'}</h1>
          <p style="color: #7f8c8d; margin: 5px 0;">${formData.agentName || 'Agent Name'}</p>
          <p style="color: #7f8c8d; margin: 5px 0;">${formData.email || 'agent@example.com'}</p>
          <p style="color: #7f8c8d; margin: 5px 0;">${formData.contactNumber || '+1 234 567 8900'}</p>
          <div style="border-top: 2px solid #3498db; width: 100px; margin: 20px auto;"></div>
          <h2 style="color: #2c3e50;">Travel Itinerary</h2>
        </div>
        
        <!-- Customer Details -->
        <div style="margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <h3 style="color: #2c3e50; border-bottom: 1px solid #dee2e6; padding-bottom: 8px; margin-bottom: 15px;">
            <span style="display: inline-flex; align-items: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Customer Details
            </span>
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${formData.customerName || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${formData.customerEmail || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${formData.customerPhone || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 5px 0;"><strong>Destination:</strong> ${formData.destination || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Travel Dates:</strong> ${formData.arrivalDate || 'N/A'} to ${formData.departureDate || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <!-- Hotel & Flight Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <!-- Hotel -->
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
            <h4 style="color: #2c3e50; margin-top: 0; margin-bottom: 10px;">
              <span style="display: inline-flex; align-items: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Hotel Accommodation
              </span>
            </h4>
            <p style="margin: 5px 0;"><strong>Hotel:</strong> ${formData.hotelName || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${formData.hotelAddress || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Check-in:</strong> ${formData.checkInDate || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Check-out:</strong> ${formData.checkOutDate || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Room Type:</strong> ${formData.roomType || 'N/A'}</p>
          </div>
          
          <!-- Flight -->
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #e74c3c;">
            <h4 style="color: #2c3e50; margin-top: 0; margin-bottom: 10px;">
              <span style="display: inline-flex; align-items: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Flight Details
              </span>
            </h4>
            <p style="margin: 5px 0;"><strong>Airline:</strong> ${formData.airline || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Flight #:</strong> ${formData.flightNumber || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>From:</strong> ${formData.departureAirport || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>To:</strong> ${formData.arrivalAirport || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Departure:</strong> ${formData.departureTime || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Arrival:</strong> ${formData.arrivalTime || 'N/A'}</p>
          </div>
        </div>
        
        <!-- Daily Itinerary -->
        <div>
          <h3 style="color: #2c3e50; border-bottom: 1px solid #dee2e6; padding-bottom: 8px; margin-bottom: 20px;">
            Daily Itinerary
          </h3>
          ${formData.days.map(day => `
            <div style="margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 5px; overflow: hidden;">
              <div style="background: #3498db; color: white; padding: 10px 15px;">
                <h4 style="margin: 0;">Day ${day.day}${day.date ? ` - ${day.date}` : ''}</h4>
              </div>
              <div style="padding: 15px;">
                ${day.activities.map(activity => `
                  <div style="display: flex; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #eee;">
                    <div style="font-weight: bold; min-width: 70px;">${activity.time}</div>
                    <div>${activity.description}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #7f8c8d; font-size: 14px;">
          <p>Thank you for choosing ${formData.agencyName || 'our agency'} for your travel needs.</p>
          <p>For any queries, please contact ${formData.agentName || 'your agent'} at ${formData.email || 'agent@example.com'}</p>
        </div>
      `;
      
      // Add the content to the body temporarily
      document.body.appendChild(content);
      
      // Generate PDF
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollY: 0
      });
      
      // Remove the temporary content
      document.body.removeChild(content);
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Save the PDF
      const fileName = `Itinerary_${formData.customerName ? formData.customerName.replace(/\s+/g, '_') : 'Customer'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      setSuccess('PDF generated successfully!');
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
      setSuccess('');
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Create New Itinerary</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Agency & Agent Details</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Agency Name</Form.Label>
                <Form.Control 
                  type="text" 
                  name="agencyName" 
                  value={formData.agencyName}
                  onChange={handleChange}
                  placeholder="Enter agency name"
                />
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Agent Name</Form.Label>
                <Form.Control 
                  type="text" 
                  name="agentName" 
                  value={formData.agentName}
                  onChange={handleChange}
                  placeholder="Enter agent name"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Contact Number</Form.Label>
                <Form.Control 
                  type="tel" 
                  name="contactNumber" 
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Customer Details</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Customer Name</Form.Label>
                <Form.Control 
                  type="text" 
                  name="customerName" 
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                />
              </Form.Group>
            </Col>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  name="customerEmail" 
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="Enter customer email"
                />
              </Form.Group>
            </Col>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Phone</Form.Label>
                <Form.Control 
                  type="tel" 
                  name="customerPhone" 
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="Enter customer phone"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Destination</Form.Label>
                <Form.Control 
                  type="text" 
                  name="destination" 
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="Enter destination"
                />
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Arrival Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="arrivalDate" 
                  value={formData.arrivalDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Departure Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="departureDate" 
                  value={formData.departureDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Hotel Details</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Hotel Name</Form.Label>
                <Form.Control 
                  type="text" 
                  name="hotelName" 
                  value={formData.hotelName}
                  onChange={handleChange}
                  placeholder="Enter hotel name"
                />
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Address</Form.Label>
                <Form.Control 
                  type="text" 
                  name="hotelAddress" 
                  value={formData.hotelAddress}
                  onChange={handleChange}
                  placeholder="Enter hotel address"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Check-in Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="checkInDate" 
                  value={formData.checkInDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Check-out Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="checkOutDate" 
                  value={formData.checkOutDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Room Type</Form.Label>
                <Form.Control 
                  as="select" 
                  name="roomType" 
                  value={formData.roomType}
                  onChange={handleChange}
                >
                  <option value="">Select room type</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Flight Details</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Airline</Form.Label>
                <Form.Control 
                  type="text" 
                  name="airline" 
                  value={formData.airline}
                  onChange={handleChange}
                  placeholder="Enter airline name"
                />
              </Form.Group>
            </Col>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Flight Number</Form.Label>
                <Form.Control 
                  type="text" 
                  name="flightNumber" 
                  value={formData.flightNumber}
                  onChange={handleChange}
                  placeholder="Enter flight number"
                />
              </Form.Group>
            </Col>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Departure Airport</Form.Label>
                <Form.Control 
                  type="text" 
                  name="departureAirport" 
                  value={formData.departureAirport}
                  onChange={handleChange}
                  placeholder="Enter departure airport"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Arrival Airport</Form.Label>
                <Form.Control 
                  type="text" 
                  name="arrivalAirport" 
                  value={formData.arrivalAirport}
                  onChange={handleChange}
                  placeholder="Enter arrival airport"
                />
              </Form.Group>
            </Col>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Departure Time</Form.Label>
                <Form.Control 
                  type="datetime-local" 
                  name="departureTime" 
                  value={formData.departureTime}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Arrival Time</Form.Label>
                <Form.Control 
                  type="datetime-local" 
                  name="arrivalTime" 
                  value={formData.arrivalTime}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Daily Itinerary */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Daily Itinerary</h5>
          <Button variant="light" size="sm" onClick={addDay}>
            <FiPlus className="me-1" /> Add Day
          </Button>
        </Card.Header>
        <Card.Body>
          {formData.days.map((day, dayIndex) => (
            <Card key={dayIndex} className="mb-4">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Day {day.day}</h6>
                  <div>
                    <Form.Control 
                      type="date" 
                      value={day.date}
                      onChange={(e) => handleDayChange(dayIndex, 'date', e.target.value)}
                      style={{ width: 'auto', display: 'inline-block' }}
                      className="me-2"
                    />
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => {
                        const updatedDays = formData.days.filter((_, i) => i !== dayIndex);
                        setFormData(prev => ({
                          ...prev,
                          days: updatedDays.map((d, i) => ({ ...d, day: i + 1 }))
                        }));
                      }}
                      disabled={formData.days.length <= 1}
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                {day.activities.map((activity, activityIndex) => (
                  <div key={activityIndex} className="d-flex mb-3 align-items-start">
                    <div className="me-3" style={{ width: '100px' }}>
                      <Form.Control 
                        type="time" 
                        value={activity.time}
                        onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'time', e.target.value)}
                      />
                    </div>
                    <div className="flex-grow-1 me-2">
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        value={activity.description}
                        onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'description', e.target.value)}
                        placeholder="Activity description"
                      />
                    </div>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => removeActivity(dayIndex, activityIndex)}
                      disabled={day.activities.length <= 1}
                      className="mt-1"
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => addActivity(dayIndex)}
                  className="mt-2"
                >
                  <FiPlus className="me-1" /> Add Activity
                </Button>
              </Card.Body>
            </Card>
          ))}
        </Card.Body>
      </Card>
      
      <div className="d-flex justify-content-end mb-5">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={generatePDF}
          className="d-flex align-items-center"
        >
          <FiDownload className="me-2" /> Download PDF Itinerary
        </Button>
      </div>
    </Container>
  );
};

export default CreateItinerary;
