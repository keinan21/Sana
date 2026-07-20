export interface AchievementDef {
  id: string
  name: string
  description: string
  category: "onboarding" | "focused" | "consistent" | "goal_breaker" | "quest_veteran" | "campaign_champ" | "speed_demon"
  tier?: number
  threshold?: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Onboarding
  {
    id: "first_step",
    name: "First Step",
    description: "You completed your first task — the journey begins",
    category: "onboarding",
  },
  {
    id: "ai_scholar",
    name: "AI Scholar",
    description: "Your work passed AI verification — you're on the right track",
    category: "onboarding",
  },
  {
    id: "consistent_router",
    name: "Consistent Router",
    description: "Tasks in every stage — steady progress across all columns",
    category: "onboarding",
  },

  // Focused Learner (tasks completed in a single day)
  {
    id: "focused_t1",
    name: "Focused",
    description: "Complete 5 tasks in a single day",
    category: "focused",
    tier: 1,
    threshold: 5,
  },
  {
    id: "focused_t2",
    name: "Hyperfocused",
    description: "Complete 15 tasks in a single day",
    category: "focused",
    tier: 2,
    threshold: 15,
  },
  {
    id: "focused_t3",
    name: "In the Zone",
    description: "Complete 30 tasks in a single day",
    category: "focused",
    tier: 3,
    threshold: 30,
  },

  // Consistent Scholar (streak days)
  {
    id: "consistent_t1",
    name: "Steady Pace",
    description: "A 3-day learning rhythm",
    category: "consistent",
    tier: 1,
    threshold: 3,
  },
  {
    id: "consistent_t2",
    name: "Growing Momentum",
    description: "A 7-day learning rhythm",
    category: "consistent",
    tier: 2,
    threshold: 7,
  },
  {
    id: "consistent_t3",
    name: "Unstoppable",
    description: "A 14-day learning rhythm",
    category: "consistent",
    tier: 3,
    threshold: 14,
  },

  // Goal Breaker (level milestones)
  {
    id: "goal_breaker_t1",
    name: "Milestone I",
    description: "Reach Level 3",
    category: "goal_breaker",
    tier: 1,
    threshold: 3,
  },
  {
    id: "goal_breaker_t2",
    name: "Milestone II",
    description: "Reach Level 7",
    category: "goal_breaker",
    tier: 2,
    threshold: 7,
  },
  {
    id: "goal_breaker_t3",
    name: "Milestone III",
    description: "Reach Level 15",
    category: "goal_breaker",
    tier: 3,
    threshold: 15,
  },

  // Quest Veteran (verified quests)
  {
    id: "quest_veteran_t1",
    name: "First Proof",
    description: "Verify your first quest",
    category: "quest_veteran",
    tier: 1,
    threshold: 1,
  },
  {
    id: "quest_veteran_t2",
    name: "Proven Track Record",
    description: "Verify 5 quests",
    category: "quest_veteran",
    tier: 2,
    threshold: 5,
  },
  {
    id: "quest_veteran_t3",
    name: "Master of Proofs",
    description: "Verify 15 quests",
    category: "quest_veteran",
    tier: 3,
    threshold: 15,
  },

  // Campaign Champion (completed campaigns)
  {
    id: "campaign_champ_t1",
    name: "Goal Achiever",
    description: "Complete your first campaign",
    category: "campaign_champ",
    tier: 1,
    threshold: 1,
  },
  {
    id: "campaign_champ_t2",
    name: "Serial Achiever",
    description: "Complete 3 campaigns",
    category: "campaign_champ",
    tier: 2,
    threshold: 3,
  },
  {
    id: "campaign_champ_t3",
    name: "Campaign Legend",
    description: "Complete 5 campaigns",
    category: "campaign_champ",
    tier: 3,
    threshold: 5,
  },

  // Speed Demon (quests completed before estimate)
  {
    id: "speed_demon_t1",
    name: "Ahead of Schedule",
    description: "Complete 1 quest before its estimated deadline",
    category: "speed_demon",
    tier: 1,
    threshold: 1,
  },
  {
    id: "speed_demon_t2",
    name: "Speed Runner",
    description: "Complete 5 quests before their estimated deadlines",
    category: "speed_demon",
    tier: 2,
    threshold: 5,
  },
  {
    id: "speed_demon_t3",
    name: "Time Lord",
    description: "Complete 15 quests before their estimated deadlines",
    category: "speed_demon",
    tier: 3,
    threshold: 15,
  },
]

export function getAchievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
