import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const TermsAndConditions = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>📜 Privacy Policy</Typography>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Last Updated: 25th August 2025
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Company: BookMySight.com
        </Typography>
        
        <Box mt={4}>
          <Typography paragraph>
            At BookMySight.com (“Company,” “we,” “our,” or “us”), we are committed to safeguarding the privacy of our guests (B2C customers) and agents/partners (B2B). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our sightseeing and travel portal.
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            1. Information We Collect
          </Typography>
          <Typography paragraph>
            We may collect the following information:
          </Typography>
          <Typography component="div" sx={{ pl: 2 }}>
            <Typography fontWeight="bold" component="p">For Guests (B2C):</Typography>
            <ul>
              <li>Full name, email, phone number, billing address</li>
              <li>Government-issued ID (including passport number for international bookings, if required by local regulations)</li>
              <li>Travel details such as dates, preferences, and special requirements</li>
              <li>Payment information (processed securely via third-party providers, not stored on our servers)</li>
            </ul>
            
            <Typography fontWeight="bold" component="p">For Agents (B2B):</Typography>
            <ul>
              <li>Company name, address, PAN/GST details</li>
              <li>Authorized representative details (name, email, phone)</li>
              <li>Bank details for settlements</li>
              <li>Booking and transaction history</li>
            </ul>
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            2. How We Use Your Information
          </Typography>
          <ul>
            <li>To process and confirm bookings</li>
            <li>To issue tickets, vouchers, and confirmations</li>
            <li>To comply with legal and regulatory requirements</li>
            <li>To provide customer and partner support</li>
            <li>To improve our services and personalize experiences</li>
          </ul>

          {/* Rest of the Privacy Policy */}
          <Typography variant="h6" mt={3} mb={2}>
            3. Data Sharing & Disclosure
          </Typography>
          <ul>
            <li>With service providers strictly for fulfilling bookings</li>
            <li>With government authorities where legally required</li>
            <li>With payment gateways for processing secure transactions</li>
            <li>We do not sell or trade your personal data</li>
          </ul>

          <Typography variant="h6" mt={3} mb={2}>
            4. Data Security
          </Typography>
          <Typography paragraph>
            We use encryption, secure servers, and access controls to protect personal data. Passport details are encrypted and shared only where legally mandated.
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            5. Data Retention
          </Typography>
          <Typography paragraph>
            Guest and agent data will be retained only as long as required for bookings, legal compliance, and business operations.
            Passport data is securely deleted within 30 days after completion of travel, unless longer retention is required by law.
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            6. Your Rights
          </Typography>
          <ul>
            <li>Access, update, or correct your personal data</li>
            <li>Request deletion (subject to regulatory requirements)</li>
            <li>Opt-out of marketing communications</li>
          </ul>

          <Typography variant="h6" mt={3} mb={2}>
            7. Contact Us
          </Typography>
          <Typography paragraph>
            For privacy concerns, email us at: privacy@navigatioasia.com
          </Typography>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>📜 Cancellation & Refund Policy</Typography>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Last Updated: 25th August 2025
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Company: BookMySight.com
        </Typography>
        
        <Box mt={4}>
          <Typography paragraph>
            We understand travel plans can change. Our policy ensures transparency for both guests (B2C) and agents (B2B).
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            1. Cancellation Rules
          </Typography>
          <Typography component="div" sx={{ pl: 2 }}>
            <Typography fontWeight="bold" component="p">Guest (B2C):</Typography>
            <ul>
              <li>Cancellation timelines vary by activity, attraction, or supplier.</li>
              <li>Some experiences may be non-refundable or partially refundable (clearly mentioned at the time of booking).</li>
            </ul>
            
            <Typography fontWeight="bold" component="p">Agent (B2B):</Typography>
            <ul>
              <li>Cancellation terms are displayed on the portal before booking confirmation.</li>
              <li>Special contracted rates may carry stricter cancellation rules.</li>
            </ul>
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            2. Refund Process
          </Typography>
          <Typography component="div" sx={{ pl: 2 }}>
            <Typography fontWeight="bold" component="p">For Guests (B2C):</Typography>
            <ul>
              <li>Refunds will be processed to the original payment source (card, UPI, bank, etc.).</li>
              <li>Refunds are always issued in INR.</li>
              <li>It may take 10–15 business days to reflect in your account.</li>
            </ul>
            
            <Typography fontWeight="bold" component="p">For Agents (B2B):</Typography>
            <ul>
              <li>Refunds are credited to the agent's wallet on the portal.</li>
              <li>Wallet balance can be used for future bookings but cannot be withdrawn, except where mandated by law.</li>
            </ul>
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            3. No-Show & Late Arrivals
          </Typography>
          <Typography paragraph>
            No refund will be issued for no-shows or late arrivals.
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            4. Force Majeure
          </Typography>
          <Typography paragraph>
            In case of events beyond our control (natural disasters, political unrest, strikes, pandemics), refunds and rescheduling are subject to partner/vendor policies.
          </Typography>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>📜 Terms of Service</Typography>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Last Updated: 25th August 2025
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Company: BookMySight.com
        </Typography>
        
        <Box mt={4}>
          <Typography paragraph>
            Welcome to BookMySight.com. By using our portal, you agree to the following terms:
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            1. Scope
          </Typography>
          <Typography paragraph>
            These Terms apply to both:
          </Typography>
          <ul>
            <li>Guests (B2C) using the portal to book sightseeing activities and services.</li>
            <li>Agents (B2B) using the portal to book for their clients.</li>
          </ul>

          <Typography variant="h6" mt={3} mb={2}>
            2. Eligibility
          </Typography>
          <ul>
            <li>Guests must be at least 18 years old to book.</li>
            <li>Agents must be legally registered businesses/entities to access B2B services.</li>
          </ul>

          <Typography variant="h6" mt={3} mb={2}>
            3. Booking & Payments
          </Typography>
          <ul>
            <li>All prices are displayed in INR (unless specified otherwise).</li>
            <li>Payment must be completed at the time of booking.</li>
            <li>Agents may receive contracted rates and wallet-based settlements.</li>
          </ul>

          <Typography variant="h6" mt={3} mb={2}>
            4. Refunds & Cancellations
          </Typography>
          <ul>
            <li>Refunds follow our Cancellation & Refund Policy (refer above).</li>
            <li>Guests: Refund to source account.</li>
            <li>Agents: Refund to wallet.</li>
          </ul>

          <Typography variant="h6" mt={3} mb={2}>
            5. Passport & ID Requirement
          </Typography>
          <Typography paragraph>
            For certain tours, passport/ID details are mandatory as per government rules.
            Guests agree to provide valid information; failure may result in denial of service without refund.
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            6. Responsibilities
          </Typography>
          <Typography paragraph>
            BookMySight.com acts as an aggregator and facilitator of services provided by third-party vendors.
            We are not liable for acts, delays, or errors of third-party suppliers but will provide support in dispute resolution.
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            7. Prohibited Use
          </Typography>
          <Typography paragraph>
            Misuse of the portal, fraudulent bookings, or sharing of agent login credentials is strictly prohibited.
            Violations may lead to suspension or termination of account.
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            8. Liability Limitation
          </Typography>
          <Typography paragraph>
            Our liability is limited to the booking amount paid.
            We are not responsible for indirect losses such as missed flights, visas, or additional expenses.
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            9. Governing Law
          </Typography>
          <Typography paragraph>
            These terms are governed by the laws of India. Disputes are subject to the jurisdiction of courts in Gorakhpur, Uttar Pradesh, India (or your registered office city if different).
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            10. Contact Us
          </Typography>
          <Typography paragraph>
            For support: info@navigatioasia.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsAndConditions;
