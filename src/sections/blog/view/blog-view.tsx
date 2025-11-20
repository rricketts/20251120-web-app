import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';

import { supabase } from 'src/lib/supabase';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { PostItem } from '../post-item';
import { PostSort } from '../post-sort';
import { PostSearch } from '../post-search';

import type { Post } from 'src/lib/supabase';
import type { IPostItem } from '../post-item';

// ----------------------------------------------------------------------

function convertPostToPostItem(post: Post): IPostItem {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    coverUrl: post.cover_url || '/assets/images/cover/cover-1.webp',
    totalViews: post.total_views,
    totalComments: post.total_comments,
    totalShares: post.total_shares,
    totalFavorites: post.total_favorites,
    postedAt: post.posted_at,
    author: {
      name: post.author_name,
      avatarUrl: post.author_avatar_url || '/assets/images/avatar/avatar-1.webp',
    },
  };
}

export function BlogView() {
  const [sortBy, setSortBy] = useState('latest');
  const [posts, setPosts] = useState<IPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('posted_at', { ascending: false });

        if (error) throw error;

        const convertedPosts = (data || []).map(convertPostToPostItem);
        setPosts(convertedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  const handleSort = useCallback((newSort: string) => {
    setSortBy(newSort);
  }, []);

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Blog
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          New post
        </Button>
      </Box>

      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <PostSearch posts={posts} />
        <PostSort
          sortBy={sortBy}
          onSort={handleSort}
          options={[
            { value: 'latest', label: 'Latest' },
            { value: 'popular', label: 'Popular' },
            { value: 'oldest', label: 'Oldest' },
          ]}
        />
      </Box>

      <Grid container spacing={3}>
        {posts.map((post, index) => {
          const latestPostLarge = index === 0;
          const latestPost = index === 1 || index === 2;

          return (
            <Grid
              key={post.id}
              size={{
                xs: 12,
                sm: latestPostLarge ? 12 : 6,
                md: latestPostLarge ? 6 : 3,
              }}
            >
              <PostItem post={post} latestPost={latestPost} latestPostLarge={latestPostLarge} />
            </Grid>
          );
        })}
      </Grid>

      <Pagination count={Math.ceil(posts.length / 12)} color="primary" sx={{ mt: 8, mx: 'auto' }} />
    </DashboardContent>
  );
}
