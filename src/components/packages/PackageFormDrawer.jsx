import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useAppData } from '../../context/AppDataContext';
import PackageForm from './PackageForm';

export default function PackageFormDrawer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const {
    packages,
    packageForm,
    editingPackageId,
    loadPackageIntoForm,
    resetPackageForm,
    handlePackageInputChange,
    handleSavePackage,
  } = useAppData();

  const open = true;

  useEffect(() => {
    if (isEdit) {
      const pkg = packages.find((p) => p.id === id);
      if (pkg) loadPackageIntoForm(pkg);
    } else {
      resetPackageForm();
    }
  }, [id, packages]);

  function handleClose() {
    resetPackageForm();
    navigate('/packages');
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {isEdit ? 'Edit package' : 'New package'}
        </Typography>
        <IconButton onClick={handleClose}>
          <i className="ri-close-line" />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5, overflow: 'auto', flex: 1 }}>
        <PackageForm
          variant="drawer"
          packageForm={packageForm}
          editingPackageId={editingPackageId}
          onChange={handlePackageInputChange}
          onSubmit={handleSavePackage}
          onClose={handleClose}
        />
      </Box>
    </Drawer>
  );
}
