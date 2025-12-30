/**
 * Example Usage of useAsync Hook
 * 
 * This file demonstrates various ways to use the useAsync hook
 * for consistent loading state management across the application.
 */

import { useAsync, useAsyncMultiple } from './useAsync';
import { userService } from '../services/userService';
import blogService from '../services/blogService';

// ============================================
// Example 1: Simple Data Fetching
// ============================================
function UserProfileExample() {
  const { data: user, loading, error, execute } = useAsync(
    () => userService.getMyProfile(),
    { immediate: true } // Fetch on component mount
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return null;

  return <div>{user.name}</div>;
}

// ============================================
// Example 2: Manual Execution with Parameters
// ============================================
function BlogDetailExample({ blogId }) {
  const { data: blog, loading, error, execute } = useAsync(
    (id) => blogService.getBlogById(id)
  );

  useEffect(() => {
    if (blogId) {
      execute(blogId);
    }
  }, [blogId, execute]);

  // ... render logic
}

// ============================================
// Example 3: With Success/Error Callbacks
// ============================================
function CreateBlogExample() {
  const { execute, loading } = useAsync(
    (blogData) => blogService.createBlog(blogData),
    {
      onSuccess: (result) => {
        showToast('Blog created successfully!', 'success');
        navigate(`/blogs/${result._id}`);
      },
      onError: (error) => {
        showToast(error.message || 'Failed to create blog', 'error');
      }
    }
  );

  const handleSubmit = async (formData) => {
    try {
      await execute(formData);
    } catch (error) {
      // Error already handled by onError callback
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button type="submit" loading={loading}>
        Create Blog
      </Button>
    </form>
  );
}

// ============================================
// Example 4: Multiple Async Operations
// ============================================
function DashboardExample({ userId }) {
  const {
    data,
    loading,
    errors,
    allLoaded,
    executeAll
  } = useAsyncMultiple({
    user: () => userService.getUserProfile(userId),
    blogs: () => blogService.getBlogs({ author: userId }),
    stats: () => dashboardService.getUserStats(userId),
  }, { immediate: true });

  if (loading.user || loading.blogs || loading.stats) {
    return <LoadingSpinner />;
  }

  if (allLoaded) {
    return (
      <div>
        <UserInfo user={data.user} />
        <BlogList blogs={data.blogs} />
        <Stats stats={data.stats} />
      </div>
    );
  }

  // Handle individual errors
  if (errors.user) return <ErrorMessage error={errors.user} />;
  if (errors.blogs) return <ErrorMessage error={errors.blogs} />;

  return null;
}

// ============================================
// Example 5: Reset and Retry Pattern
// ============================================
function DataFetchWithRetryExample() {
  const { data, loading, error, execute, reset } = useAsync(
    () => fetchSomeData(),
    { immediate: true }
  );

  const handleRetry = () => {
    reset(); // Clear error and data
    execute(); // Try again
  };

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <ErrorDisplay error={error}>
        <Button onClick={handleRetry}>Retry</Button>
      </ErrorDisplay>
    );
  }

  return <DataDisplay data={data} />;
}

// ============================================
// Example 6: Status Helpers
// ============================================
function StatusHelpersExample() {
  const {
    isIdle,    // Not loading, no error, no data (initial state)
    isSuccess, // Not loading, no error, has data
    isError,   // Not loading, has error
    loading,   // Currently loading
    execute
  } = useAsync(() => fetchData());

  return (
    <div>
      {isIdle && <EmptyState onFetch={execute} />}
      {loading && <LoadingState />}
      {isSuccess && <SuccessState />}
      {isError && <ErrorState />}
    </div>
  );
}

// ============================================
// Example 7: Optimistic Updates
// ============================================
function OptimisticUpdateExample({ itemId }) {
  const { data, setData, execute } = useAsync(
    () => fetchItem(itemId),
    { immediate: true }
  );

  const handleUpdate = async (newData) => {
    // Optimistically update UI
    setData(newData);

    try {
      // Try to save to server
      await execute(() => updateItem(itemId, newData));
    } catch (error) {
      // Revert on error
      execute(() => fetchItem(itemId));
      showToast('Update failed', 'error');
    }
  };

  return <ItemDisplay data={data} onUpdate={handleUpdate} />;
}
