import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useAuth } from 'src/contexts/auth-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

export function ProfileView() {
  const { userData, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: user?.email || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: userData?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  return (
    <DashboardContent maxWidth="lg">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Profile
      </Typography>

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                  }}
                >
                  {userData?.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {userData?.name || 'User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {user?.email}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: 'primary.lighter',
                      color: 'primary.darker',
                      display: 'inline-block',
                      textTransform: 'capitalize',
                    }}
                  >
                    {userData?.role || 'viewer'}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant="h6">Personal Information</Typography>
              {!isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:pen-bold" />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />

                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email}
                  disabled
                  helperText="Email cannot be changed"
                />

                {isEditing && (
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button variant="contained" type="submit">
                      Save Changes
                    </Button>
                  </Stack>
                )}
              </Stack>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Account Type
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    textTransform: 'capitalize',
                    fontWeight: 600,
                    color: 'primary.main'
                  }}
                >
                  {userData?.role || 'viewer'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Account ID
                </Typography>
                <Typography variant="body1">{user?.id}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </DashboardContent>
  );
}
