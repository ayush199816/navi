import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Table, Button, Space, Badge, message, Card, Typography, 
  Row, Col, Tag, Descriptions, Popconfirm, Divider 
} from 'antd';
import { 
  CheckOutlined, CloseOutlined, 
  UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined 
} from '@ant-design/icons';
import { ReloadOutlined } from '@ant-design/icons';
import { getPendingAgentApprovals, updateUserApproval } from '../../redux/slices/userSlice';

const { Title, Text } = Typography;

const AgentApprovals = () => {
  const dispatch = useDispatch();
  const { pendingAgentApprovals = [], loading, error } = useSelector((state) => state.users);
  
  // Debug log when component renders
  useEffect(() => {
    console.log('AgentApprovals rendered with state:', { 
      pendingAgentApprovals, 
      loading, 
      error 
    });
  }, [pendingAgentApprovals, loading, error]);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      console.log('Loading pending approvals...');
      const resultAction = await dispatch(getPendingAgentApprovals());
      console.log('Pending approvals result:', resultAction);
      
      if (getPendingAgentApprovals.fulfilled.match(resultAction)) {
        console.log('Pending approvals loaded successfully:', resultAction.payload);
      } else if (getPendingAgentApprovals.rejected.match(resultAction)) {
        console.error('Error loading pending approvals:', resultAction);
        const errorMessage = resultAction.payload || 
                           resultAction.error?.message || 
                           'Failed to load pending approvals';
        
        message.error({
          content: `Error: ${errorMessage}`,
          duration: 5,
          style: { marginTop: '50px' }
        });
      }
    } catch (err) {
      console.error('Unexpected error in loadPendingApprovals:', err);
      message.error({
        content: `Unexpected error: ${err.message || 'Unknown error occurred'}`,
        duration: 5,
        style: { marginTop: '50px' }
      });
    }
  };

  const handleApprove = async (userId) => {
    try {
      await dispatch(updateUserApproval({ userId, isApproved: true })).unwrap();
      message.success('Agent approved successfully');
      loadPendingApprovals();
    } catch (err) {
      console.error('Error approving agent:', err);
      message.error(err || 'Failed to approve agent');
    }
  };

  const handleReject = async (userId) => {
    try {
      await dispatch(updateUserApproval({ userId, isApproved: false })).unwrap();
      message.success('Agent rejected successfully');
      loadPendingApprovals();
    } catch (err) {
      console.error('Error rejecting agent:', err);
      message.error(err || 'Failed to reject agent');
    }
  };

  const columns = [
    {
      title: 'Agent Details',
      dataIndex: 'name',
      key: 'agent',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          <div className="text-gray-500">{record.email}</div>
          {record.phone && <div className="text-gray-500">{record.phone}</div>}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isApproved ? 'success' : 'warning'}>
          {record.isApproved ? 'Approved' : 'Pending Approval'}
        </Tag>
      ),
    },
    {
      title: 'Registration Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<CheckOutlined />} 
            onClick={() => handleApprove(record._id)}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Approve
          </Button>
          <Popconfirm
            title="Are you sure you want to reject this agent?"
            onConfirm={() => handleReject(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<CloseOutlined />}>
              Reject
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={3} className="mb-2">Agent Approvals</Title>
        <Text type="secondary">Review and approve new agent registrations</Text>
      </div>

      <Card 
        title={
          <div className="flex justify-between items-center">
            <span>Pending Agent Approvals</span>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadPendingApprovals}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        }
        className="mb-6"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <Text type="danger">{error}</Text>
          </div>
        )}
        
        {error ? (
          <div className="p-4 text-red-600 bg-red-100 rounded">
            <h3 className="font-bold mb-2">Error Loading Pending Approvals</h3>
            <pre className="whitespace-pre-wrap text-sm bg-white p-2 rounded border border-red-200 mb-2">
              {JSON.stringify(error, null, 2)}
            </pre>
            <p className="text-sm text-gray-600 mb-2">
              Please check your console for more details or try again later.
            </p>
            <Button 
              type="primary" 
              onClick={loadPendingApprovals}
              className="mt-2"
              icon={<ReloadOutlined />}
            >
              Retry
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={Array.isArray(pendingAgentApprovals) ? pendingAgentApprovals : []}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            locale={{
              emptyText: 'No pending agent approvals at the moment.'
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default AgentApprovals;
