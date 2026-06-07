import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import PageHeader from '../components/ui/PageHeader';
import { SecondaryButton } from '../components/common/BrandButton';
import UserFormDialog from '../components/users/UserFormDialog';
import { listUsers } from '../lib/userManagement';
import { getRoleLabel } from '../utils/accessControl';
import { useAppData } from '../context/AppDataContext';

export default function UsersPage() {
  const { showToast } = useAppData();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const rows = await listUsers();
      setUsers(rows);
    } catch (error) {
      showToast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleCreate() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function handleEdit(user) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  return (
    <Box>
      <CustomBreadcrumbs links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'Users' }]} />
      <PageHeader
        title="Users"
        subtitle="Manage access roles and booking manager assignments"
        action={<SecondaryButton onClick={handleCreate}>+ Add user</SecondaryButton>}
      />

      <Card sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Booked by</TableCell>
                <TableCell>Pool</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length ? (
                users.map((user) => (
                  <TableRow key={user.uid} hover>
                    <TableCell>{user.fullName || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{getRoleLabel(user.role)}</TableCell>
                    <TableCell>{user.bookedBy || '-'}</TableCell>
                    <TableCell>{user.poolId || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={user.isActive === false ? 'Inactive' : 'Active'}
                        color={user.isActive === false ? 'default' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <SecondaryButton onClick={() => handleEdit(user)}>Edit</SecondaryButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No users found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {dialogOpen && (
        <UserFormDialog
          open
          user={editingUser}
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            loadUsers();
          }}
        />
      )}
    </Box>
  );
}
