import Agenda from "agenda";
import { Story } from "../models/storyModel.js"; // Ensure correct import path

// Initialize Agenda
const agendaa = new Agenda({ db: { address: process.env.MONGO_URI, collection: "agendaJobs" } });

// Define the job
agendaa.define("publish story", async (job) => {
  try {
    const { storyId } = job.attrs.data;
    const story = await Story.findById(storyId);

  
    if (story && !story.createdAt) {
      const now = new Date();
      const scheduled = new Date(story.scheduledAt);

      // Only allow if we're near or past the scheduled time
      if (now >= scheduled) {
        story.createdAt = now;
        story.expiresAt = new Date(now.getTime() + 86400000);
        await story.save();
        // console.log(`✅ Story ${storyId} published at ${now.toISOString()}`);
      } else {
        // console.log(`⏳ Skipping story ${storyId}, scheduled for later: ${scheduled.toISOString()}`);
      }
    }
  } catch (error) {
    console.error("❌ Error in Agenda Job:", error);
  }
});

// Start Agenda
const startAgenda = async () => {
  await agendaa.start();
  // console.log("✅ Agenda started and running!");
};

// Export properly
export { agendaa, startAgenda };
