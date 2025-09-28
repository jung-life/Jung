# Emotional Assessment Question Bank System

## Overview
The emotional assessment now uses an intelligent question bank with rotation to ensure users receive varied, personalized questions each time they take an assessment.

## Key Features

### 🗃️ Question Bank
- **20+ carefully crafted questions** across 10 categories
- **3 difficulty levels**: Basic, Intermediate, Advanced
- **Weighted selection** for balanced assessments
- **Tagged questions** for precise categorization

### 🔄 Smart Rotation
- **Avoids recent questions** (last 30 days)
- **Category balancing** ensures comprehensive coverage
- **Progressive difficulty** based on user experience
- **Frequency tracking** prevents overuse of questions

### 📊 Analytics & Tracking
- **Usage statistics** for each question and category
- **User level progression** (Beginner → Intermediate → Advanced)
- **Assessment history** with detailed tracking
- **Visual progress charts** and insights

## Question Categories

1. **Social** - Social interactions and relationships
2. **Work** - Professional situations and workplace dynamics
3. **Personal** - Self-reflection and personal growth
4. **Stress** - Pressure situations and time management
5. **Relationships** - Romantic and family relationships
6. **Achievement** - Success, recognition, and accomplishments
7. **Conflict** - Disagreements and confrontations
8. **Change** - Transitions and life changes
9. **Self-Reflection** - Deep introspection and values
10. **Family** - Family dynamics and relationships

## Difficulty Levels

### Basic (Beginner Level)
- Simple scenarios with clear emotional responses
- Common situations most people encounter
- Straightforward emotion identification

### Intermediate (Developing Awareness)
- More complex emotional situations
- Multiple valid emotional responses
- Requires deeper self-reflection

### Advanced (High Emotional Intelligence)
- Nuanced emotional scenarios
- Complex interpersonal dynamics
- Sophisticated emotional understanding required

## Smart Selection Algorithm

### Factors Considered:
1. **Recency** - Questions asked in last 30 days get lower priority
2. **Frequency** - Often-used questions get reduced weight
3. **Category Balance** - Ensures coverage across all emotional domains
4. **User Level** - Adjusts difficulty based on experience
5. **Assessment Type** - Quick (5 questions) vs Comprehensive (10 questions)

### Selection Process:
1. Load user's question history and determine experience level
2. Filter questions by difficulty appropriate for user level
3. Remove recently asked questions (configurable timeframe)
4. Apply category balancing for comprehensive coverage
5. Use weighted random selection with preference scoring
6. Save selected questions to history for future rotation

## User Experience Benefits

### For New Users:
- **Basic difficulty questions** to build confidence
- **Broad category coverage** for comprehensive profiling
- **Fresh experience** every time

### For Experienced Users:
- **Advanced questions** for deeper insights
- **Avoided repetition** of recently answered questions
- **Progressive difficulty** as emotional awareness grows

### For All Users:
- **Personalized selection** based on individual history
- **Balanced assessments** across emotional domains
- **Visual feedback** on question usage and progress

## Technical Implementation

### Files Created:
- `src/data/emotionalQuestionBank.ts` - Complete question database
- `src/lib/questionRotationService.ts` - Intelligent selection logic
- Enhanced `EmotionalAssessmentScreen.tsx` - UI integration

### Data Storage:
- **AsyncStorage** for question history and user preferences
- **Encrypted database** for assessment results
- **Local caching** for offline functionality

### Performance:
- **Efficient selection algorithms** with O(n) complexity
- **Minimal storage footprint** with history trimming
- **Fast loading** with cached statistics

## Future Enhancements

### Planned Features:
- **Custom question creation** for therapists/coaches
- **Seasonal/contextual questions** based on time/events
- **Collaborative filtering** for question recommendations
- **Machine learning** for optimal question selection
- **Multi-language support** for global accessibility

### Analytics Improvements:
- **Trend analysis** across assessment history
- **Emotional journey mapping** over time
- **Comparative analysis** with anonymized user base
- **Predictive insights** for emotional patterns

## Benefits Summary

✅ **Variety** - 20+ questions ensure fresh experiences
✅ **Personalization** - Smart selection based on user history
✅ **Balance** - Even coverage across emotional categories
✅ **Progression** - Difficulty adapts to user growth
✅ **Insights** - Rich analytics for user and system understanding
✅ **Scalability** - Easy to add new questions and categories
✅ **Privacy** - Local storage with encrypted cloud backup

The question bank system transforms the emotional assessment from a static experience into a dynamic, personalized journey that grows with the user's emotional intelligence and self-awareness.