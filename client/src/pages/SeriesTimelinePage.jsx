import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  BookOpen,
  Plus,
  Edit,
  Share,
  Users,
  TrendingUp,
  Target,
  CheckCircle,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  Star,
  Bookmark,
  MoreHorizontal,
  Shield,
  Layers
} from "lucide-react";
import seriesService from "../services/seriesService";

import CollaboratorModal from "../components/series/CollaboratorModal";
import { useAuth } from "../context/AuthContext";

const stripHtml = (value) => {
  if (typeof value !== "string") return value;
  const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text;
};

const SeriesTimelinePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuEpisodeId, setMenuEpisodeId] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);

  // Use ref to track if we've already fetched for this ID to prevent double-fetching
  const hasFetchedRef = useRef(false);
  const currentIdRef = useRef(id);

  useEffect(() => {
    // Reset the fetch flag when ID changes
    if (currentIdRef.current !== id) {
      hasFetchedRef.current = false;
      currentIdRef.current = id;
    }

    const fetchSeries = async () => {
      // Skip if already fetched for this ID
      if (hasFetchedRef.current) return;

      try {
        setLoading(true);
        setError(null);
        hasFetchedRef.current = true; // Mark as fetched before the call
        const data = await seriesService.getSeriesById(id);
        setSeries(data);
      } catch (err) {
        console.error('Error fetching series:', err);
        setError(err.message || 'Failed to load series');
        setSeries(null);
        hasFetchedRef.current = false; // Reset on error so it can retry
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSeries();
    }
  }, [id]);

  // Redirect to slug if available and we're currently using ID
  useEffect(() => {
    if (series?.slug && id !== series.slug && series.slug !== id) {
      navigate(`/series/${series.slug}`, { replace: true });
    }
  }, [series, id, navigate]);

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-80 bg-surface/50 rounded-3xl border border-white/10"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-40 bg-surface/50 rounded-2xl"></div>
              <div className="h-96 bg-surface/50 rounded-2xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-60 bg-surface/50 rounded-2xl"></div>
              <div className="h-60 bg-surface/50 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto p-6 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-surface/50 p-8 rounded-3xl border border-white/10 backdrop-blur-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Error loading series
          </h2>
          <p className="text-text-secondary mb-6">
            {error}
          </p>
          <Button onClick={() => navigate("/series")} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Series
          </Button>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-[1600px] mx-auto p-6 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-surface/50 p-8 rounded-3xl border border-white/10 backdrop-blur-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Series not found
          </h2>
          <p className="text-text-secondary mb-6">
            The series you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/series")} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Series
          </Button>
        </div>
      </div>
    );
  }

  const authorName =
    series.authorId?.displayName ||
    [series.authorId?.firstName, series.authorId?.lastName].filter(Boolean).join(" ") ||
    series.authorId?.username ||
    series.authorId?.name ||
    series.author?.name ||
    "Unknown Author";

  const authorUsername =
    series.authorId?.username || series.author?.username || "unknown";

  const authorAvatar =
    series.authorId?.profilePicture || series.author?.avatar || series.authorId?.avatar;

  const episodes = series.episodes || [];

  const getEpisodeField = (episode, field) => {
    if (episode[field] !== undefined && episode[field] !== null) return episode[field];
    if (episode.episodeId && episode.episodeId[field] !== undefined) {
      return episode.episodeId[field];
    }
    return undefined;
  };

  const publishedEpisodesCount = episodes.filter((episode) => {
    const status = getEpisodeField(episode, "status") || "draft";
    return status === "published" || status === "active";
  }).length;

  const totalEpisodesCount = episodes.length || 1;

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "draft":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "planned":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "published":
        return CheckCircle;
      case "draft":
      case "planned":
        return Clock;
      default:
        return Clock;
    }
  };

  const toggleEpisodeMenu = (episodeId) => {
    setMenuEpisodeId((prev) => (prev === episodeId ? null : episodeId));
  };

  const handleRemoveEpisode = async (episodeId) => {
    if (!episodeId || !series?._id) return;
    if (!window.confirm("Remove this post from the series?")) return;

    try {
      setIsRemoving(true);
      await seriesService.removeEpisode(series._id, episodeId);
      setSeries((prev) => ({
        ...prev,
        episodes: prev.episodes.filter((episode) => {
          const currentId = episode.episodeId?._id || episode.episodeId || episode._id || episode.id;
          return currentId?.toString() !== episodeId.toString();
        })
      }));
      setMenuEpisodeId(null);
    } catch (err) {
      console.error("Failed to remove episode", err);
      alert(err.message || "Failed to remove episode. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Series Header */}
      <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-surface/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />

        <div className="relative h-[400px] sm:h-[500px]">
          {series.coverImage ? (
            <img
              src={series.coverImage}
              alt={series.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-900/20 to-pink-900/20 flex items-center justify-center">
              <Layers className="w-24 h-24 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-black/40 backdrop-blur-md text-white border-white/20 px-3 py-1.5">
                {series.category}
              </Badge>
              <Badge variant="outline" className="bg-black/40 backdrop-blur-md text-white border-white/20 px-3 py-1.5 capitalize">
                {series.difficulty}
              </Badge>
              <Badge variant="outline" className="bg-black/40 backdrop-blur-md text-white border-white/20 px-3 py-1.5 capitalize">
                {series.status || 'ongoing'}
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                {series.title}
              </h1>
              <div className="flex items-center gap-4 text-white/80 text-lg">
                <div className="flex items-center gap-2">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full border border-white/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center border border-white/20">
                      <Users className="w-4 h-4 text-sky-200" />
                    </div>
                  )}
                  <span className="font-medium text-white">{authorName}</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{new Date(series.createdAt).getFullYear()}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-white/90 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <span className="font-medium">{series.episodes?.length || 0} Posts</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-pink-400" />
                <span className="font-medium">{(series.analytics?.totalViews || 0).toLocaleString()} Views</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="font-medium">{(series.analytics?.likes || 0).toLocaleString()} Likes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-6 right-6 flex items-center gap-3">
          {user && (series.authorId?._id === user.id || series.authorId === user.id) && (
            <Button
              variant="outline"
              onClick={() => setIsCollaboratorModalOpen(true)}
              className="bg-black/40 backdrop-blur-md border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Team
            </Button>
          )}
          <Button variant="outline" className="bg-black/40 backdrop-blur-md border-white/20 text-white hover:bg-white/10 transition-colors">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="bg-black/40 backdrop-blur-md border-white/20 text-white hover:bg-white/10 transition-colors">
            <Bookmark className="w-4 h-4 mr-2" />
            Save Series
          </Button>
        </div>
      </div>

      {series && (
        <CollaboratorModal
          series={series}
          isOpen={isCollaboratorModalOpen}
          onClose={() => setIsCollaboratorModalOpen(false)}
          onUpdate={setSeries}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description Card */}
          <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Layers className="w-6 h-6 text-sky-500" />
              About this Series
            </h2>
            <p className="text-text-secondary leading-relaxed text-lg">
              {series.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {series.tags?.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-secondary/50 border border-border/50 text-sm text-text-secondary">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Clock className="w-6 h-6 text-pink-500" />
                Timeline
              </h2>
              <Button className="bg-gradient-to-r from-sky-500 to-pink-500 text-white border-0 hover:opacity-90 transition-opacity rounded-full px-6">
                <Plus className="w-4 h-4 mr-2" />
                Add Post
              </Button>
            </div>

            <div className="space-y-4">
              {(series.episodes || []).map((episode, index) => {
                const episodeStatus = getEpisodeField(episode, "status") || episode.status || "draft";
                const StatusIcon = getStatusIcon(episodeStatus);
                const episodeTitle = getEpisodeField(episode, "title") || `Episode ${index + 1}`;
                const rawEpisodeSummary = getEpisodeField(episode, "summary") || getEpisodeField(episode, "excerpt") || getEpisodeField(episode, "content");
                const episodeSummary = stripHtml(rawEpisodeSummary);
                const episodePublishedAt = getEpisodeField(episode, "publishedAt");
                const episodeReadingTime = getEpisodeField(episode, "readingTime");
                const episodeLikes = getEpisodeField(episode, "likes") || 0;
                const episodeBookmarks = getEpisodeField(episode, "bookmarks");
                const episodeId = episode.episodeId?._id || episode.episodeId || episode._id || episode.id;
                const episodeSlug = getEpisodeField(episode, "slug");
                const isMenuOpen = menuEpisodeId === episodeId;

                return (
                  <div
                    key={episodeId || index}
                    className="group relative bg-surface/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-surface/80 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5"
                  >
                    <div className="flex gap-6">
                      {/* Timeline Connector */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${episodeStatus === "published"
                          ? "bg-green-500/10 border-green-500/30 text-green-500"
                          : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                          }`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        {index < (episodes.length || 0) - 1 && (
                          <div className="w-0.5 flex-1 bg-gradient-to-b from-border to-transparent my-2 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Episode {index + 1}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(episodeStatus)}`}>
                                {episodeStatus}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-text-primary group-hover:text-sky-500 transition-colors">
                              {episodeTitle}
                            </h3>
                          </div>

                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-white/5 rounded-full"
                              onClick={() => toggleEpisodeMenu(episodeId)}
                            >
                              <MoreHorizontal className="w-5 h-5 text-text-secondary" />
                            </Button>
                            {isMenuOpen && (
                              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-surface shadow-xl shadow-black/20 z-20 overflow-hidden backdrop-blur-xl">
                                <button
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                                  onClick={() => {
                                    setMenuEpisodeId(null);
                                    if (episodeStatus === "published" && (episodeSlug || episodeId)) {
                                      navigate(`/article/${episodeSlug || episodeId}`);
                                    }
                                  }}
                                  disabled={!episodeId}
                                >
                                  <Eye className="w-4 h-4" /> View post
                                </button>
                                <button
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                                  onClick={() => {
                                    setMenuEpisodeId(null);
                                    if (episodeId) {
                                      navigate(`/edit-blog/${episodeId}`);
                                    }
                                  }}
                                  disabled={!episodeId}
                                >
                                  <Edit className="w-4 h-4" /> Edit post
                                </button>
                                <button
                                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                  onClick={() => handleRemoveEpisode(episodeId)}
                                  disabled={isRemoving}
                                >
                                  <Share className="w-4 h-4 rotate-180" /> Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {episodeSummary && (
                          <p className="text-text-secondary leading-relaxed line-clamp-2">
                            {episodeSummary}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            {episodePublishedAt && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {new Date(episodePublishedAt).toLocaleDateString()}
                              </span>
                            )}
                            {episodeReadingTime && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {episodeReadingTime} min
                              </span>
                            )}
                          </div>

                          {episodeStatus === "published" && (episodeSlug || episodeId) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-sky-500 hover:text-sky-400 hover:bg-sky-500/10 p-0 px-3 font-medium"
                              onClick={() => navigate(`/article/${episodeSlug || episodeId}`)}
                            >
                              Read Article <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Info */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Target className="w-5 h-5 text-sky-500" />
              Series Progress
            </h3>

            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-secondary/30 stroke-current"
                    strokeWidth="8"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-sky-500 stroke-current transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - publishedEpisodesCount / totalEpisodesCount)}`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-text-primary">{Math.round((publishedEpisodesCount / totalEpisodesCount) * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                <div className="text-2xl font-bold text-green-500">{publishedEpisodesCount}</div>
                <div className="text-xs text-green-500/70 uppercase tracking-wider font-medium">Published</div>
              </div>
              <div className="bg-yellow-500/10 rounded-xl p-4 text-center border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-500">{totalEpisodesCount - publishedEpisodesCount}</div>
                <div className="text-xs text-yellow-500/70 uppercase tracking-wider font-medium">Remaining</div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              Engagement
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-sm text-text-secondary flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Total Views
                </span>
                <span className="font-bold text-text-primary">
                  {(series.analytics?.totalViews || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-sm text-text-secondary flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Total Likes
                </span>
                <span className="font-bold text-text-primary">
                  {(series.analytics?.likes || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-sm text-text-secondary flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Comments
                </span>
                <span className="font-bold text-text-primary">
                  {series.analytics?.comments || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Author Card */}
          <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Creator
            </h3>

            <div className="flex items-center gap-4">
              {authorAvatar ? (
                <img src={authorAvatar} alt={authorName} className="w-16 h-16 rounded-full border-2 border-purple-500/20" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center border-2 border-purple-500/20">
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              )}
              <div>
                <div className="font-bold text-text-primary text-lg flex items-center gap-1">
                  {authorName}
                  {series.authorId?.verified && <Shield className="w-4 h-4 text-sky-500 fill-sky-500" />}
                </div>
                <div className="text-sm text-text-secondary">@{authorUsername}</div>
              </div>
            </div>

            {authorUsername && authorUsername !== "unknown" && (
              <Button
                variant="outline"
                className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                onClick={() => navigate(`/profile/${authorUsername}`)}
              >
                View Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesTimelinePage;
