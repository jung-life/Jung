// Extended emotions and scenarios for the emotional assessment
export const extendedEmotions = [
  // Primary emotions (Plutchik's wheel)
  'joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise', 'trust', 'anticipation',
  
  // Secondary emotions
  'contentment', 'melancholy', 'frustration', 'anxiety', 'aversion', 'wonder', 
  'acceptance', 'optimism', 'disappointment', 'resentment', 'worry', 'revulsion',
  'amazement', 'admiration', 'eagerness', 'curiosity', 'satisfaction', 'nostalgia',
  'irritation', 'apprehension', 'discomfort', 'astonishment', 'appreciation', 'excitement',
  
  // Complex emotions
  'gratitude', 'guilt', 'shame', 'pride', 'envy', 'jealousy', 'love', 'grief',
  'regret', 'hope', 'boredom', 'confusion', 'awe', 'compassion', 'empathy', 'loneliness',
  'embarrassment', 'inspiration', 'serenity', 'despair', 'overwhelm', 'relief',
  'inadequacy', 'indignation'
];

export const additionalScenarios = [
  {
    id: 'scenario_6',
    question: "You discover a close friend has been keeping a significant secret from you. How do you primarily feel?",
    options: [
      { emotion: 'hurt', text: "I feel betrayed and wounded by their lack of trust in me" },
      { emotion: 'curiosity', text: "I'm curious about why they felt they needed to keep this from me" },
      { emotion: 'anger', text: "I'm angry they didn't think I could handle the truth" },
      { emotion: 'compassion', text: "I feel compassion for what they must have been going through alone" }
    ]
  },
  {
    id: 'scenario_7',
    question: "You've been working toward a goal for months and finally achieve it. What's your strongest emotional reaction?",
    options: [
      { emotion: 'pride', text: "I feel proud of my perseverance and accomplishment" },
      { emotion: 'relief', text: "I'm relieved the pressure is finally off" },
      { emotion: 'joy', text: "I feel pure joy and celebration in the moment" },
      { emotion: 'anticipation', text: "I'm already thinking about what's next and how to build on this" }
    ]
  },
  {
    id: 'scenario_8',
    question: "You witness someone being treated unfairly. What's your emotional response?",
    options: [
      { emotion: 'anger', text: "I feel angry at the injustice and want to intervene" },
      { emotion: 'empathy', text: "I feel deep empathy for the person being mistreated" },
      { emotion: 'anxiety', text: "I feel anxious about the conflict and uncomfortable with the situation" },
      { emotion: 'resignation', text: "I feel a sense of resigned sadness about how people treat each other" }
    ]
  },
  {
    id: 'scenario_9',
    question: "You're about to embark on something completely new and outside your comfort zone. How do you feel?",
    options: [
      { emotion: 'excitement', text: "I feel excited about the adventure and opportunity for growth" },
      { emotion: 'fear', text: "I feel fearful about failing or looking foolish" },
      { emotion: 'determination', text: "I feel determined to meet the challenge head-on" },
      { emotion: 'ambivalence', text: "I feel a mix of interest and hesitation that's hard to untangle" }
    ]
  },
  {
    id: 'scenario_10',
    question: "You've made a mistake that negatively impacted someone else. What's your predominant feeling?",
    options: [
      { emotion: 'guilt', text: "I feel guilty and responsible for causing harm" },
      { emotion: 'shame', text: "I feel ashamed and like I am a bad person" },
      { emotion: 'defensiveness', text: "I feel defensive and want to explain my side" },
      { emotion: 'determination', text: "I feel determined to make it right and learn from it" }
    ]
  },
  {
    id: 'scenario_11',
    question: "You receive an unexpected gift from someone. How do you feel?",
    options: [
      { emotion: 'joy', text: "I feel happy and appreciative of their thoughtfulness" },
      { emotion: 'surprise', text: "I'm surprised and curious about their motivation" },
      { emotion: 'discomfort', text: "I feel a bit uncomfortable and obligated to reciprocate" },
      { emotion: 'suspicion', text: "I'm a bit suspicious about why they're giving me something" }
    ]
  },
  {
    id: 'scenario_12',
    question: "You're stuck in heavy traffic and running late for an important meeting. What do you feel?",
    options: [
      { emotion: 'frustration', text: "I feel frustrated and helpless in the situation" },
      { emotion: 'anxiety', text: "I feel anxious about the consequences of being late" },
      { emotion: 'anger', text: "I feel angry at the circumstances or other drivers" },
      { emotion: 'acceptance', text: "I accept what I can't change and focus on solutions" }
    ]
  },
  {
    id: 'scenario_13',
    question: "Someone gives you critical feedback on something you worked hard on. Your initial feeling is:",
    options: [
      { emotion: 'hurt', text: "I feel hurt and take it personally" },
      { emotion: 'curiosity', text: "I'm curious to understand their perspective better" },
      { emotion: 'defensiveness', text: "I feel defensive and want to justify my choices" },
      { emotion: 'gratitude', text: "I appreciate the opportunity to improve, even if it stings" }
    ]
  },
  {
    id: 'scenario_14',
    question: "You have unstructured free time with nothing scheduled. How does this make you feel?",
    options: [
      { emotion: 'freedom', text: "I feel a sense of freedom and possibility" },
      { emotion: 'anxiety', text: "I feel anxious without structure or productivity" },
      { emotion: 'boredom', text: "I quickly feel bored and restless" },
      { emotion: 'contentment', text: "I feel content and relieved to have downtime" }
    ]
  },
  {
    id: 'scenario_15',
    question: "You're reminded of a significant loss in your life. What emotion surfaces first?",
    options: [
      { emotion: 'sadness', text: "I feel a deep sadness and sense of absence" },
      { emotion: 'gratitude', text: "I feel gratitude for what that person or experience gave me" },
      { emotion: 'nostalgia', text: "I feel nostalgic, recalling meaningful memories" },
      { emotion: 'avoidance', text: "I feel uncomfortable and try to push the thoughts away" }
    ]
  },
  {
    id: 'scenario_16',
    question: "Someone you care about is going through a difficult time. How do you primarily feel?",
    options: [
      { emotion: 'empathy', text: "I deeply feel their pain as if it were my own" },
      { emotion: 'helplessness', text: "I feel helpless that I can't fix things for them" },
      { emotion: 'compassion', text: "I feel compassionate and want to support them however I can" },
      { emotion: 'anxiety', text: "I feel anxious about saying or doing the wrong thing" }
    ]
  },
  {
    id: 'scenario_17',
    question: "You're watching a sunset or experiencing something beautiful in nature. What do you feel?",
    options: [
      { emotion: 'awe', text: "I feel a sense of awe and wonder at the beauty" },
      { emotion: 'peace', text: "I feel peaceful and at one with my surroundings" },
      { emotion: 'inspiration', text: "I feel inspired and creatively stimulated" },
      { emotion: 'insignificance', text: "I feel small but in a meaningful way" }
    ]
  },
  {
    id: 'scenario_18',
    question: "You're trying to explain something important but the other person clearly isn't understanding. How do you feel?",
    options: [
      { emotion: 'frustration', text: "I feel frustrated that they're not getting it" },
      { emotion: 'determination', text: "I feel determined to find a better way to explain" },
      { emotion: 'doubt', text: "I start to doubt my own understanding or ability to communicate" },
      { emotion: 'impatience', text: "I feel impatient and want to move on" }
    ]
  },
  {
    id: 'scenario_19',
    question: "You observe someone else receiving recognition for work that was partially yours. What's your reaction?",
    options: [
      { emotion: 'injustice', text: "I feel a sense of injustice and want to set the record straight" },
      { emotion: 'resentment', text: "I feel resentful toward the person receiving credit" },
      { emotion: 'disappointment', text: "I feel disappointed that my contribution wasn't acknowledged" },
      { emotion: 'acceptance', text: "I accept that recognition isn't always fair and focus on my own satisfaction" }
    ]
  },
  {
    id: 'scenario_20',
    question: "You're confronted with a moral dilemma where there's no clear right answer. How do you feel?",
    options: [
      { emotion: 'conflict', text: "I feel internal conflict and torn between options" },
      { emotion: 'anxiety', text: "I feel anxious about making the wrong choice" },
      { emotion: 'curiosity', text: "I feel curious to explore different perspectives" },
      { emotion: 'confidence', text: "I trust my inner compass to guide me to the right decision" }
    ]
  },
];

export const emotionalChallenges = [
  {
    challenge: "Accepting uncertainty",
    description: "Practice sitting with the unknown without immediately seeking resolution. Notice your emotional response to uncertainty.",
    prompt: "What feelings arise when you can't predict an outcome?"
  },
  {
    challenge: "Expressing vulnerability",
    description: "Share something you're struggling with to someone you trust. Notice how you feel before, during, and after.",
    prompt: "How comfortable are you showing your authentic emotions to others?"
  },
  {
    challenge: "Practicing gratitude",
    description: "Each day, identify three things you're genuinely grateful for, focusing on the emotion that accompanies recognition.",
    prompt: "How does deliberate gratitude affect your emotional state?"
  },
  {
    challenge: "Sitting with difficult emotions",
    description: "When a challenging emotion arises, observe it with curiosity rather than trying to change or escape it.",
    prompt: "Which emotions do you find hardest to simply experience without reacting to?"
  },
  {
    challenge: "Mindful emotional awareness",
    description: "Set reminders to pause throughout the day and name the emotions you're experiencing in that moment.",
    prompt: "How often do you go through your day without noticing your emotional state?"
  }
];

export const emotionalInsights = [
  {
    title: "The wisdom of negative emotions",
    content: "What society labels as 'negative' emotions—anger, sadness, fear—contain vital information and energy. Anger often signals boundary violations, sadness reflects what we value, and fear highlights what we need to protect. Instead of avoiding these emotions, try viewing them as messengers rather than enemies."
  },
  {
    title: "Emotional complexity and mixed feelings",
    content: "The most profound experiences in life often evoke seemingly contradictory emotions simultaneously. You might feel both grief and relief when a difficult relationship ends, or both pride and anxiety when taking on a new responsibility. This emotional complexity is not confusion but richness—a sign you're experiencing the full spectrum of your humanity."
  },
  {
    title: "The relationship between thoughts and emotions",
    content: "Emotions are influenced by thoughts but are not the same thing. A thought like 'I made a mistake' can trigger shame, disappointment, or even relief depending on your underlying beliefs. By becoming aware of the interpretations that bridge events and emotions, you gain greater emotional flexibility."
  },
  {
    title: "Emotional authenticity versus expression",
    content: "Being emotionally authentic doesn't mean expressing every feeling in every situation. It means acknowledging your true emotions to yourself, and then making conscious choices about how, when, and with whom to express them. This balance honors both your emotional truth and the context of your relationships."
  },
  {
    title: "Emotions as connectors",
    content: "While we often experience emotions as deeply personal, they actually serve as bridges between people. Shared joy amplifies celebration, and vulnerably expressed sadness invites comfort. When you allow others to witness your authentic emotional experience, you create opportunities for connection that transcend logical understanding."
  }
];
