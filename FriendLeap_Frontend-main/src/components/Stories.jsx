import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";
import PostInstance from "@/utils/PostInstance";

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [schedule, setSchedule] = useState("now");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openStory, setOpenStory] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyLoader, setStoryLoader] = useState(null);

  const fetchStories = async () => {
    try {
      const res = await PostInstance.get("/seestory");
      console.log(res.data);

      if (res.data) {
        const { userStories = [], followingStories = [] } = res.data;

        // Combine both user and following stories
        const allStories = [...userStories, ...followingStories];
        setStories(allStories); // Each object already contains { user, stories }
      } else {
        setStories([]);
      }
    } catch (error) {
      toast.error("Failed to load stories.");
      setStories([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {

    if (openStory) {
      startStoryLoader();
    }

    fetchStories();

    return () => {
      if (storyLoader) clearTimeout(storyLoader);
    };
  },[openStory, currentStoryIndex]);

  const handleStoryUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("scheduleStatus", schedule);
    if (schedule === "later") {
      formData.append("scheduleAt", scheduledTime);
    }

    try {
      setLoading(true);
      const res = await PostInstance.post("/addstory", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 201 && res.data.newStory) {
        fetchStories();
        toast.success("Story posted successfully!");
      } else {
        toast.error("Failed to post story.");
      }
    } catch (error) {
      toast.error("Failed to post story.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStory = (userStories) => {
    setOpenStory(userStories);
    setCurrentStoryIndex(0);
    startStoryLoader();
  };

  const startStoryLoader = () => {
    if (storyLoader) clearTimeout(storyLoader);
    setStoryLoader(
      setTimeout(() => {
        handleNextStory();
      },3000)
    );
  };

  const handleNextStory = () => {
    if (!openStory) return;
    if (currentStoryIndex < openStory.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      startStoryLoader();
    } else {
      setOpenStory(null);
    }
  };

  const handlePrevStory = () => {
    if (!openStory) return;
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      startStoryLoader();
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Upload Story Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="self-center">
            Post Story
          </Button>
        </DialogTrigger>
        <DialogContent className="p-6">
          <h2 className="text-lg font-semibold mb-3">Upload a Story</h2>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="block w-full border p-2 rounded mb-3"
          />
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="schedule"
                value="now"
                checked={schedule === "now"}
                onChange={() => setSchedule("now")}
              />
              <span>Post Now</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="schedule"
                value="later"
                checked={schedule === "later"}
                onChange={() => setSchedule("later")}
              />
              <span>Schedule for Later</span>
            </label>
            {schedule === "later" && (
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="border p-2 rounded"
              />
            )}
          </div>
          <Button onClick={handleStoryUpload} disabled={loading} className="mt-4">
            {loading ? "Uploading..." : "Post Story"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Story Circles */}
      <div className="flex h-fit overflow-x-auto space-x-4 p-4 bg-gray-100 rounded-md">
        {fetching ? (
          <p className="text-center text-gray-500">Loading stories...</p>
        ) : stories.length > 0 ? (
          stories.map((group, index) => (
            <div
              key={index}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleOpenStory(group)}
            >
              <img
                src={group.user.profilePicture}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-blue-500 object-cover"
              />
              <p className="text-xs mt-2 text-center max-w-[60px] truncate">
                {group.user.username}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No stories available.</p>
        )}
      </div>

      {/* Story Viewer */}
    {/* Story Viewer */}
{openStory && (
  <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-80 transition-opacity duration-300">
    <div className="relative w-[90%] max-w-lg bg-black p-4 rounded-lg shadow-lg">
      {/* Close Button */}
      <button
        onClick={() => setOpenStory(null)}
        className="absolute top-3 right-3 text-white text-xl bg-gray-900 rounded-full px-3 py-1 hover:bg-gray-700 transition"
      >
        ✕
      </button>

      {/* Username */}
      <p className="text-white text-sm font-semibold mb-2">
        {openStory.user.username}
      </p>

      {/* Loader Bar */}
      <div className="w-full h-1 bg-gray-700 mb-3 rounded overflow-hidden">
        <div
          key={currentStoryIndex}
          className="h-full bg-blue-500 animate-story-progress"
        />
      </div>

      {/* Story Image */}
      <div className="w-full h-[400px] flex justify-center items-center bg-black rounded-md overflow-hidden">
  <img
    src={openStory.stories[currentStoryIndex].mediaUrl}
    alt="Story"
    className="max-h-full max-w-full object-contain"
  />
</div>

      {/* Prev / Next Buttons */}
      <div className="flex justify-between mt-4">
        <Button onClick={handlePrevStory} disabled={currentStoryIndex === 0}>
          Prev
        </Button>
        <Button onClick={handleNextStory}>Next</Button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Stories;
