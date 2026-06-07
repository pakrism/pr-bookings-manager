import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';

import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import PageHeader from '../components/ui/PageHeader';
import EmptyContent from '../components/ui/EmptyContent';
import { DarkButton } from '../components/common/BrandButton';
import PackageCard from '../components/packages/PackageCard';
import PackageSort from '../components/packages/PackageSort';
import PackageFilters from '../components/packages/PackageFilters';
import { useAppData } from '../context/AppDataContext';

const PAGE_SIZE = 12;

function sortPackages(packages, sortKey) {
  const list = [...packages];
  switch (sortKey) {
    case 'price_asc':
      return list.sort((a, b) => Number(a.pricePerPerson || 0) - Number(b.pricePerPerson || 0));
    case 'price_desc':
      return list.sort((a, b) => Number(b.pricePerPerson || 0) - Number(a.pricePerPerson || 0));
    case 'name_desc':
      return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    case 'name_asc':
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    default:
      return list.sort((a, b) => {
        const aActive = a.isActive !== false ? 1 : 0;
        const bActive = b.isActive !== false ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        return (a.name || '').localeCompare(b.name || '');
      });
  }
}

function filterPackages(packages, { destination, type, activeOnly, search }) {
  return packages.filter((pkg) => {
    if (activeOnly && pkg.isActive === false) return false;
    if (destination !== 'All' && pkg.destination !== destination) return false;
    if (type !== 'All' && pkg.type !== type) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${pkg.name} ${pkg.destination} ${pkg.type}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export default function PackagesPage() {
  const navigate = useNavigate();
  const { packages, bookings, capabilities, requestDeletePackage } = useAppData();
  const [sortKey, setSortKey] = useState('featured');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState('All');
  const [type, setType] = useState('All');
  const [activeOnly, setActiveOnly] = useState(false);

  const bookingCounts = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const id = b.packageTemplateId;
      if (id) map[id] = (map[id] || 0) + 1;
    }
    return map;
  }, [bookings]);

  const destinations = useMemo(
    () => [...new Set(packages.map((p) => p.destination).filter(Boolean))].sort(),
    [packages]
  );
  const types = useMemo(
    () => [...new Set(packages.map((p) => p.type).filter(Boolean))].sort(),
    [packages]
  );

  const filtered = useMemo(
    () => filterPackages(packages, { destination, type, activeOnly, search }),
    [packages, destination, type, activeOnly, search]
  );
  const sorted = useMemo(() => sortPackages(filtered, sortKey), [filtered, sortKey]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilters = [
    destination !== 'All' && destination,
    type !== 'All' && type,
    activeOnly && 'Active only',
  ].filter(Boolean);

  if (!packages.length) {
    return (
      <Box>
        <CustomBreadcrumbs links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'Packages' }, { name: 'List' }]} />
        <EmptyContent
          title="No packages yet"
          description="Add your first package template."
          action={capabilities.canManagePackages && <DarkButton onClick={() => navigate('/packages/new')}>+ Add package</DarkButton>}
        />
      </Box>
    );
  }

  return (
    <Box>
      <CustomBreadcrumbs links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'Packages' }, { name: 'List' }]} />
      <PageHeader
        title="List"
        subtitle={`${filtered.length} packages`}
        action={
          <>
            <TextField
              size="small"
              placeholder="Search packages..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-search-line" style={{ opacity: 0.5 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 220 }}
            />
            <Tooltip title="Filters">
              <IconButton onClick={() => setFiltersOpen(true)}>
                <i className="ri-filter-3-line" />
              </IconButton>
            </Tooltip>
            <PackageSort value={sortKey} onChange={(v) => { setSortKey(v); setPage(1); }} />
            {capabilities.canManagePackages && <DarkButton onClick={() => navigate('/packages/new')}>+ Add package</DarkButton>}
          </>
        }
      />

      {activeFilters.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {activeFilters.map((f) => (
            <Chip key={f} label={f} size="small" onDelete={() => {
              if (f === destination) setDestination('All');
              if (f === type) setType('All');
              if (f === 'Active only') setActiveOnly(false);
            }} />
          ))}
        </Box>
      )}

      <Grid container spacing={3}>
        {paginated.map((pkg) => (
          <Grid key={pkg.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <PackageCard
              pkg={pkg}
              bookingCount={bookingCounts[pkg.id] || 0}
              onEdit={() => navigate(`/packages/${pkg.id}/edit`)}
              onDelete={requestDeletePackage}
              canEdit={capabilities.canManagePackages}
            />
          </Grid>
        ))}
      </Grid>

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={pageCount} page={page} onChange={(_e, v) => setPage(v)} color="primary" />
        </Box>
      )}

      <PackageFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        destination={destination}
        onDestinationChange={(v) => { setDestination(v); setPage(1); }}
        type={type}
        onTypeChange={(v) => { setType(v); setPage(1); }}
        activeOnly={activeOnly}
        onActiveOnlyChange={(v) => { setActiveOnly(v); setPage(1); }}
        destinations={destinations}
        types={types}
        onReset={() => { setDestination('All'); setType('All'); setActiveOnly(false); setPage(1); }}
      />
    </Box>
  );
}
