import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Table, Button, Space, Badge, message, Modal, Input, Select, Tag, Card, 
  Row, Col, Typography, Popconfirm, Form, InputNumber, Switch, Divider 
} from 'antd';
import { 
  SearchOutlined, CheckOutlined, CloseOutlined, 
  EditOutlined, DeleteOutlined, UserAddOutlined, UserOutlined, ReloadOutlined,
  MailOutlined, LockOutlined, PhoneOutlined, ShopOutlined,
  EnvironmentOutlined, GlobalOutlined, IdcardOutlined
} from '@ant-design/icons';
import { fetchUsers, updateUserApproval, createUser } from '../../redux/slices/userSlice';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      setIsLoading(true);
      const resultAction = await dispatch(fetchUsers());
      console.log('Fetch users result:', resultAction);
      
      if (fetchUsers.fulfilled.match(resultAction)) {
        console.log('Users loaded successfully:', resultAction.payload);
      } else if (fetchUsers.rejected.match(resultAction)) {
        console.error('Error loading users:', resultAction.error);
        const errorMessage = resultAction.error.message || 'Failed to load users';
        message.error(errorMessage);
      }
    } catch (err) {
      console.error('Unexpected error in loadUsers:', err);
      message.error(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create new user
  const handleCreateUser = async (values) => {
    try {
      setIsLoading(true);
      const resultAction = await dispatch(createUser(values));
      
      if (createUser.fulfilled.match(resultAction)) {
        message.success('User created successfully');
        form.resetFields();
        setIsCreateModalVisible(false);
        loadUsers();
      } else if (createUser.rejected.match(resultAction)) {
        message.error(resultAction.payload || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      message.error('An error occurred while creating the user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      console.log('Approving user:', userId);
      const resultAction = await dispatch(updateUserApproval({ userId, isApproved: true }));
      
      if (updateUserApproval.fulfilled.match(resultAction)) {
        console.log('User approved successfully:', resultAction.payload);
        message.success('User approved successfully');
      } else if (updateUserApproval.rejected.match(resultAction)) {
        console.error('Error approving user:', resultAction.error);
        const errorMessage = resultAction.error.message || 'Failed to approve user';
        message.error(errorMessage);
      }
    } catch (err) {
      console.error('Unexpected error in handleApproveUser:', err);
      message.error(err.message || 'An unexpected error occurred');
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      await dispatch(updateUserApproval({ userId, isApproved: false })).unwrap();
      message.success('User rejected successfully');
    } catch (err) {
      message.error(err || 'Failed to reject user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesApproval = 
      approvalFilter === 'all' || 
      (approvalFilter === 'approved' && user.isApproved) ||
      (approvalFilter === 'pending' && !user.isApproved);
    
    return matchesSearch && matchesRole && matchesApproval;
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'gold' : role === 'agent' ? 'blue' : 'default'}>
          {role?.toUpperCase() || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Badge 
          status={record.isApproved ? 'success' : 'warning'} 
          text={record.isApproved ? 'Approved' : 'Pending Approval'} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {!record.isApproved && (
            <Button 
              type="primary" 
              icon={<CheckOutlined />} 
              onClick={() => handleApproveUser(record._id)}
              size="small"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Approve
            </Button>
          )}
          {record.isApproved && (
            <Popconfirm
              title="Are you sure you want to revoke approval?"
              onConfirm={() => handleRejectUser(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="primary" 
                icon={<CloseOutlined />} 
                danger
                size="small"
              >
                Revoke
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card className="mb-4">
        <Title level={4} className="mb-4">User Management</Title>
        
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="Search users..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={value => setSearchText(value)}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Role"
              className="w-full"
              size="large"
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <Option value="all">All Roles</Option>
              <Option value="admin">Admin</Option>
              <Option value="agent">Agent</Option>
              <Option value="user">User</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Status"
              className="w-full"
              size="large"
              value={approvalFilter}
              onChange={setApprovalFilter}
            >
              <Option value="all">All Statuses</Option>
              <Option value="approved">Approved</Option>
              <Option value="pending">Pending Approval</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={loadUsers}
              loading={isLoading}
              className="w-full"
              size="large"
            >
              Refresh
            </Button>
          </Col>
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<UserAddOutlined />} 
              onClick={() => setIsCreateModalVisible(true)}
              style={{ marginRight: 8 }}
            >
              Add User
            </Button>
          </div>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>
      {/* Create User Modal */}
      <Modal
        title="Create New User"
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
          initialValues={{
            role: 'agent',
            isApproved: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter full name" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Enter email" 
                  type="email"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Enter password" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="Enter phone number" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select a role' }]}
              >
                <Select placeholder="Select role">
                  <Option value="admin">Admin</Option>
                  <Option value="operations">Operations</Option>
                  <Option value="sales">Sales</Option>
                  <Option value="agent">Agent</Option>
                  <Option value="accounts">Accounts</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isApproved"
                label="Approval Status"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren={<CheckOutlined />} 
                  unCheckedChildren={<CloseOutlined />} 
                  defaultChecked 
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Company Details</Divider>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="companyName"
                label="Company Name"
              >
                <Input 
                  prefix={<ShopOutlined />} 
                  placeholder="Enter company name" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="address"
                label="Address"
              >
                <Input 
                  prefix={<EnvironmentOutlined />} 
                  placeholder="Enter address" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
              >
                <Input 
                  prefix={<EnvironmentOutlined />} 
                  placeholder="Enter city" 
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="state"
                label="State"
              >
                <Input placeholder="Enter state" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="country"
                label="Country"
              >
                <Input 
                  prefix={<GlobalOutlined />} 
                  placeholder="Enter country" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pincode"
                label="Pincode"
              >
                <Input 
                  prefix={<IdcardOutlined />} 
                  placeholder="Enter pincode" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Button 
              onClick={() => setIsCreateModalVisible(false)} 
              style={{ marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
            >
              Create User
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
