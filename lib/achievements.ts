export interface AchievementDef {
  id: string
  name: string
  description: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_step", name: "First Step", description: "Complete your first task" },
  { id: "ai_scholar", name: "AI Scholar", description: "Pass your first AI verification" },
  { id: "consistent_router", name: "Consistent Router", description: "Have tasks in all 3 Kanban columns at once" },
  { id: "streak_3", name: "3-Day Streak", description: "Complete tasks 3 days in a row" },
  { id: "quest_master", name: "Quest Master", description: "Complete 5 quests" },
]
