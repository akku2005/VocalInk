import { useState, useEffect } from "react";
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
} from "lucide-react";
import seriesService from "../services/seriesService";

const stripHtml = (value) => {
  if (typeof value !== "string") return value;
  const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text;
};

const SeriesTimelinePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuEpisodeId, setMenuEpisodeId] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await seriesService.getSeriesById(id);
        setSeries(data);
      } catch (err) {
        console.error('Error fetching series:', err);
        setError(err.message || 'Failed to load series');
        setSeries(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSeries();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
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

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Error loading series
        </h2>
        <p className="text-text-secondary mb-4">
          {error}
        </p>
        <Button onClick={() => navigate("/series")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Series
        </Button>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Series not found
        </h2>
        <p className="text-text-secondary mb-4">
          The series you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate("/series")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Series
        </Button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "text-success";
      case "draft":
        return "text-warning";
      case "planned":
        return "text-text-secondary";
      default:
        return "text-text-secondary";
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Series Header */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl overflow-hidden">
          <img
            src={series.coverImage}
            alt={series.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-4 mb-4">
            {authorAvatar && (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-12 h-12 rounded-full border-2 border-white"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {series.title}
              </h1>
              <p className="text-white/90">by {authorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>
                {series.episodes?.length || 0} posts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{(series.analytics?.totalViews || 0).toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{(series.analytics?.likes || 0).toLocaleString()} likes</span>
            </div>
            <Badge
              variant="outline"
              className="bg-white/20 text-white border-white/30"
            >
              {series.status || 'ongoing'}
            </Badge>
          </div>
        </div>

        <div className="absolute top-6 right-6 flex items-center gap-2">
          <Button variant="outline" className="bg-white/90 backdrop-blur-sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="bg-white/90 backdrop-blur-sm">
            <Bookmark className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Series Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <p className="text-text-primary leading-relaxed mb-6">
                {series.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {series.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-text-secondary">Started</div>
                  <div className="font-medium text-text-primary">
                    {series.createdAt ? new Date(series.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">Last Updated</div>
                  <div className="font-medium text-text-primary">
                    {series.updatedAt ? new Date(series.updatedAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">Progress</div>
                  <div className="font-medium text-text-primary">
                    {Math.round((publishedEpisodesCount / totalEpisodesCount) * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">Comments</div>
                  <div className="font-medium text-text-primary">
                    {series.analytics?.comments || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {(() => {
                  const publishedCount = series.episodes?.filter(e => e.episodeId?.status === 'published').length || 0;
                  const totalCount = series.episodes?.length || 1;
                  const progress = Math.round((publishedCount / totalCount) * 100);
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary-500 mb-2">
                          {progress}%
                        </div>
                        <div className="text-sm text-text-secondary">
                          {publishedCount} of {totalCount} posts published
                        </div>
                      </div>

                      <div className="w-full bg-secondary-100 rounded-full h-3">
                        <div
                          className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center p-3 bg-success/10 rounded-lg">
                          <div className="text-success font-bold">
                            {publishedCount}
                          </div>
                          <div className="text-text-secondary">Published</div>
                        </div>
                        <div className="text-center p-3 bg-warning/10 rounded-lg">
                          <div className="text-warning font-bold">
                            {totalCount - publishedCount}
                          </div>
                          <div className="text-text-secondary">Remaining</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Series Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total Views</span>
                <span className="font-medium text-text-primary">
                  {(series.analytics?.totalViews || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total Likes</span>
                <span className="font-medium text-text-primary">
                  {(series.analytics?.likes || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Total Comments
                </span>
                <span className="font-medium text-text-primary">
                  {series.analytics?.comments || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Avg. Read Time
                </span>
                <span className="font-medium text-text-primary">7.5 min</span>
              </div>
            </CardContent>
          </Card>

          {/* Author Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                Author
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {authorAvatar && (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium text-text-primary">
                    {authorName}
                  </div>
                  <div className="text-sm text-text-secondary">
                    @{authorUsername}
                  </div>
                </div>
              </div>
              {authorUsername && authorUsername !== "unknown" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/profile/${authorUsername}`)}
                >
                  View Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Timeline</h2>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Post
          </Button>
        </div>

        <div className="space-y-6">
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
            const isMenuOpen = menuEpisodeId === episodeId;
            return (
              <Card
                key={episodeId || index}
                className="hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Timeline Indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          episodeStatus === "published"
                            ? "bg-success text-white"
                            : episodeStatus === "draft"
                              ? "bg-warning text-white"
                              : "bg-secondary-200 text-text-secondary"
                        }`}
                      >
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      {index < (episodes.length || 0) - 1 && (
                        <div className="w-0.5 h-16 bg-border mt-2"></div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-text-primary">
                              {episodeTitle}
                            </h3>
                            {getEpisodeField(episode, "featured") && (
                              <Badge
                                variant="default"
                                className="bg-warning text-white"
                              >
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={getStatusColor(episodeStatus)}
                            >
                              {episodeStatus}
                            </Badge>
                          </div>
                          {episodeSummary && (
                            <p className="text-text-secondary leading-relaxed">
                              {episodeSummary}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          {episodeStatus === "published" && (
                            <>
                              {episodePublishedAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(episodePublishedAt).toLocaleDateString()}
                                </span>
                              )}
                              {episodeReadingTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {episodeReadingTime} min read
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {episodeLikes.toLocaleString()}
                              </span>
                              {episodeBookmarks !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Bookmark className="w-4 h-4" />
                                  {(episodeBookmarks || 0).toLocaleString()}
                                </span>
                              )}
                            </>
                          )}
                          {episodeStatus === "draft" && (
                            <span className="text-warning">
                              Draft - Not published
                            </span>
                          )}
                          {episodeStatus === "planned" && (
                            <span className="text-text-secondary">
                              Planned for future
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {episodeStatus === "published" && episodeId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/article/${episodeId}`)}
                            >
                              <ArrowRight className="w-4 h-4 mr-1" />
                              Read
                            </Button>
                          )}
                          {episodeStatus === "draft" && episodeId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/edit-blog/${episodeId}`)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEpisodeMenu(episodeId)}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                            {isMenuOpen && (
                              <div className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-surface shadow-lg z-10">
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-surface/80"
                                  onClick={() => {
                                    setMenuEpisodeId(null);
                                    if (episodeStatus === "published" && episodeId) {
                                      navigate(`/article/${episodeId}`);
                                    }
                                  }}
                                  disabled={!episodeId}
                                >
                                  View post
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-surface/80"
                                  onClick={() => {
                                    setMenuEpisodeId(null);
                                    if (episodeId) {
                                      navigate(`/edit-blog/${episodeId}`);
                                    }
                                  }}
                                  disabled={!episodeId}
                                >
                                  Edit post
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/10 disabled:opacity-60"
                                  onClick={() => handleRemoveEpisode(episodeId)}
                                  disabled={isRemoving}
                                >
                                  Remove from series
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeriesTimelinePage;
