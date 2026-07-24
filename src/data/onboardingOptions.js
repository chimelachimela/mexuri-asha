import { Briefcase, GraduationCap, CalendarDays, Users, FlaskConical, MessageSquareHeart, Heart } from "lucide-react";

export const USE_CASES = [
  { id: "business", label: "Business", icon: Briefcase, blurb: "Customer & market research" },
  { id: "school", label: "School", icon: GraduationCap, blurb: "Classes, projects, feedback" },
  { id: "events", label: "Event Surveys", icon: CalendarDays, blurb: "Attendee feedback & planning" },
  { id: "community", label: "Community", icon: Users, blurb: "Groups, clubs, memberships" },
  { id: "research", label: "Research", icon: FlaskConical, blurb: "Studies & structured data" },
  { id: "product_feedback", label: "Product Feedback", icon: MessageSquareHeart, blurb: "Features, usability, NPS" },
  { id: "nonprofit", label: "Nonprofit / NGO", icon: Heart, blurb: "Programs & impact tracking" },
];

export const RESPONSE_STYLES = [
  { id: "casual", label: "Casual", blurb: "Friendly, relaxed, conversational" },
  { id: "corporate", label: "Corporate", blurb: "Formal, structured, professional" },
  { id: "analytical", label: "Analytical", blurb: "Data-first, precise, methodical" },
  { id: "concise", label: "Concise", blurb: "Short, direct, no fluff" },
];
