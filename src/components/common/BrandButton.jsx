import { Button } from '@mui/material';

export function PrimaryButton({ children, ...props }) {
  return (
    <Button variant="contained" color="primary" {...props}>
      {children}
    </Button>
  );
}

export function SecondaryButton({ children, ...props }) {
  return (
    <Button variant="contained" color="secondary" {...props}>
      {children}
    </Button>
  );
}

export function OutlineButton({ children, ...props }) {
  return (
    <Button variant="outlined" color="primary" {...props}>
      {children}
    </Button>
  );
}
