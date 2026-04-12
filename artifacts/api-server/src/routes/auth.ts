import { Router } from "express";
import { OAuth2Client } from "google-auth-library";

const router = Router();

const FRONTEND_PATH = "/chart-analyzer/";

function getClient(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

router.get("/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }
  const client = getClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile", "openid"],
    prompt: "select_account",
  });
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error || !code || typeof code !== "string") {
    res.redirect(`${FRONTEND_PATH}?error=auth_failed`);
    return;
  }

  try {
    const client = getClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub) throw new Error("No user payload from Google");

    req.session.user = {
      id: payload.sub,
      email: payload.email ?? "",
      name: payload.name ?? "",
      picture: payload.picture ?? null,
    };

    req.session.save((err) => {
      if (err) {
        req.log.error({ err }, "Failed to save session");
        res.redirect(`${FRONTEND_PATH}?error=auth_failed`);
        return;
      }
      res.redirect(FRONTEND_PATH);
    });
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback failed");
    res.redirect(`${FRONTEND_PATH}?error=auth_failed`);
  }
});

router.get("/me", (req, res) => {
  const user = req.session.user ?? null;
  res.json({ user });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to log out" });
      return;
    }
    res.json({ success: true });
  });
});

export default router;
