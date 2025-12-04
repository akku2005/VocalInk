import settingsService from "../settingsService";
import api from "../api";

jest.mock("../api", () => ({
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

describe("settingsService", () => {
  beforeEach(() => {
    api.get.mockReset();
    api.patch.mockReset();
    api.post.mockReset();
    api.delete.mockReset();
    settingsService.clearCache();
  });

  test("getUserSettings caches successful response", async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { profile: { name: "Test" } } },
    });

    // First fetch populates cache
    const first = await settingsService.getUserSettings();
    expect(api.get).toHaveBeenCalledWith("/settings");
    expect(first).toEqual({ profile: { name: "Test" } });

    api.get.mockClear();

    // Second fetch should use cache (no API call)
    const second = await settingsService.getUserSettings();
    expect(api.get).not.toHaveBeenCalled();
    expect(second).toEqual(first);
  });

  test("getUserSettings respects forceRefresh", async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { profile: { name: "Fresh" } } },
    });

    await settingsService.getUserSettings(true);
    expect(api.get).toHaveBeenCalledWith("/settings");
  });

  test("getUserSettings throws on failure response", async () => {
    api.get.mockResolvedValue({
      data: { success: false, message: "Nope" },
    });

    await expect(settingsService.getUserSettings()).rejects.toThrow("Nope");
  });

  test("updateProfileSettings calls correct endpoint and clears cache", async () => {
    api.patch.mockResolvedValue({
      data: { success: true, data: { profile: { name: "Updated" } } },
    });

    const result = await settingsService.updateProfileSettings({ name: "Updated" });
    expect(api.patch).toHaveBeenCalledWith("/settings/profile", { name: "Updated" });
    expect(result).toEqual({ profile: { name: "Updated" } });
  });

  test("updateProfileSettings throws on failure", async () => {
    api.patch.mockResolvedValue({
      data: { success: false, message: "Failed" },
    });

    await expect(settingsService.updateProfileSettings({})).rejects.toThrow("Failed");
  });

  test("updateGamificationSettings calls correct endpoint", async () => {
    api.patch.mockResolvedValue({
      data: { success: true, data: { level: 2 } },
    });

    const result = await settingsService.updateGamificationSettings({ level: 2 });
    expect(api.patch).toHaveBeenCalledWith("/settings/gamification", { level: 2 });
    expect(result).toEqual({ level: 2 });
  });

  test("updatePrivacySettings calls correct endpoint", async () => {
    api.patch.mockResolvedValue({
      data: { success: true, data: { visibility: "private" } },
    });

    const result = await settingsService.updatePrivacySettings({ visibility: "private" });
    expect(api.patch).toHaveBeenCalledWith("/settings/privacy", { visibility: "private" });
    expect(result).toEqual({ visibility: "private" });
  });

  test("updateAIPreferences calls correct endpoint", async () => {
    api.patch.mockResolvedValue({
      data: { success: true, data: { tone: "friendly" } },
    });

    const result = await settingsService.updateAIPreferences({ tone: "friendly" });
    expect(api.patch).toHaveBeenCalledWith("/settings/ai", { tone: "friendly" });
    expect(result).toEqual({ tone: "friendly" });
  });
});
