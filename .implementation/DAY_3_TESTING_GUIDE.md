# 🧪 Day 3 Testing Guide - TTS Real-Time Highlighting

This guide will help you verify the new Real-Time TTS Highlighting features.

---

## 📋 Prerequisites

1.  **Login**: Ensure you are logged in to VocalInk.
2.  **Blog**: You need a blog post with at least 2-3 paragraphs of text.

---

## 🚀 Test Case 1: Generate TTS with Highlighting

### Steps:
1.  **Create a New Blog** (or edit an existing one).
    *   Title: "TTS Test Blog"
    *   Content: Add 3 distinct paragraphs.
        ```html
        <p>This is the first paragraph. It should be highlighted when spoken.</p>
        <p>This is the second paragraph. The highlighting should move here automatically.</p>
        <p>This is the third paragraph. The page should scroll if this is out of view.</p>
        ```
    *   Publish the blog.

2.  **Generate Audio**:
    *   Go to the blog view page.
    *   Click the **"Generate Audio"** button in the Audio Player section.
    *   Wait for generation to complete.

3.  **Verify**:
    *   **Playback**: Click Play.
    *   **Highlighting**: As the audio plays, check if the current paragraph turns **yellow/highlighted**.
    *   **Transition**: When the audio moves to the next paragraph, the highlight should jump instantly.
    *   **Auto-Scroll**: Scroll the page so the current paragraph is slightly out of view. It should scroll back into center automatically.

---

## 🔧 Troubleshooting

### **Issue: Audio plays but no highlighting**
*   **Check**: Inspect the HTML source of the paragraphs. Do they have `id="tts-seg-0"`, `id="tts-seg-1"`, etc.?
    *   If not, the backend regex replacement didn't work.
*   **Check**: Open Console. Do you see "Segment changed to: tts-seg-X" logs? (You might need to add logs to debug).

### **Issue: "No valid text content found"**
*   **Cause**: Your blog post might be too short or contain only images/headings.
*   **Fix**: Add standard `<p>` paragraphs with text.

### **Issue: Audio generation fails**
*   **Cause**: ElevenLabs API quota or network issue.
*   **Fix**: Check server logs. Try using a different provider if implemented (though UI defaults to ElevenLabs).

---

## 📊 Verification Checklist

- [ ] Audio generates successfully
- [ ] Paragraphs have `id="tts-seg-X"` injected
- [ ] Audio plays sequentially (playlist)
- [ ] Highlighting follows the audio
- [ ] Auto-scroll keeps active segment in view
