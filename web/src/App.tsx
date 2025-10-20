import { useEffect, useState } from 'react';
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
  
  // Deep linking: Read initial tab from URL hash
  const getInitialTab = (): Tab => {
    const hash = window.location.hash.slice(1); // Remove #
    if (hash === 'posts') return 'posts';
    return 'clicker';
  };
  
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab());

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
      <div className="flex items-center justify-center min-h-screen gradient-purple p-5">
        <div className="text-center text-white text-lg bg-red-500/20 backdrop-blur-sm rounded-2xl p-6 max-w-md">
          {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-purple">
        <div className="text-center text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="flex bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <button
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-all duration-200 border-b-2 ${
            activeTab === 'clicker'
              ? 'text-primary-600 border-primary-600 bg-primary-50/30'
              : 'text-gray-500 border-transparent hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('clicker')}
        >
          🎮 Clicker
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-all duration-200 border-b-2 ${
            activeTab === 'posts'
              ? 'text-primary-600 border-primary-600 bg-primary-50/30'
              : 'text-gray-500 border-transparent hover:bg-gray-50'
          }`}
          onClick={() => {
            setActiveTab('posts');
            setSelectedPost(null);
          }}
        >
          💬 Posts
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {activeTab === 'clicker' && (
          <div className="flex flex-col items-center justify-center min-h-full gradient-purple p-4">
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
            {postsError && (
              <div className="text-center p-5 text-red-500 bg-red-50 border border-red-200 rounded-lg m-4">
                {postsError}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;

