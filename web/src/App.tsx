import { useEffect, useState } from 'react';
import './App.css';
import ClickButton from './components/ClickButton';
import Stats from './components/Stats';
import ComboIndicator from './components/ComboIndicator';
import RateLimitWarning from './components/RateLimitWarning';
import PostsList from './components/PostsList';
import CommentSection from './components/CommentSection';
import { useTelegram } from './hooks/useTelegram';
import { useClicker } from './hooks/useClicker';
import { usePosts } from './hooks/usePosts';

type Tab = 'clicker' | 'posts';

function App() {
  const tg = useTelegram();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('clicker');

  const {
    clickCount,
    globalCount,
    pendingClicks,
    comboCount,
    rateLimited,
    handleClick,
    loadStats,
  } = useClicker(tg);

  const {
    posts,
    selectedPost,
    comments,
    isLoading: postsLoading,
    error: postsError,
    loadComments,
    createComment,
    setSelectedPost,
  } = usePosts(tg);

  useEffect(() => {
    if (!tg.initData) {
      setError('Please open this app from Telegram');
      setIsLoading(false);
      return;
    }

    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) {
      setError('Could not identify user');
      setIsLoading(false);
      return;
    }

    loadStats()
      .then(() => setIsLoading(false))
      .catch(() => {
        setError('Failed to initialize game');
        setIsLoading(false);
      });
  }, [tg, loadStats]);

  const handleSelectPost = async (post: any) => {
    setSelectedPost(post);
    await loadComments(post.id);
  };

  const handleCreateComment = async (content: string, parentId: string | null) => {
    if (!selectedPost) return;
    await createComment(selectedPost.id, content, parentId);
  };

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'clicker' ? 'active' : ''}`}
          onClick={() => setActiveTab('clicker')}
        >
          🎮 Clicker
        </button>
        <button
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('posts');
            setSelectedPost(null);
          }}
        >
          💬 Posts
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'clicker' && (
          <div className="container">
            <Stats
              clickCount={clickCount}
              globalCount={globalCount}
              pendingClicks={pendingClicks}
            />
            
            <ClickButton onClick={handleClick} />
            
            <ComboIndicator comboCount={comboCount} />
            
            {rateLimited && <RateLimitWarning />}
          </div>
        )}

        {activeTab === 'posts' && (
          <>
            {selectedPost ? (
              <CommentSection
                post={selectedPost}
                comments={comments}
                onCreateComment={handleCreateComment}
                onBack={() => setSelectedPost(null)}
              />
            ) : (
              <PostsList
                posts={posts}
                onSelectPost={handleSelectPost}
                isLoading={postsLoading}
              />
            )}
            {postsError && <div className="error">{postsError}</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default App;

