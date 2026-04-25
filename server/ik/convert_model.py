"""Convert the SO-101 MuJoCo model to be Drake-compatible.
Converts STL meshes to OBJ and updates the XML to reference them.
Based on the approach from manipulation.make_drake_compatible_model."""

import os
import re
import xml.etree.ElementTree as ET
import trimesh
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_XML = os.path.join(SCRIPT_DIR, "so101.xml")
OUTPUT_XML = os.path.join(SCRIPT_DIR, "so101_drake.xml")
ASSETS_DIR = os.path.join(SCRIPT_DIR, "assets")

MATERIAL_COLORS = {
    "base_motor_holder_so101_v1_material": [1, 0.82, 0.12, 1],
    "base_so101_v2_material": [1, 0.82, 0.12, 1],
    "sts3215_03a_v1_material": [0.1, 0.1, 0.1, 1],
    "waveshare_mounting_plate_so101_v2_material": [1, 0.82, 0.12, 1],
    "motor_holder_so101_base_v1_material": [1, 0.82, 0.12, 1],
    "rotation_pitch_so101_v1_material": [1, 0.82, 0.12, 1],
    "upper_arm_so101_v1_material": [1, 0.82, 0.12, 1],
    "under_arm_so101_v1_material": [1, 0.82, 0.12, 1],
    "motor_holder_so101_wrist_v1_material": [1, 0.82, 0.12, 1],
    "sts3215_03a_no_horn_v1_material": [0.1, 0.1, 0.1, 1.0],
    "wrist_roll_pitch_so101_v2_material": [1, 0.82, 0.12, 1],
    "wrist_roll_follower_so101_v1_material": [1, 0.82, 0.12, 1],
    "moving_jaw_so101_v1_material": [1, 0.82, 0.12, 1],
}


def convert_stl_to_obj(stl_path, obj_path, color=None):
    """Convert an STL file to OBJ format using trimesh."""
    if os.path.exists(obj_path):
        print(f"  Skipping {os.path.basename(obj_path)} (already exists)")
        return

    mesh = trimesh.load(stl_path)
    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh)
    mesh.export(obj_path, file_type="obj", include_normals=True)
    print(f"  Converted {os.path.basename(stl_path)} -> {os.path.basename(obj_path)}")


def get_mesh_material_map(tree):
    """Build a mapping from mesh name to material rgba."""
    root = tree.getroot()
    mesh_to_material = {}

    for body in root.iter("body"):
        for geom in body.findall("geom"):
            mesh_name = geom.get("mesh")
            material_name = geom.get("material")
            if mesh_name and material_name and material_name in MATERIAL_COLORS:
                mesh_to_material[mesh_name] = MATERIAL_COLORS[material_name]

    return mesh_to_material


def convert_model():
    print("Converting SO-101 model for Drake compatibility...")

    tree = ET.parse(INPUT_XML)
    root = tree.getroot()

    mesh_material_map = get_mesh_material_map(tree)

    asset = root.find("asset")
    stl_files = set()
    for mesh_elem in asset.findall("mesh"):
        filename = mesh_elem.get("file", "")
        if filename.endswith(".stl"):
            stl_files.add(filename)

    print(f"Found {len(stl_files)} STL files to convert")

    for stl_file in sorted(stl_files):
        obj_file = stl_file.replace(".stl", "_drake.obj")
        stl_path = os.path.join(ASSETS_DIR, stl_file)
        obj_path = os.path.join(ASSETS_DIR, obj_file)

        mesh_name = stl_file.replace(".stl", "")
        color = mesh_material_map.get(mesh_name)

        if os.path.exists(stl_path):
            convert_stl_to_obj(stl_path, obj_path, color)

    for mesh_elem in asset.findall("mesh"):
        filename = mesh_elem.get("file", "")
        if filename.endswith(".stl"):
            original_name = filename.replace(".stl", "")
            new_filename = filename.replace(".stl", "_drake.obj")
            mesh_elem.set("file", new_filename)
            if not mesh_elem.get("name"):
                mesh_elem.set("name", original_name)

    for mesh_elem in asset.findall("mesh"):
        if "maxhullvert" in mesh_elem.attrib:
            del mesh_elem.attrib["maxhullvert"]

    default_mesh = root.find(".//default/mesh")
    if default_mesh is not None and "maxhullvert" in default_mesh.attrib:
        del default_mesh.attrib["maxhullvert"]

    tree.write(OUTPUT_XML, xml_declaration=True, encoding="unicode")
    print(f"\nDrake-compatible model written to: {OUTPUT_XML}")


if __name__ == "__main__":
    convert_model()
