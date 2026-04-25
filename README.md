# LeRobot SO-101 Trajectory Designer

## Overview
A web-based interface for designing robot manipulator trajectories for the LeRobot SO-101 arm. Users can visualize a 3D scene with a robot arm on a table with colored lego blocks, and create trajectories by defining waypoints. Created in Replit using Replit's Power Agent (currently Claude Opus 4.7).

## Architecture
- **Frontend**: React + Three.js (via @react-three/fiber) for 3D visualization
- **Backend**: Express.js with in-memory storage for trajectory persistence
- **State Management**: Zustand for frontend state
- **3D Scene**: Three.js with OrbitControls, shadows, and environment lighting

## Coordinate System
- Origin at the robot base
- X axis: forward (red), Y axis: lateral (green), Z axis: up (blue)
- Coordinate transform: robot frame (X-fwd, Y-lat, Z-up) → Three.js (X-right, Y-up, Z-toward-camera)
- Mapping: Three.js X = baseX + robotX, Three.js Y = tableHeight + robotZ, Three.js Z = baseY + robotY
- Configurable base position (baseX, baseY on the table)
- Configurable axis ranges for X and Y

## Key Features
- 3D viewport with robot arm, table, and 3 colored lego blocks (red, green, blue)
- Waypoint creation with position (x, y, z), orientation (roll, pitch, yaw), and gripper open/close
- Trajectory visualization with interpolated paths and direction arrows
- Waypoint reordering, editing, and deletion
- Save/load trajectories via API
- Export trajectories as JSON
- Settings panel for base position and axis ranges
- Origin axes visualization at robot base

## Data Model
- **Waypoint**: id, x, y, z, roll, pitch, yaw, gripperState (0=closed, 1=open), label
- **Trajectory**: id, name, waypoints[], createdAt
- **Store settings**: baseX, baseY, tableHeight, xRange, yRange, zRange

## File Structure
- `shared/schema.ts` - Zod schemas and TypeScript types
- `server/routes.ts` - REST API endpoints for trajectories
- `server/storage.ts` - In-memory storage implementation
- `client/src/pages/TrajectoryDesigner.tsx` - Main page layout
- `client/src/components/Scene3D.tsx` - Three.js canvas setup
- `client/src/components/scene/` - 3D scene objects (Table, RobotArm, LegoBlock, WaypointMarkers, TrajectoryPath, GripperGhost, OriginAxes)
- `client/src/components/WaypointPanel.tsx` - Waypoint list and editor
- `client/src/components/TrajectoryList.tsx` - Save/load/export controls
- `client/src/components/SettingsPanel.tsx` - Base position and axis range settings
- `client/src/lib/trajectoryStore.ts` - Zustand state store
- `client/src/lib/coordinates.ts` - Coordinate transform utilities (robot frame → Three.js)

## Robot Model
- Uses actual SO-101 STL meshes from MuJoCo Menagerie (google-deepmind/mujoco_menagerie)
- 14 visual STL files stored in `client/public/models/so101/`
- Kinematic chain hierarchy from MuJoCo XML: base → shoulder → upper_arm → lower_arm → wrist → gripper → moving_jaw
- MuJoCo quaternions (w,x,y,z) converted to Three.js (x,y,z,w) with normalization
- Top-level -90° X rotation converts MuJoCo Z-up to Three.js Y-up coordinate system
- Materials: yellow (#ffd11e) for structural parts, dark (#1a1a1a) for servo motors

## Inverse Kinematics
- Python Flask server (`server/ik/ik_server.py`) on port 5001 using Drake (pydrake)
- Uses full SO-101 MuJoCo model converted to Drake-compatible format (`server/ik/so101_drake.xml`)
- Conversion script (`server/ik/convert_model.py`) converts STL meshes to OBJ using trimesh and adds explicit mesh name attributes
- OBJ mesh files stored alongside STL files in `server/ik/assets/` (named `*_drake.obj`)
- Requires `time_step=0.001` (discrete) for PD-controlled joint actuators
- Joints: shoulder_pan, shoulder_lift, elbow_flex, wrist_flex, wrist_roll (5 DOF for IK, gripper joint excluded)
- Gripper tip offset: [0.012, -0.000218, -0.098127] relative to gripper body frame
- Express backend proxies IK requests via `/api/ik/solve`, `/api/ik/solve_batch`, `/api/ik/fk`
- Frontend hook `useIKSolver` auto-solves IK when selected waypoint changes (with debounce)
- FK response provides body transforms (position + rotation matrix) for all bodies including camera_mount
- Bodies: base, shoulder, upper_arm, lower_arm, wrist, gripper, camera_mount, moving_jaw_so101_v1
- RobotArm component renders each body independently using FK world transforms (not nested hierarchy)
- Workflow "IK Solver" runs `python server/ik/ik_server.py`
- Gripper state: numeric 0-1 slider mapped to joint range 0-1.7453 radians

## Drake Scene Description
- DMD YAML file (`server/ik/scene.dmd.yaml`) describes the full scene for Drake
- Uses `package://so101_scene/` URI prefix; register with `parser.package_map().Add('so101_scene', path)`
- Loads via `LoadModelDirectives` + `ProcessModelDirectives`
- Contains: SO-101 robot (`so101_drake.xml`) + 3 lego blocks (`lego_block.xml`) welded to movable frames
- Lego block model: box (32×16×19mm) with 4 cylindrical studs, freejoint for DMD welding
- Block positions in MuJoCo Z-up frame: red=[0.15, -0.12, 0.0095], green=[0.25, 0.05, 0.0095], blue=[0.10, -0.18, 0.0095]
- Coordinate mapping from Three.js to MuJoCo: offset `[dx, dy, dz]` → MuJoCo `[dx, -dz, dy]` (Y sign flip + Z-up)

## Scene Editor
- Click a lego block in the 3D scene to select it (emissive glow + white edge outline)
- BlockEditorPanel (`client/src/components/BlockEditorPanel.tsx`) appears at top of right panel when a block is selected
- X/Y sliders in robot frame (robot Y = -MuJoCo Y) with range X:[0, 0.4], Y:[-0.3, 0.3]
- Auto-stacking: when blocks overlap in XY (within block footprint 32×16mm), selected block stacks on top
- Stack height: base Z = 0.0095m + N × 0.019m per overlapping block below
- Click empty area or X button to deselect block
- Store state: `selectedBlockId`, `updateSceneBlock(id, {x?, y?})` in trajectoryStore

## Trajectory Simulation
- Uses Drake's `DifferentialInverseKinematicsIntegrator` for smooth trajectory simulation
- Backend endpoint `/api/ik/simulate` accepts waypoints and returns an array of simulation frames
- Each frame contains body transforms, gripper tip position, gripper state, and timestamp
- Translation-only tracking (no angular velocity constraint) since robot has 5 DOF for end-effector
- Diff IK parameters: dt=0.05s, joint velocity limit=3.0 rad/s, end-effector velocity limit=0.3 m/s
- Frontend playback: SimulationControls component in WaypointPanel with play/pause/stop/scrub
- RobotArm renders from simulation frames when available, falling back to single-waypoint IK

## Dependencies
- three, @react-three/fiber, @react-three/drei - 3D rendering
- three-stdlib - STL file loader
- zustand - State management
- drake (pydrake) - Inverse kinematics solver (Python)
- flask - IK API server (Python)
- numpy - Numerical computation (Python)
- trimesh, scipy - STL to OBJ mesh conversion (Python)
- Standard fullstack-js template packages (React, Express, TanStack Query, shadcn/ui)

