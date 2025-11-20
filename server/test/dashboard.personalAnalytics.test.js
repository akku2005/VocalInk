const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Blog = require('../src/models/blog.model');
const AnalyticsFetchLog = require('../src/models/analyticsFetchLog.model');
const JWTService = require('../src/services/JWTService');

const createUserWithFollowers = async () => {
  const user = new User({
    firstName: 'Analyst',
    lastName: 'Tester',
    email: 'analytics@example.com',
    password: 'Password1!',
    username: `analyst-${Date.now()}`,
  });
  await user.save();

  const followers = [];
  for (let idx = 1; idx <= 3; idx += 1) {
    const follower = await new User({
      firstName: `Follower${idx}`,
      lastName: 'Fan',
      email: `follower-${idx}@example.com`,
      password: 'Follower1!',
      username: `follower-${idx}-${Date.now()}`,
      dob: new Date(1990 + idx, 0, idx + 1),
      location: `City ${idx}, State`,
    }).save();
    followers.push(follower);
  }

  user.followers = followers.map((follower) => follower._id);
  await user.save();

  const token = JWTService.generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: 'writer',
  });

  return { user, token };
};

const createBlogs = async (user, count = 3) => {
  const blogs = [];
  for (let idx = 0; idx < count; idx += 1) {
    const blog = await Blog.create({
      title: `Analytics Post ${idx + 1}`,
      content: 'Content',
      author: user._id,
      status: 'published',
      publishedAt: new Date(Date.now() - idx * 1000 * 60 * 60 * 24),
      views: 10 * (idx + 1),
      likes: idx + 1,
      commentCount: 2 * idx,
      bookmarks: idx,
      shares: idx,
    });
    blogs.push(blog);
  }
  return blogs;
};

describe('GET /api/dashboard/personal-analytics', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const { collections } = mongoose.connection;
    const collectionNames = Object.keys(collections);
    await Promise.all(
      collectionNames.map((name) => mongoose.connection.collection(name).deleteMany({}))
    );
  });

  it('returns personalized analytics payload', async () => {
    const { token, user } = await createUserWithFollowers();
    await createBlogs(user, 3);

    const res = await request(app)
      .get('/api/dashboard/personal-analytics?period=7d')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats.totalBlogs).toBe(3);
    expect(res.body).toHaveProperty('timeline');
    expect(res.body.audience.ageGroups).toHaveLength(7);
    expect(res.body.topPosts.length).toBeLessThanOrEqual(3);
    expect(res.body.meta).toMatchObject({
      source: 'live',
      period: '7d',
    });
  });

  it('caches analytics payload and records hits', async () => {
    const { token, user } = await createUserWithFollowers();
    await createBlogs(user, 2);

    const first = await request(app)
      .get('/api/dashboard/personal-analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(first.status).toBe(200);
    expect(first.body.meta.source).toBe('live');

    const second = await request(app)
      .get('/api/dashboard/personal-analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(second.status).toBe(200);
    expect(second.body.meta.source).toBe('cache');

    const logs = await AnalyticsFetchLog.find({ user: user._id }).sort({ createdAt: 1 }).lean();
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs[0].source).toBe('live');
    expect(logs[1].source).toBe('cache');
  });
});
