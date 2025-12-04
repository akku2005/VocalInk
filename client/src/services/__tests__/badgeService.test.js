import badgeService from "../badgeService";
import api from "../api";

jest.mock("../api", () => ({
  get: jest.fn(),
}));

describe("badgeService", () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  test("getBadges returns data payload", async () => {
    api.get.mockResolvedValue({
      data: { data: { badges: [{ id: 1 }], pagination: { page: 1 } } },
    });

    const result = await badgeService.getBadges({ page: 2 });

    expect(api.get).toHaveBeenCalledWith("/badges", { params: { page: 2 } });
    expect(result).toEqual({ badges: [{ id: 1 }], pagination: { page: 1 } });
  });

  test("getBadges falls back to defaults when data missing", async () => {
    api.get.mockResolvedValue({ data: {} });

    const result = await badgeService.getBadges();

    expect(result).toEqual({ badges: [], pagination: null });
  });

  test("getBadgeStats returns stats payload", async () => {
    api.get.mockResolvedValue({ data: { data: { total: 5 } } });

    const result = await badgeService.getBadgeStats();

    expect(api.get).toHaveBeenCalledWith("/badges/stats");
    expect(result).toEqual({ total: 5 });
  });

  test("getBadgeStats returns null when missing data", async () => {
    api.get.mockResolvedValue({ data: {} });

    const result = await badgeService.getBadgeStats();

    expect(result).toBeNull();
  });

  test("getUserBadgeProgress uses current user when no id", async () => {
    api.get.mockResolvedValue({ data: { data: { progress: [] } } });

    const result = await badgeService.getUserBadgeProgress();

    expect(api.get).toHaveBeenCalledWith("/badges/user/progress");
    expect(result).toEqual({ progress: [] });
  });

  test("getUserBadgeProgress uses provided user id", async () => {
    api.get.mockResolvedValue({ data: { data: { progress: [] } } });

    await badgeService.getUserBadgeProgress("123");

    expect(api.get).toHaveBeenCalledWith("/badges/user/progress/123");
  });
});
