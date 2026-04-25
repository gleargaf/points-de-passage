import { useEffect, useRef } from "react";
import { useTrajectoryStore } from "@/lib/trajectoryStore";

export function useIKSolver() {
  const {
    waypoints,
    selectedWaypointId,
    setIKResult,
    setIKSolving,
    setIKError,
  } = useTrajectoryStore();

  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  const selectedWaypoint = waypoints.find((w) => w.id === selectedWaypointId);

  useEffect(() => {
    if (!selectedWaypoint) {
      setIKResult(null);
      setIKError(null);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const seq = ++requestSeqRef.current;

    const timer = setTimeout(async () => {
      setIKSolving(true);
      setIKError(null);

      try {
        const ikResp = await fetch("/api/ik/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position: [selectedWaypoint.x, -selectedWaypoint.y, selectedWaypoint.z],
            orientation:
              selectedWaypoint.roll !== 0 || selectedWaypoint.pitch !== 0 || selectedWaypoint.yaw !== 0
                ? [selectedWaypoint.roll, selectedWaypoint.pitch, selectedWaypoint.yaw]
                : undefined,
            gripper_state: selectedWaypoint.gripperState,
          }),
          signal: controller.signal,
        });

        if (seq !== requestSeqRef.current) return;

        if (!ikResp.ok) {
          setIKError("IK solver unavailable");
          setIKSolving(false);
          return;
        }

        const ikData = await ikResp.json();

        if (seq !== requestSeqRef.current) return;

        if (!ikData.success) {
          setIKError(ikData.error || "No solution found");
          setIKSolving(false);
          return;
        }

        const fkResp = await fetch("/api/ik/fk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            joint_angles: ikData.joint_angles,
            gripper_state: selectedWaypoint.gripperState,
          }),
          signal: controller.signal,
        });

        if (seq !== requestSeqRef.current) return;

        if (!fkResp.ok) {
          setIKError("FK computation failed");
          setIKSolving(false);
          return;
        }

        const fkData = await fkResp.json();

        if (seq !== requestSeqRef.current) return;

        if (!fkData.bodies || !fkData.gripper_tip) {
          setIKError("Invalid FK response");
          setIKSolving(false);
          return;
        }

        setIKResult({
          joint_angles: ikData.joint_angles,
          bodies: fkData.bodies,
          gripper_tip: fkData.gripper_tip,
          position_error: ikData.position_error,
        });
        setIKError(null);
      } catch (e: any) {
        if (e.name !== "AbortError" && seq === requestSeqRef.current) {
          setIKError("IK solver unavailable");
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setIKSolving(false);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [selectedWaypoint?.x, selectedWaypoint?.y, selectedWaypoint?.z, selectedWaypoint?.roll, selectedWaypoint?.pitch, selectedWaypoint?.yaw, selectedWaypoint?.gripperState, selectedWaypointId]);
}
