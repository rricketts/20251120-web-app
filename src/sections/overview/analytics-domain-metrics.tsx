import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export type DomainMetric = {
  label: string;
  value: string | number;
};

type AnalyticsDomainMetricsProps = {
  title?: string;
  subheader?: string;
  metrics: DomainMetric[];
};

export function AnalyticsDomainMetrics({
  title,
  subheader,
  metrics,
}: AnalyticsDomainMetricsProps) {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader title={title} subheader={subheader} />

      <Stack spacing={2} sx={{ p: 3 }}>
        {metrics.map((metric) => (
          <Stack
            key={metric.label}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              py: 1.5,
              px: 2,
              borderRadius: 1,
              bgcolor: theme.vars.palette.background.neutral,
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {metric.label}
            </Typography>
            <Box
              component="span"
              sx={{ typography: 'subtitle2', color: 'text.primary' }}
            >
              {metric.value}
            </Box>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
