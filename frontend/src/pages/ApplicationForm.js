import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
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
    high_profile_violation: "",
    complex_mechanic: "",
    unknown_question: "",
    hero_development: "",
    racist_r4: "",
    moderator_swearing: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert age to number
      const submitData = {
        ...formData,
        age: parseInt(formData.age)
      };

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
    { name: "discord_tools_comfort", label: "What is your comfort level with using discord moderation tools & bots?", type: "textarea", required: true },
    { name: "guidelines_rating", label: "Rate your understanding of community guidelines enforcement and conflict resolution. (Be honest, you will be tested)", type: "textarea", required: true },
    { name: "high_profile_violation", label: "How would you handle a situation where a high-profile user repeatedly violates the community rules?", type: "textarea", required: true },
    { name: "complex_mechanic", label: "Describe a complex game mechanic you understand well.", type: "textarea", required: true },
    { name: "unknown_question", label: "A new player asks a question you don't know the answer to. What do you do?", type: "textarea", required: true },
    { name: "hero_development", label: "What advice would you give a new player struggling with hero development?", type: "textarea", required: true },
    { name: "racist_r4", label: "You see your R4's being racist to another player in Alliance chat on your main server. How would you handle the situation?", type: "textarea", required: true },
    { name: "moderator_swearing", label: "In a shared language channel you see another moderator swearing and joking with players. How would you approach this situation?", type: "textarea", required: true }
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
          
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide mb-4 text-emerald-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              🛡️ In-Game & Discord Moderators Needed!
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed max-w-4xl mx-auto">
              Are you passionate about Top War and want to help shape the community? We're looking for motivated, knowledgeable players to join our moderation team and support both the in-game environment and the official Discord server. If you love the game and enjoy helping others, this could be the perfect role for you! 💥
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Requirements */}
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-2xl font-bold uppercase tracking-wide mb-4 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                🎯 Requirements
              </h3>
              <p className="text-slate-400 mb-4">To apply, you must meet all of the following:</p>
              <ul className="space-y-2 text-slate-300">
                <li>🎂 Aged 21+</li>
                <li>🔥 At least one Level 100 Top War account</li>
                <li>🎮 Strong knowledge of gameplay, features, mechanics & events</li>
                <li>🗨️ Active Discord account</li>
                <li>🏛️ Must already be a member of the official Top War Discord server</li>
                <li>🤝 Friendly, fair, consistent, and able to stay calm in tough situations</li>
              </ul>
            </div>

            {/* Why Become a Moderator */}
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-2xl font-bold uppercase tracking-wide mb-4 text-emerald-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                ✨ Why Become a Moderator?
              </h3>
              <p className="text-slate-400 mb-4">Being a moderator isn't just a role, it's a chance to make a real impact. Here's what you can gain:</p>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>🌍 Help shape the community by keeping it safe, active, and welcoming</li>
                <li>🤝 Support fellow players, answer questions, and guide new commanders</li>
                <li>🧠 Develop problem-solving & communication skills</li>
                <li>🏆 Be part of an official moderation team recognised for its contributions</li>
                <li>🚀 Early access to information and insight into community trends</li>
                <li>💬 A chance to work closely with other passionate players and staff</li>
                <li>⭐ Make Top War a better place for thousands of players</li>
              </ul>
            </div>

            {/* What You'll Be Doing */}
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-2xl font-bold uppercase tracking-wide mb-4 text-blue-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                🛠️ What You'll Be Doing
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li>🔎 Monitoring chat and community spaces</li>
                <li>❗ Handling player reports & escalating issues</li>
                <li>📝 Ensuring rules are followed consistently</li>
                <li>🙋 Assisting players with questions or gameplay issues</li>
                <li>🧹 Helping keep discussions positive and organised</li>
                <li>📣 Supporting events, announcements, and community initiatives</li>
              </ul>
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
            {questions.map((question, index) => (
              <div key={question.name} className="space-y-2">
                <Label htmlFor={question.name} className="text-slate-300 font-medium">
                  {index + 1}. {question.label}
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
            ))}

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
      </div>
    </div>
  );
}