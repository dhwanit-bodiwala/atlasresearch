"""
Generate blocky ice crystal mesh for Atlas Research.

Two-part crystal (igloo.inc structure): a faceted outer ice shell
encasing a soft, organic inner core.
- CrystalShell: rough, angular ice shell (faceted, flat-shaded)
- CrystalCore: lumpy rounded blob, slightly off-axis, smooth-shaded.
  Visible through the frosted shell as a soft diffused white shape.

Run from frontend/:
  blender --background --python scripts/generate_crystal.py

Output: public/crystal.glb
"""
import bpy
from pathlib import Path

SUBDIVISIONS = 1
RADIUS = 0.65
SHELL_SCALE = (0.75, 1.25, 0.75)  # elongated shard, baked in
VERTEX_RANDOM = {"offset": 0.45, "uniform": 0.08, "normal": 0.22}
DISPLACE_STRENGTH = 0.03

CORE_SUBDIVISIONS = 2
CORE_RADIUS = 0.15
CORE_SCALE = (0.6, 0.8, 0.55)
CORE_DISPLACE_STRENGTH = 0.06
CORE_NOISE_SCALE = 0.4
CORE_OFFSET = (0.06, -0.04, 0.035)  # slightly off-axis — never perfectly centered

OUTPUT_PATH = str(
    Path(__file__).resolve().parent.parent / "public" / "crystal.glb"
)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# ── Outer ice shell ──────────────────────────────────────────
bpy.ops.mesh.primitive_ico_sphere_add(
    radius=RADIUS,
    subdivisions=SUBDIVISIONS,
)
shell = bpy.context.active_object
shell.name = "CrystalShell"

bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.transform.vertex_random(
    offset=VERTEX_RANDOM["offset"],
    uniform=VERTEX_RANDOM["uniform"],
    normal=VERTEX_RANDOM["normal"],
)
bpy.ops.object.mode_set(mode="OBJECT")

shell_noise = bpy.data.textures.new("ShellNoise", type="CLOUDS")
shell_noise.noise_type = "HARD_NOISE"

shell_displace = shell.modifiers.new(name="Displace", type="DISPLACE")
shell_displace.texture = shell_noise
shell_displace.strength = DISPLACE_STRENGTH
shell_displace.mid_level = 0.5

bpy.context.view_layer.objects.active = shell
bpy.ops.object.modifier_apply(modifier="Displace")

# Elongated ice-shard proportions, baked into the vertices
shell.scale = SHELL_SCALE
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Facets stay angular and hard-edged
bpy.ops.object.shade_flat()

# ── Inner core — soft organic blob ───────────────────────────
bpy.ops.mesh.primitive_ico_sphere_add(
    radius=CORE_RADIUS,
    subdivisions=CORE_SUBDIVISIONS,
)
core = bpy.context.active_object
core.name = "CrystalCore"

# Irregular scale, baked in so the blob is lopsided
core.scale = CORE_SCALE
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

core_noise = bpy.data.textures.new("CoreNoise", type="CLOUDS")
core_noise.noise_scale = CORE_NOISE_SCALE

core_displace = core.modifiers.new(name="Displace", type="DISPLACE")
core_displace.texture = core_noise
core_displace.strength = CORE_DISPLACE_STRENGTH
core_displace.mid_level = 0.5

bpy.context.view_layer.objects.active = core
bpy.ops.object.modifier_apply(modifier="Displace")

# Organic and rounded — NOT faceted like the outer shell
bpy.ops.object.shade_smooth()

# Sits asymmetrically inside the shell
core.location = CORE_OFFSET

# ── Export both meshes as a single GLB ───────────────────────
bpy.ops.object.select_all(action="DESELECT")
shell.select_set(True)
core.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
)

print(f"Exported crystal to {OUTPUT_PATH}")
