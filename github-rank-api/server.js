import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { calculateRank } from "./calculateRank.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Fetch GitHub user stats
async function getGitHubStats(username) {
  try {
    const { data } = await axios.get(`https://api.github.com/users/${username}`);
    const events = await axios.get(`https://api.github.com/users/${username}/events/public`);
    const reposData = await axios.get(`https://api.github.com/users/${username}/repos`);

    const commits = events.data.filter(event => event.type === "PushEvent").length;
    const prs = events.data.filter(event => event.type === "PullRequestEvent").length;
    const issues = events.data.filter(event => event.type === "IssuesEvent").length;
    const reviews = events.data.filter(event => event.type === "PullRequestReviewEvent").length;

    // Discussions started and answered (approximating by IssuesEvent and PullRequestEvent)
    const discussionsStarted = events.data.filter(event => event.type === "IssuesEvent").length;
    const discussionsAnswered = events.data.filter(event => event.type === "PullRequestEvent").length;

    // PRs merged (need to filter merged PRs)
    const prsMerged = events.data.filter(event => event.type === "PullRequestEvent" && event.payload.action === "closed" && event.payload.pull_request.merged).length;
    
    // Calculate PRs merged percentage
    const prsMergedPercentage = prs > 0 ? (prsMerged / prs) * 100 : 0;

    // Stars approximation (using followers count here)
    const stars = reposData.data.reduce((acc, repo) => acc + repo.stargazers_count, 0);

    // Contributions (total contributions)
    const contribs = data.public_repos * 10; // Approximation based on number of repos and an arbitrary multiplier for contributions

    const rankData = {
        all_commits: true, // Adjust if needed
        commits: stats.commits,
        prs: stats.prs,
        issues: stats.issues,
        reviews: stats.reviews,
        repos: stats.public_repos,
        stars: stats.stars,
        followers: stats.followers
      };
  } catch (error) {
    console.error(error);
    return null;
  }
}

// API Route to fetch rank and additional details
app.get("/rank/:username", async (req, res) => {
  const { username } = req.params;
  const stats = await getGitHubStats(username);

  if (!stats) {
    return res.status(500).json({ error: "Failed to fetch GitHub stats" });
  }

  const rank = calculateRank(rankData);

  // Returning rank along with all user details
  res.json({
    rank,
    bio: stats.bio,
    location: stats.location,
    company: stats.company,
    public_repos: stats.public_repos,
    followers: stats.followers,
    stars: stats.stars,
    commits: stats.commits,
    prs: stats.prs,
    issues: stats.issues,
    reviews: stats.reviews,
    discussions_started: stats.discussionsStarted,
    discussions_answered: stats.discussionsAnswered,
    prs_merged: stats.prsMerged,
    prs_merged_percentage: stats.prsMergedPercentage,
    contribs: stats.contribs,
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
