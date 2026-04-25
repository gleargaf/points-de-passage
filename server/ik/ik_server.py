import json
import sys
import os
import numpy as np
from flask import Flask, request, jsonify

from pydrake.multibody.parsing import Parser
from pydrake.multibody.plant import MultibodyPlant, AddMultibodyPlantSceneGraph
from pydrake.multibody.inverse_kinematics import InverseKinematics, DifferentialInverseKinematicsIntegrator, DifferentialInverseKinematicsParameters
from pydrake.multibody.tree import JointIndex
from pydrake.solvers import Solve
from pydrake.systems.framework import DiagramBuilder
from pydrake.systems.analysis import Simulator
from pydrake.math import RollPitchYaw, RotationMatrix, RigidTransform
from pydrake.common.value import AbstractValue
from pydrake.geometry import Role

app = Flask(__name__)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "so101_drake.xml")

GRIPPER_TIP_OFFSET = np.array([0.012, -0.000218, -0.098127])

JOINT_NAMES = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll"]

builder = DiagramBuilder()
plant, scene_graph = AddMultibodyPlantSceneGraph(builder, time_step=0.001)
parser = Parser(plant)
parser.AddModels(MODEL_PATH)
plant.Finalize()

m = scene_graph.model_inspector()
block_geos = [i for f in m.GetAllFrameIds()
              for i in m.GetGeometries(f, role=Role.kProximity)
              if 'block' in m.GetName(i)]

fixed_jaw_geos = [i for f in m.GetAllFrameIds()
                  for i in m.GetGeometries(f, role=Role.kProximity)
                  if 'fixed_jaw_sph_tip' in m.GetName(i)]

moving_jaw_geos = [i for f in m.GetAllFrameIds()
                   for i in m.GetGeometries(f, role=Role.kProximity)
                   if 'moving_jaw_sph_tip' in m.GetName(i)]

gripper_frame = plant.GetFrameByName("gripper")

num_positions = plant.num_positions()
joint_indices = []
for name in JOINT_NAMES:
    joint = plant.GetJointByName(name)
    joint_indices.append(joint.position_start())

gripper_joint = plant.GetJointByName("gripper")
gripper_joint_idx = gripper_joint.position_start()

GRIPPER_CLOSED_RAD = 0.0
GRIPPER_OPEN_RAD = 1.7453


def get_block_contact():
    q = scene_graph.get_query_output_port().Eval(diagram_context)
    contact = (None, None, None)
    for c in q.ComputeSignedDistancePairwiseClosestPoints():
        if c.distance > 0.001:
            continue
        if c.id_A in contact_geos or c.id_B in contact_geos:
            if c.id_A in fixed_jaw_geos:
                contact[0] = c.id_B
                contact[1] = c.id_A
            elif c.id_B in fixed_jaw_geos:
                contact[1] = c.id_B
                contact[0] = c.id_A
            elif c.id_A in moving_jaw_geos:
                contact[0] = c.id_B
                contact[2] = c.id_A
            elif c.id_B in moving_jaw_geos:
                contact[2] = c.id_B
                contact[0] = c.id_A

    return contact


def gripper_state_to_rad(state):
    return GRIPPER_CLOSED_RAD + state * (GRIPPER_OPEN_RAD - GRIPPER_CLOSED_RAD)


def solve_ik(target_xyz, target_rpy_deg=None, q_initial=None, gripper_state=None, position_tol=0.005, orientation_tol=0.1):
    ik = InverseKinematics(plant)
    ik_context = ik.context()

    target_pos = np.array(target_xyz, dtype=float)

    ik.AddPositionConstraint(
        gripper_frame,
        GRIPPER_TIP_OFFSET,
        plant.world_frame(),
        target_pos - position_tol,
        target_pos + position_tol,
    )

    if target_rpy_deg is not None:
        roll_rad = np.radians(target_rpy_deg[0])
        pitch_rad = np.radians(target_rpy_deg[1])
        yaw_rad = np.radians(target_rpy_deg[2])
        target_rotation = RotationMatrix(RollPitchYaw(roll_rad, pitch_rad, yaw_rad))
        ik.AddOrientationConstraint(
            gripper_frame,
            RotationMatrix(),
            plant.world_frame(),
            target_rotation,
            orientation_tol,
        )

    prog = ik.prog()
    q_vars = ik.q()

    if q_initial is not None:
        q0 = np.array(q_initial, dtype=float)
    else:
        q0 = np.zeros(num_positions)

    gripper_rad = gripper_state_to_rad(gripper_state if gripper_state is not None else 0.0)
    q0[gripper_joint_idx] = gripper_rad

    prog.SetInitialGuess(q_vars, q0)

    prog.AddConstraint(q_vars[gripper_joint_idx] == gripper_rad)

    result = Solve(prog)

    if not result.is_success():
        return None

    q_sol = result.GetSolution(q_vars)

    plant.SetPositions(ik_context, q_sol)
    X_sol = plant.CalcRelativeTransform(ik_context, plant.world_frame(), gripper_frame)
    achieved_tip = X_sol.translation() + X_sol.rotation().matrix() @ GRIPPER_TIP_OFFSET

    joint_angles = {}
    for name, idx in zip(JOINT_NAMES, joint_indices):
        joint_angles[name] = float(q_sol[idx])

    return {
        "joint_angles": joint_angles,
        "achieved_position": achieved_tip.tolist(),
        "position_error": float(np.linalg.norm(achieved_tip - target_pos)),
        "q_full": q_sol.tolist(),
    }


@app.route("/solve", methods=["POST"])
def solve_endpoint():
    data = request.get_json()
    if not data or "position" not in data:
        return jsonify({"error": "Missing 'position' field (array of [x, y, z])"}), 400

    target_xyz = data["position"]
    target_rpy = data.get("orientation", None)
    q_initial = data.get("q_initial", None)
    gripper_state = data.get("gripper_state", None)

    result = solve_ik(target_xyz, target_rpy, q_initial, gripper_state)

    if result is None:
        return jsonify({"error": "IK solver failed to find a solution", "success": False}), 200

    return jsonify({"success": True, **result})


@app.route("/solve_batch", methods=["POST"])
def solve_batch_endpoint():
    data = request.get_json()
    if not data or "waypoints" not in data:
        return jsonify({"error": "Missing 'waypoints' field"}), 400

    waypoints = data["waypoints"]
    results = []
    q_prev = None

    for wp in waypoints:
        target_xyz = [wp["x"], wp["y"], wp["z"]]
        target_rpy = None
        if any(wp.get(k, 0) != 0 for k in ["roll", "pitch", "yaw"]):
            target_rpy = [wp.get("roll", 0), wp.get("pitch", 0), wp.get("yaw", 0)]
        gripper_state = wp.get("gripper_state", wp.get("gripperState", None))

        result = solve_ik(target_xyz, target_rpy, q_prev, gripper_state)

        if result is not None:
            q_prev = result["q_full"]
            results.append({"id": wp.get("id", ""), "success": True, **result})
        else:
            results.append({"id": wp.get("id", ""), "success": False, "error": "No solution found"})

    return jsonify({"results": results})


@app.route("/fk", methods=["POST"])
def fk_endpoint():
    data = request.get_json()
    if not data or "joint_angles" not in data:
        return jsonify({"error": "Missing 'joint_angles' field"}), 400

    context = plant.CreateDefaultContext()
    q = np.zeros(num_positions)

    angles = data["joint_angles"]
    for name, idx in zip(JOINT_NAMES, joint_indices):
        if name in angles:
            q[idx] = angles[name]

    gripper_state = data.get("gripper_state", None)
    if gripper_state is not None:
        q[gripper_joint_idx] = gripper_state_to_rad(gripper_state)

    plant.SetPositions(context, q)

    body_positions = {}
    body_names = ["base", "shoulder", "upper_arm", "lower_arm", "wrist", "gripper", "camera_mount", "moving_jaw_so101_v1"]
    for bname in body_names:
        body = plant.GetBodyByName(bname)
        X = plant.CalcRelativeTransform(context, plant.world_frame(), body.body_frame())
        pos = X.translation().tolist()
        rot = X.rotation().matrix().tolist()
        body_positions[bname] = {"position": pos, "rotation": rot}

    X_gripper = plant.CalcRelativeTransform(context, plant.world_frame(), gripper_frame)
    tip_pos = (X_gripper.translation() + X_gripper.rotation().matrix() @ GRIPPER_TIP_OFFSET).tolist()

    return jsonify({
        "bodies": body_positions,
        "gripper_tip": tip_pos,
    })


BODY_NAMES = ["base", "shoulder", "upper_arm", "lower_arm", "wrist", "gripper", "camera_mount", "moving_jaw_so101_v1"]


def compute_fk_all(q_vals):
    ctx = plant.CreateDefaultContext()
    plant.SetPositions(ctx, q_vals)
    bodies = {}
    for bname in BODY_NAMES:
        body = plant.GetBodyByName(bname)
        X = plant.CalcRelativeTransform(ctx, plant.world_frame(), body.body_frame())
        bodies[bname] = {
            "position": X.translation().tolist(),
            "rotation": X.rotation().matrix().tolist(),
        }
    X_g = plant.CalcRelativeTransform(ctx, plant.world_frame(), gripper_frame)
    tip = (X_g.translation() + X_g.rotation().matrix() @ GRIPPER_TIP_OFFSET).tolist()
    return bodies, tip


def tip_to_frame_target(tip_target, q_current):
    ctx = plant.CreateDefaultContext()
    plant.SetPositions(ctx, q_current)
    X_g = plant.CalcRelativeTransform(ctx, plant.world_frame(), gripper_frame)
    frame_pos = np.array(tip_target) - X_g.rotation().matrix() @ GRIPPER_TIP_OFFSET
    return RigidTransform(X_g.rotation(), frame_pos)


@app.route("/simulate", methods=["POST"])
def simulate_endpoint():
    data = request.get_json()
    if not data or "waypoints" not in data:
        return jsonify({"error": "Missing 'waypoints' field"}), 400

    waypoints = data["waypoints"]
    if len(waypoints) < 1:
        return jsonify({"error": "Need at least 1 waypoint"}), 400

    dt = 0.05
    time_per_wp = float(data.get("time_per_waypoint", 2.0))
    record_interval = int(data.get("record_interval", 4))

    params = DifferentialInverseKinematicsParameters(
        plant.num_positions(), plant.num_velocities()
    )
    params.set_time_step(dt)
    vel_lim = 3.0 * np.ones(plant.num_velocities())
    params.set_joint_velocity_limits((-vel_lim, vel_lim))
    params.set_joint_position_limits(
        (plant.GetPositionLowerLimits(), plant.GetPositionUpperLimits())
    )
    params.set_end_effector_translational_velocity_limits(
        -0.3 * np.ones(3), 0.3 * np.ones(3)
    )
    params.set_end_effector_velocity_flag(
        [False, False, False, True, True, True]
    )

    diff_ik = DifferentialInverseKinematicsIntegrator(
        plant, gripper_frame, dt, params,
        log_only_when_result_state_changes=True
    )

    sim = Simulator(diff_ik)
    context = sim.get_mutable_context()

    q0 = np.zeros(plant.num_positions())
    diff_ik.SetPositions(context, q0)

    input_port = diff_ik.GetInputPort("X_WE_desired")
    init_pose = RigidTransform(RotationMatrix(), [0.3, 0, 0.2])
    input_port.FixValue(context, init_pose)

    out_port = diff_ik.get_output_port()
    steps_per_wp = int(time_per_wp / dt)
    frames = []

    bodies_init, tip_init = compute_fk_all(q0)
    frames.append({
        "time": 0.0,
        "bodies": bodies_init,
        "gripper_tip": tip_init,
        "gripper_state": 0.0,
        "waypoint_idx": 0,
    })

    for wp_idx, wp in enumerate(waypoints):
        tip_target = [wp["x"], wp["y"], wp["z"]]
        gripper_state = wp.get("gripper_state", wp.get("gripperState", 0.0))

        t_start = context.get_time()

        for step in range(steps_per_wp):
            q_now = out_port.Eval(context)
            target_pose = tip_to_frame_target(tip_target, q_now)
            input_port.FixValue(context, target_pose)
            sim.AdvanceTo(t_start + (step + 1) * dt)

            if step % record_interval == 0 or step == steps_per_wp - 1:
                q_frame = out_port.Eval(context)
                q_with_gripper = q_frame.copy()
                q_with_gripper[gripper_joint_idx] = gripper_state_to_rad(gripper_state)
                bodies, tip = compute_fk_all(q_with_gripper)
                frames.append({
                    "time": round(context.get_time(), 4),
                    "bodies": bodies,
                    "gripper_tip": tip,
                    "gripper_state": gripper_state,
                    "waypoint_idx": wp_idx,
                })

    return jsonify({"frames": frames, "total_time": round(context.get_time(), 4)})


BLOCK_COLORS = {
    "red": "#e74c3c",
    "green": "#2ecc71",
    "blue": "#3498db",
}

@app.route("/scene", methods=["GET"])
def scene_endpoint():
    import yaml

    scene_path = os.path.join(SCRIPT_DIR, "scene.dmd.yaml")
    try:
        with open(scene_path, "r") as f:
            dmd = yaml.safe_load(f)
    except Exception as e:
        return jsonify({"error": f"Failed to load scene: {str(e)}", "blocks": []}), 500

    blocks = []
    current_model_name = None

    for directive in dmd.get("directives", []):
        if "add_model" in directive:
            current_model_name = directive["add_model"].get("name", "")
        elif "add_weld" in directive and current_model_name:
            child = directive["add_weld"].get("child", "")
            if "block" in child:
                x_pc = directive["add_weld"].get("X_PC", {})
                translation = x_pc.get("translation", [0, 0, 0])
                rotation = x_pc.get("rotation", None)

                color_key = current_model_name.replace("_block", "")
                color = BLOCK_COLORS.get(color_key, "#888888")

                blocks.append({
                    "id": color_key,
                    "name": current_model_name,
                    "color": color,
                    "position": translation,
                    "rotation": rotation,
                })
            current_model_name = None

    return jsonify({"blocks": blocks})


if __name__ == "__main__":
    port = int(os.environ.get("IK_PORT", 5001))
    print(f"IK server starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
