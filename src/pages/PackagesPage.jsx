import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import PageHeader from '../components/ui/PageHeader';
import { PrimaryButton } from '../components/common/BrandButton';
import PackageCard from '../components/packages/PackageCard';
import PackageSort from '../components/packages/PackageSort';
import PackageFilters from '../components/packages/PackageFilters';

const PAGE_SIZE = 12;

function sortPackages(packages, sortKey) {
  const list = [...packages];

  switch (sortKey) {
    case 'price_asc':
      return list.sort(
        (a, b) => Number(a.pricePerPerson || 0) - Number(b.pricePerPerson || 0)
      );
    case 'price_desc':
      return list.sort(
        (a, b) => Number(b.pricePerPerson || 0) - Number(a.pricePerPerson || 0)
      );
    case 'name_desc':
      return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    case 'name_asc':
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'featured':
    default:
      return list.sort((a, b) => {
        const aActive = a.isActive !== false ? 1 : 0;
        const bActive = b.isActive !== false ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        return (a.name || '').localeCompare(b.name || '');
      });
  }
}

function filterPackages(packages, { destination, type, activeOnly }) {
  return packages.filter((pkg) => {
    if (activeOnly && pkg.isActive === false) return false;
    if (destination !== 'All' && pkg.destination !== destination) return false;
    if (type !== 'All' && pkg.type !== type) return false;
    return true;
  });
}

export default function PackagesPage({
  packages,
  onEdit,
  onDelete,
  canEdit,
  onAddPackage,
}) {
  const [sortKey, setSortKey] = useState('featured');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [destination, setDestination] = useState('All');
  const [type, setType] = useState('All');
  const [activeOnly, setActiveOnly] = useState(false);

  const destinations = useMemo(
    () =>
      [...new Set(packages.map((p) => p.destination).filter(Boolean))].sort(),
    [packages]
  );

  const types = useMemo(
    () => [...new Set(packages.map((p) => p.type).filter(Boolean))].sort(),
    [packages]
  );

  const filtered = useMemo(
    () => filterPackages(packages, { destination, type, activeOnly }),
    [packages, destination, type, activeOnly]
  );

  const sorted = useMemo(
    () => sortPackages(filtered, sortKey),
    [filtered, sortKey]
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setDestination('All');
    setType('All');
    setActiveOnly(false);
    setPage(1);
  }

  if (!packages.length) {
    return (
      <Box>
        <PageHeader
          title="Packages"
          subtitle="Tour package templates"
          action={canEdit && <PrimaryButton onClick={onAddPackage}>+ Add Package</PrimaryButton>}
        />
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No packages added yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add your first package template to start using bookings.
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Packages"
        subtitle={`${packages.length} templates · ${filtered.length} shown`}
        action={
          <>
            <Tooltip title="Filters">
              <IconButton onClick={() => setFiltersOpen(true)}>
                <i className="ri-filter-3-line" />
              </IconButton>
            </Tooltip>
            <PackageSort value={sortKey} onChange={(v) => { setSortKey(v); setPage(1); }} />
            {canEdit && <PrimaryButton onClick={onAddPackage}>+ Add Package</PrimaryButton>}
          </>
        }
      />

      <Grid container spacing={3}>
        {paginated.map((pkg) => (
          <Grid key={pkg.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <PackageCard
              pkg={pkg}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
            />
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <Card sx={{ p: 4, mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No packages match your filters.
          </Typography>
        </Card>
      )}

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_e, value) => setPage(value)}
            color="primary"
          />
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
        onReset={resetFilters}
      />
    </Box>
  );
}
