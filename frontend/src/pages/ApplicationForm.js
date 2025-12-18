import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    discord_handle: "",
    ingame_name: "",
    age: "",
    country: "",
    activity_times: "",
    server: "",
    native_language: "",
    other_languages: "",
    previous_experience: "",
    basic_qualities: "",
    favourite_event: "",
    free_gems: "",
    heroes_mutated: "",
    discord_tools_comfort: "",
    guidelines_rating: "",
    complex_mechanic: "",
    unknown_question: "",
    hero_development: "",
    racist_r4: "",
    moderator_swearing: "",
    // Discord-specific questions
    discord_moderation_tools: "",
    discord_spam_handling: "",
    discord_bots_experience: "",
    discord_harassment_handling: "",
    discord_voice_channel_management: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Show confirmation dialog instead of submitting immediately
    setShowConfirmation(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmation(false);
    setLoading(true);

    try {
      // Convert age to number
      const submitData = {
        ...formData,
        age: parseInt(formData.age)
      };

      // If position is "In-Game", set discord_tools_comfort to N/A
      if (formData.position === "In-Game") {
        submitData.discord_tools_comfort = "N/A";
      }

      // If position is "Discord", set in-game questions to N/A
      if (formData.position === "Discord") {
        submitData.hero_development = "N/A";
        submitData.racist_r4 = "N/A";
        submitData.moderator_swearing = "N/A";
      }

      // If position is "In-Game", set Discord-specific questions to N/A
      if (formData.position === "In-Game") {
        submitData.discord_moderation_tools = "N/A";
        submitData.discord_spam_handling = "N/A";
        submitData.discord_bots_experience = "N/A";
        submitData.discord_harassment_handling = "N/A";
        submitData.discord_voice_channel_management = "N/A";
      }

      await axios.post(`${API}/applications`, submitData);
      toast.success("Application submitted successfully! You will be notified of the decision.");
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const questions = [
    { name: "name", label: "What is your name?", type: "text", required: true },
    { name: "position", label: "Which position are you applying for?", type: "select", required: true, options: ["In-Game", "Discord", "Both"] },
    { name: "discord_handle", label: "Discord Handle", type: "text", required: true },
    { name: "ingame_name", label: "In-Game Name", type: "text", required: true },
    { name: "age", label: "Age", type: "number", required: true, min: 21, max: 100 },
    { name: "country", label: "Country of residence", type: "text", required: true },
    { name: "activity_times", label: "What are your typical activity times per day? i.e. Reset - 5 to reset.", type: "text", required: true },
    { name: "server", label: "What server are you in? Only write your main Warzone", type: "number", required: true, min: 1 },
    { name: "native_language", label: "What is your native language?", type: "text", required: true },
    { name: "other_languages", label: "What other languages do you speak?", type: "text", required: true },
    { name: "previous_experience", label: "Describe your previous experience with online moderation, if any (platforms, roles, duration).", type: "textarea", required: true },
    { name: "basic_qualities", label: "What do you think are the most basic qualities that a mod should possess?", type: "textarea", required: true },
    { name: "favourite_event", label: "What is your favourite in-game event, and why?", type: "textarea", required: true },
    { name: "free_gems", label: "What are the free ways to gain gems?", type: "textarea", required: true },
    { name: "heroes_mutated", label: "How many heroes can be mutated? (Numerical)", type: "text", required: true },
    { name: "discord_tools_comfort", label: "What is your comfort level with using discord moderation tools & bots?", type: "rating", required: true },
    { name: "guidelines_rating", label: "Rate your understanding of community guidelines enforcement and conflict resolution. (Be honest, you will be tested)", type: "textarea", required: true },
    { name: "complex_mechanic", label: "Describe a complex game mechanic you understand well.", type: "textarea", required: true },
    { name: "unknown_question", label: "A new player asks a question you don't know the answer to. What do you do?", type: "textarea", required: true },
    { name: "hero_development", label: "What advice would you give a new player struggling with hero development?", type: "textarea", required: true },
    { name: "racist_r4", label: "You see your R4's being racist to another player in Alliance chat on your main server. How would you handle the situation?", type: "textarea", required: true },
    { name: "moderator_swearing", label: "In a shared language channel you see another moderator swearing and joking with players. How would you approach this situation?", type: "textarea", required: true },
    // Discord-specific questions - only shown for Discord or Both positions
    { name: "discord_moderation_tools", label: "Are you familiar with Discord's moderation tools (e.g., roles, permissions, bans, mutes)? Please describe your experience.", type: "textarea", required: true, discordOnly: true },
    { name: "discord_spam_handling", label: "How would you handle a situation where someone is spamming in multiple channels?", type: "textarea", required: true, discordOnly: true },
    { name: "discord_bots_experience", label: "Do you know how to use bots for moderation (e.g., setting up auto-moderation, commands)? If yes, which bots have you used?", type: "textarea", required: true, discordOnly: true },
    { name: "discord_harassment_handling", label: "What steps would you take if a user reports harassment through Discord DMs?", type: "textarea", required: true, discordOnly: true },
    { name: "discord_voice_channel_management", label: "Are you comfortable managing voice channels (e.g., moving users, muting, handling disruptions)?", type: "textarea", required: true, discordOnly: true }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Button
          data-testid="back-btn"
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-8 text-amber-500 hover:text-amber-400 hover:bg-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Recruitment Information */}
        <div className="glass-card rounded-lg p-8 md:p-12 mb-8 border-2 border-amber-500/30">
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wider mb-6 text-amber-500 text-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            🌟 TOP WAR MODERATOR RECRUITMENT! 🌟
          </h1>
          
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-emerald-400 text-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              🛡️ In-Game & Discord Moderators Needed!
            </h2>
            
            <div className="space-y-6 text-slate-300 leading-relaxed max-w-5xl mx-auto">
              <p className="text-lg">
                Are you passionate about Top War and want to help shape the community? We're looking for motivated, knowledgeable players to join our moderation team and support both the in-game environment and the official Discord server. If you love the game and enjoy helping others, this could be the perfect role for you! 💥
              </p>

              <div>
                <h3 className="text-xl font-bold uppercase tracking-wide mb-3 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  🎯 Requirements
                </h3>
                <p className="mb-3">To apply, you must meet all of the following:</p>
                <div className="space-y-2 pl-4">
                  <p>🎂 Aged 21+</p>
                  <p>🔥 At least one Level 100 Top War account</p>
                  <p>🎮 Strong knowledge of gameplay, features, mechanics & events</p>
                  <p>🗨️ Active Discord account</p>
                  <p>🏛️ Must already be a member of the official Top War Discord server</p>
                  <p>🤝 Friendly, fair, consistent, and able to stay calm in tough situations</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold uppercase tracking-wide mb-3 text-emerald-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  ✨ Why Become a Moderator?
                </h3>
                <p className="mb-3">Being a moderator isn't just a role, it's a chance to make a real impact. Here's what you can gain:</p>
                <div className="space-y-2 pl-4">
                  <p>🌍 Help shape the community by keeping it safe, active, and welcoming</p>
                  <p>🤝 Support fellow players, answer questions, and guide new commanders</p>
                  <p>🧠 Develop problem-solving & communication skills</p>
                  <p>🏆 Be part of an official moderation team recognised for its contributions</p>
                  <p>🚀 Early access to information and insight into community trends</p>
                  <p>💬 A chance to work closely with other passionate players and staff</p>
                  <p>⭐ Make Top War a better place for thousands of players</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold uppercase tracking-wide mb-3 text-blue-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  🛠️ What You'll Be Doing
                </h3>
                <div className="space-y-2 pl-4">
                  <p>🔎 Monitoring chat and community spaces</p>
                  <p>❗ Handling player reports & escalating issues</p>
                  <p>📝 Ensuring rules are followed consistently</p>
                  <p>🙋 Assisting players with questions or gameplay issues</p>
                  <p>🧹 Helping keep discussions positive and organised</p>
                  <p>📣 Supporting events, announcements, and community initiatives</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="glass-card rounded-lg p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Moderator Application
          </h1>
          <p className="text-slate-400 mb-8">
            Complete all fields to submit your application. Be thorough and honest.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="application-form">
            {questions.map((question, index) => {
              // Hide question 16 (discord_tools_comfort) if position is "In-Game"
              if (question.name === "discord_tools_comfort" && formData.position === "In-Game") {
                return null;
              }
              
              // Hide questions 20, 21, 22 (hero_development, racist_r4, moderator_swearing) if position is "Discord"
              if (formData.position === "Discord" && 
                  (question.name === "hero_development" || question.name === "racist_r4" || question.name === "moderator_swearing")) {
                return null;
              }

              // Hide Discord-specific questions if position is "In-Game"
              if (question.discordOnly && formData.position === "In-Game") {
                return null;
              }

              // Hide Discord-specific questions if position is not selected yet
              if (question.discordOnly && !formData.position) {
                return null;
              }
              
              // Calculate visible question number
              const visibleQuestions = questions.filter((q, i) => {
                if (i >= index) return false;
                if (q.name === "discord_tools_comfort" && formData.position === "In-Game") return false;
                if (formData.position === "Discord" && (q.name === "hero_development" || q.name === "racist_r4" || q.name === "moderator_swearing")) return false;
                if (q.discordOnly && formData.position === "In-Game") return false;
                if (q.discordOnly && !formData.position) return false;
                return true;
              });
              const visibleQuestionNumber = visibleQuestions.length + 1;
              
              return (
                <div key={question.name} className="space-y-2">
                  <Label htmlFor={question.name} className="text-slate-300 font-medium">
                    {visibleQuestionNumber}. {question.label}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                {question.type === "textarea" ? (
                  <Textarea
                    id={question.name}
                    name={question.name}
                    data-testid={`input-${question.name}`}
                    value={formData[question.name]}
                    onChange={handleChange}
                    required={question.required}
                    className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 min-h-[100px] rounded-sm"
                    placeholder="Type your answer here..."
                  />
                ) : question.type === "select" ? (
                  <Select
                    value={formData[question.name]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, [question.name]: value }))}
                    required={question.required}
                  >
                    <SelectTrigger 
                      data-testid={`input-${question.name}`}
                      className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
                    >
                      <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {question.options.map((option) => (
                        <SelectItem key={option} value={option} className="text-slate-200">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : question.type === "rating" ? (
                  <div className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-4 py-2 w-full">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        data-testid={`rating-${rating}`}
                        onClick={() => setFormData(prev => ({ ...prev, [question.name]: rating.toString() }))}
                        className={`flex flex-col items-center gap-1 sm:gap-2 px-1 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 rounded-sm border-2 transition-all ${
                          formData[question.name] === rating.toString()
                            ? 'border-amber-500 bg-amber-500/20 text-amber-500'
                            : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-lg sm:text-2xl md:text-3xl font-bold">{rating}</span>
                        <span className="text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wide text-center leading-tight">
                          {rating === 1 ? 'Novice' : rating === 2 ? 'Beginner' : rating === 3 ? 'Inter' : rating === 4 ? 'Adv' : 'Expert'}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input
                    id={question.name}
                    name={question.name}
                    data-testid={`input-${question.name}`}
                    type={question.type}
                    value={formData[question.name]}
                    onChange={handleChange}
                    required={question.required}
                    min={question.min}
                    max={question.max}
                    className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
                    placeholder="Type your answer here..."
                  />
                )}
                </div>
              );
            })}

            <Button
              data-testid="submit-application-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide py-6 text-lg rounded-sm btn-glow mt-8"
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-slate-200" data-testid="confirmation-dialog">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                <AlertCircle className="h-6 w-6" />
                Confirm Your Discord Handle
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Please verify your information before submitting
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Discord Handle Confirmation */}
              <div className="bg-slate-800/50 p-6 rounded-lg border-2 border-amber-500/30">
                <p className="text-slate-400 mb-2">Your Discord Handle:</p>
                <p className="text-2xl font-bold text-amber-500 mono" data-testid="discord-handle-display">
                  {formData.discord_handle || "Not provided"}
                </p>
              </div>

              {/* Important Notice */}
              <div className="bg-blue-500/10 border-2 border-blue-500/50 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-blue-400 uppercase tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Important: Discord Messages
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      Feedback regarding your application will be sent to your registered Discord account. 
                      <span className="font-bold text-amber-400"> Please ensure you are accepting direct messages</span>, 
                      otherwise you may not receive feedback about your application status.
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation Question */}
              <div className="text-center">
                <p className="text-lg text-slate-300">
                  Is your Discord Handle <span className="font-bold text-amber-500">{formData.discord_handle}</span> correct?
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                data-testid="cancel-btn"
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Go Back & Edit
              </Button>
              <Button
                data-testid="confirm-submit-btn"
                onClick={handleConfirmedSubmit}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide px-8 rounded-sm btn-glow"
              >
                {loading ? "Submitting..." : "Confirm & Submit Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}