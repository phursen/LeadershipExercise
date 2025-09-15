# Electric Maze Exercise

A collaborative team-building exercise where teams work together to navigate through an electric maze. This React-based application provides real-time collaboration features and analytics to track team performance.

## 🎯 Game Overview

The Electric Maze is a team exercise designed to promote communication, collaboration, and strategic thinking. Teams must work together to find the correct path through an 8x8 grid while avoiding "electric" squares that reset their progress.

## 🎮 Game Rules

### Objective
Navigate from the starting position to the end of the maze by revealing the correct path squares while avoiding electric (incorrect) squares.

### How to Play

1. **Team Formation**: Create teams using the Control Panel on the right side of the screen
2. **Select Active Team**: Choose which team is currently playing from the dropdown
3. **Navigate the Maze**: Click on squares in the 8x8 grid to reveal them
4. **Path Discovery**: 
   - ✅ **Green squares** = Correct path - continue forward
   - ❌ **Red squares** = Electric/incorrect - team must start over
   - ⚪ **Gray squares** = Unrevealed squares
5. **Team Collaboration**: Multiple team members can participate simultaneously
6. **Completion**: Successfully navigate from start to finish without hitting electric squares

### Game Mechanics

- **One Square at a Time**: Teams can only reveal one square at a time
- **Sequential Movement**: Must follow a connected path (no jumping across the grid)
- **Reset on Mistake**: Hitting an electric square resets the team's progress
- **Real-time Updates**: All team members see changes instantly
- **Performance Tracking**: Analytics track mistakes, time, and progress

## 🔧 Maze Configuration

### Setting Up the Maze Path

1. **Enable Configuration Mode**:
   - Click the "Config Mode" toggle in the Control Panel
   - This allows facilitators to set up the correct path

2. **Design the Path**:
   
   **Basic Path Creation:**
   - Click squares to toggle them between three states:
     - ⚪ **Unrevealed** (default) - neutral squares teams can click
     - 🟢 **Path** (green) - correct squares that advance progress
     - 🔴 **Electric** (red) - incorrect squares that reset team progress
   
   **Path Design Principles:**
   - Create a **single continuous path** from start to finish
   - Path squares must be **adjacent** (horizontally or vertically connected)
   - **No diagonal connections** - teams can only move up, down, left, or right
   - Ensure the path is **solvable** by testing it yourself first
   
   **Strategic Design Elements:**
   - **Decision Points**: Create intersections where teams must choose direction
   - **False Paths**: Add short green paths that lead to dead ends
   - **Electric Traps**: Place red squares adjacent to the correct path
   - **Bottlenecks**: Narrow passages that require careful navigation
   - **Misdirection**: Use visual patterns that suggest incorrect routes

3. **Path Guidelines**:
   
   **Positioning:**
   - **Start Position**: Typically top-left corner (0,0) or top row
   - **End Position**: Typically bottom-right corner (7,7) or bottom row
   - **Path Length**: Aim for 12-20 squares for optimal challenge
   - **Width Variation**: Mix narrow (1 square) and wider (2-3 squares) sections
   
   **Difficulty Scaling:**
   - **Beginner (Easy)**: 
     - Simple L-shape or straight path
     - Few electric squares (10-15% of grid)
     - Clear directional flow
     - Minimal false paths
   
   - **Intermediate (Medium)**:
     - Zigzag or S-curve patterns
     - Multiple decision points (3-4 choices)
     - Moderate electric squares (20-25% of grid)
     - 2-3 short false paths
   
   - **Advanced (Hard)**:
     - Complex multi-directional path
     - Many decision points (5+ choices)
     - High electric density (30-35% of grid)
     - Multiple false paths of varying lengths
     - Strategic electric placement near correct path

4. **Save Configuration**:
   - Exit Config Mode when path design is complete
   - The maze is now ready for teams to play

### ❌ Invalid Path Configurations

**What Makes a Path Invalid:**

1. **Disconnected Path Segments**:
   - ❌ Path squares that don't connect to each other
   - ❌ Gaps requiring diagonal movement
   - ❌ Isolated green squares with no route to reach them
   - ✅ **Fix**: Ensure all path squares are adjacent (touching sides, not corners)

2. **No Clear Start or End**:
   - ❌ Path doesn't begin at an edge or designated start point
   - ❌ Path doesn't reach a clear finish location
   - ❌ Multiple possible starting positions causing confusion
   - ✅ **Fix**: Define clear entry and exit points, typically at opposite corners

3. **Impossible Navigation**:
   - ❌ Path requires teams to backtrack through revealed squares
   - ❌ Path forces teams into electric squares to continue
   - ❌ Dead ends with no way to proceed without hitting electric squares
   - ✅ **Fix**: Test the path yourself - if you can't solve it, teams can't either

4. **Overly Complex Branching**:
   - ❌ Too many valid path options (confusing objective)
   - ❌ Multiple correct routes to the same destination
   - ❌ Circular paths that loop back on themselves
   - ✅ **Fix**: Maintain one primary correct path with strategic false branches

5. **Poor Electric Placement**:
   - ❌ Electric squares blocking the only possible route
   - ❌ No electric squares (too easy, no challenge)
   - ❌ Electric squares placed randomly without strategic purpose
   - ✅ **Fix**: Place electric squares to create meaningful choices and consequences

**Path Validation Checklist:**

Before finalizing your maze design, verify:

- [ ] **Connectivity**: Can you trace the path from start to finish without gaps?
- [ ] **Solvability**: Can you complete the path without hitting electric squares?
- [ ] **Challenge Level**: Does the difficulty match your intended audience?
- [ ] **Clear Objective**: Is it obvious where teams should start and end?
- [ ] **Strategic Elements**: Do electric squares create meaningful decision points?
- [ ] **Reasonable Length**: Is the path long enough to be engaging but not frustrating?
- [ ] **Test Run**: Have you successfully navigated the path yourself?

### Recommended Path Patterns

**Visual Examples:**

```
BEGINNER - Simple L-Path:
S = Start, E = End, ✓ = Path, X = Electric, · = Unrevealed

S ✓ ✓ ✓ · · · ·
· · · ✓ · X · ·
· X · ✓ · · · ·
· · · ✓ ✓ ✓ ✓ E
· · · · · · · ·
```

```
INTERMEDIATE - Zigzag with False Paths:
S ✓ X · · · · ·
· ✓ · · ✓ ✓ X ·
· ✓ ✓ ✓ ✓ · · ·
· X · · ✓ · · ·
· · · · ✓ ✓ ✓ E
```

```
ADVANCED - Complex Multi-Path:
S ✓ ✓ X · ✓ ✓ ·
X · ✓ ✓ ✓ ✓ X ·
· · X · ✓ · ✓ ·
· ✓ ✓ ✓ ✓ · ✓ ·
· ✓ X · · · ✓ E
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd LeadershipExercise
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Application**:
   ```bash
   npm start
   ```
   This will start both the server (port 3001) and client (port 3000) simultaneously.

4. **Access the Application**:
   Open your browser to `http://localhost:3000`

### Alternative: Run Services Separately

If you need to run the services individually:

1. **Start the Server** (in one terminal):
   ```bash
   npm run server
   ```
   Server will run on `http://localhost:3001`

2. **Start the Client** (in another terminal):
   ```bash
   npm run dev
   ```
   Client will run on `http://localhost:3000`

## 🎛️ Control Panel Features

### Team Management
- **Add Team**: Create new teams with custom names
- **Select Team**: Choose which team is currently active
- **Team List**: View all registered teams

### Game Controls
- **Config Mode**: Toggle maze configuration mode for facilitators
- **Reset Maze**: Clear all revealed squares and start fresh
- **Sound Controls**: Mute/unmute audio feedback

### Real-time Features
- **Socket Status**: Shows connection status to the server
- **Live Updates**: All changes sync across connected clients instantly
- **Multi-user Support**: Multiple facilitators and participants can connect simultaneously

## 📊 Analytics Dashboard

### Performance Metrics
- **Team Progress**: Visual progress bars for each team
- **Mistakes Counter**: Track incorrect square selections
- **Time Tracking**: Monitor how long teams take to complete
- **Exploration Map**: See which squares each team has revealed

### Team Statistics
- **Completion Rate**: Percentage of maze completed
- **Error Rate**: Ratio of mistakes to total moves
- **Efficiency Score**: Path optimization metrics
- **Collaboration Index**: Multi-member participation tracking

## 🔊 Audio Features

- **Sound Feedback**: Audio cues for correct/incorrect selections
- **Volume Control**: Adjustable audio levels
- **Mute Option**: Disable sounds for quiet environments
- **Browser Compatibility**: Handles autoplay policies automatically

## 🛠️ Troubleshooting

### Common Issues

1. **Black Screen on Load**:
   - Check browser console for errors
   - Ensure server is running on port 3001
   - Verify client is accessing localhost:3000

2. **Socket Connection Errors**:
   - Confirm server is running: `npm run server` or `npm start`
   - Check CORS configuration allows localhost:3000
   - Verify no firewall blocking port 3001

3. **Grid Not Displaying**:
   - Refresh the page
   - Check for JavaScript errors in console
   - Ensure all dependencies are installed

4. **Audio Not Working**:
   - Click anywhere on the page first (browser autoplay policy)
   - Check browser audio permissions
   - Verify sound files are present in public/sounds/

### Performance Optimization

- **Multiple Teams**: Application supports multiple concurrent teams
- **Large Groups**: Server handles multiple simultaneous connections
- **Network Issues**: Built-in reconnection logic for unstable connections

## 🎯 Facilitation Tips

### Before the Exercise
1. Set up the maze path in Config Mode
2. Test the path yourself to ensure it's solvable
3. Brief teams on the rules and objectives
4. Assign team names and ensure all members can access the application

### During the Exercise
1. Monitor team progress via the Analytics dashboard
2. Provide hints if teams get stuck (optional)
3. Encourage communication and collaboration
4. Track time and mistakes for debrief discussion

### After the Exercise
1. Review team statistics and performance
2. Discuss strategies that worked well
3. Highlight collaboration moments
4. Use metrics for team development conversations

## 🔧 Technical Architecture

- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express and Socket.IO
- **Real-time Communication**: WebSocket connections
- **State Management**: React Context API
- **UI Framework**: Material-UI (MUI)
- **Audio**: Web Audio API with fallback support

## 📝 License

This project is designed for team-building and educational purposes. Please ensure appropriate usage in professional development contexts.

---

**Ready to start your Electric Maze adventure? Set up your maze, gather your teams, and let the collaboration begin!** ⚡🧩
