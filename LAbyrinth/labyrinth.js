import {defs, tiny} from './examples/common.js';
import {
    Buffered_Texture,
    Color_Phong_Shader,
    Depth_Texture_Shader_2D,
    LIGHT_DEPTH_TEX_SIZE,
    Shadow_Textured_Phong_NM_Shader,
    Shadow_Textured_Phong_Shader
} from "./examples/shadow_shaders.js";

//import {Shape_From_File} from './examples/obj-file-demo.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {
    Cube,
    Cube_Normal,
    Square_Normal,
    Square,
    Axis_Arrows,
    Subdivision_Sphere,
    Textured_Phong,
    Fake_Bump_Map,
    Phong_Shader,
    Textured_Phong_Normal_Map,
    Funny_Shader,
} = defs;

const original_box_size = 2;

class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            'cube': new Cube_Normal(),
            'floor': new Square(),
            'torch_wood': new Cube(),
            'torch_fire': new Subdivision_Sphere(3),
            'person': new Cube(),
            'sphere': new Subdivision_Sphere(6),
            'treasure_box': new Cube(),
        };

        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            cobble_stone: new Material(new Textured_Phong_Normal_Map(),
                {
                    ambient: 0.2, diffusivity: 0.3, specularity: 0.3, color: hex_color("#964B00"),
                    texture: new Texture("./assets/brickwall.jpg"),
                    normal: new Texture("./assets/brickwall_normal.jpg")
                }),
            cobble_flat: new Material(new Textured_Phong(),
                {
                    ambient: 0.2, diffusivity: 0.3, specularity: 0.3, color: hex_color("#964B00"),
                    texture: new Texture("./assets/brickwall.jpg")
                }),
            cobble_stone_plane: new Material(new Shadow_Textured_Phong_NM_Shader(1),
                {
                    ambient: 0.4, diffusivity: 0.3, specularity: 0.5, color: hex_color("#964B00"),
                    color_texture: new Texture("./assets/brickwall.jpg"),
                    normal: new Texture("./assets/brickwall_normal.jpg"),
                    light_depth_texture: null
                }),
            perlin_floor: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    ambient: 0.3, diffusivity: 0.2, specularity: 0.4,
                    color: hex_color("#aaaaaa"),
                    color_texture: new Texture("./assets/perlin_stones/ground.png"),
                    light_depth_texture: null
                }),
            wood: new Material(new Textured_Phong(),
                {
                    ambient: 0.5, diffusivity: 1.0, specularity: 0.3,
                    texture: new Texture("./assets/wood.png")
                }),
            fire: new Material(new Phong_Shader(),
                {
                    ambient: 1., diffusivity: .6, color: hex_color("#ffffff")
                }),
            person: new Material(new Phong_Shader,
                {
                    ambient: 1, diffusivity: 0.5, color: hex_color("#992828")
                }),
            pure: new Material(new Color_Phong_Shader(), {}),
            light_src: new Material(new Phong_Shader(), {
                color: color(1, 1, 1, 1), ambient: 1, diffusivity: 0, specularity: 0
            }),
            depth_tex: new Material(new Depth_Texture_Shader_2D(), {
                color: color(0, 0, .0, 1),
                ambient: 1, diffusivity: 0, specularity: 0, texture: null
            }),
            torch_fire: new Material(new Funny_Shader(), {}),
            treasure_box: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("./assets/box.png")
            })
        };

        // vector direction in homo
        // x and z movement only
        this.look_at_direction = vec4(1, 0, 0, 0);
        // initial person and camera transformations
        this.person_location = vec4(2, 0, -2, 0);
        this.person_transformation = Mat4.identity()
            .times(Mat4.translation(2, -0.5, -2))
            .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
            .times(Mat4.scale(0.3, 0.3, 0.3));
        this.camera_transformation = Mat4.identity()
            // since camera space is all in inverse space. We have to translate first, then rotate.
            .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
            .times(Mat4.translation(-2, -0.8, 2));

        this.goal_position = vec3(34, 0, -10);
        this.treasure_base_transform = Mat4.translation(...this.goal_position)
            .times(Mat4.scale(0.5, 0.5, 0.5));
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(-20, -10, -50));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 2.5, context.width / context.height, 0.01, 100);

        // *** Lights: *** Values of vector or point lights.
        //const global_sun_position = vec4(20, 10, 50, 1);
        //program_state.lights = [new Light(global_sun_position, hex_color("#ffffff"), 10 ** 10)];
    }
}

export class Labyrinth extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */
    constructor() {
        super();
        this.get_coords();
        this.still_lighting = false;
        this.map_plane = [];
        this.init_ok = false;
        const offsets = this.get_offsets(1)
        let res = [];
        // discard y components, recover projected position on 2d plane
        for (let c of this.box_coord) {
            let resc = [];
            const center = vec(original_box_size * c[0], original_box_size * c[2])
            for (let offset of offsets) {
                resc.push(vec(
                    center[0] + offset[0],
                    center[1] + offset[1]
                ))
            }
            res.push(resc);
        }
        this.map_plane = res
    }

    get_offsets(base) {
        return [
            vec(base, -1 * base),
            vec(base, base),
            vec(-1 * base, base),
            vec(-1 * base, -1 * base)
        ];
    }

    get_person_box_tips(hypothetic_person_position) {
        const person_location = hypothetic_person_position ? hypothetic_person_position : this.person_location;
        const base = 0.5 * 0.3;
        const offsets = this.get_offsets(base);
        let res = [];
        for (let offset of offsets) {
            res.push(
                vec(person_location[0] + offset[0], -person_location[2] - offset[1])
            )
        }
        return res
    }

    get_wall_brick_box_tips(box_location) {
        const base = 1;
        const offsets = this.get_offsets(base);
        let res = [];
        for (let offset of offsets) {
            res.push(
                vec(box_location[0] + offset[0], -box_location[2] - offset[1])
            )
        }
        return res
    }

    box_collide_1d(box1, box2) {
        // box1, box2: vec2 = (xmin1, xmax1), (xmin2, xmax2)
        const xmin1 = box1[0];
        const xmax1 = box1[1];
        const xmin2 = box2[0];
        const xmax2 = box2[1];
        return xmax1 >= xmin2 && xmax2 >= xmin1;
    }

    box_collide_2d(box1, box2) {
        // box1, box2: array [ 4 elements ]
        // array[i] = vec2 ( x, y )

        const xmin1 = Math.min(...box1.map(c => c[0]));
        const xmax1 = Math.max(...box1.map(c => c[0]));
        const ymin1 = Math.min(...box1.map(c => c[1]));
        const ymax1 = Math.max(...box1.map(c => c[1]));
        const xmin2 = Math.min(...box2.map(c => c[0]));
        const xmax2 = Math.max(...box2.map(c => c[0]));
        const ymin2 = Math.min(...box2.map(c => c[1]));
        const ymax2 = Math.max(...box2.map(c => c[1]));

        return this.box_collide_1d([xmin1, xmax1], [xmin2, xmax2]) &&
            this.box_collide_1d([ymin1, ymax1], [ymin2, ymax2])
    }

    get_coords() {
        this.box_coord = [
            [0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [5, 0, 0],
            [6, 0, 0], [7, 0, 0], [8, 0, 0], [9, 0, 0], [10, 0, 0], [11, 0, 0],
            [12, 0, 0], [13, 0, 0], [14, 0, 0], [15, 0, 0], [16, 0, 0], [17, 0, 0],
            [18, 0, 0], [19, 0, 0], [20, 0, 0], [10, 0, 1], [14, 0, 1], [2, 0, 2],
            [3, 0, 2], [4, 0, 2], [5, 0, 2], [6, 0, 2], [7, 0, 2], [8, 0, 2],
            [10, 0, 2], [12, 0, 2], [13, 0, 2], [14, 0, 2], [16, 0, 2], [17, 0, 2],
            [18, 0, 2], [2, 0, 3], [4, 0, 3], [8, 0, 3], [16, 0, 3], [2, 0, 4],
            [4, 0, 4], [6, 0, 4], [7, 0, 4], [8, 0, 4], [9, 0, 4], [10, 0, 4],
            [11, 0, 4], [12, 0, 4], [13, 0, 4], [14, 0, 4], [16, 0, 4], [18, 0, 4],
            [19, 0, 4], [4, 0, 5], [8, 0, 5], [16, 0, 5], [18, 0, 5], [1, 0, 6],
            [2, 0, 6], [3, 0, 6], [4, 0, 6], [6, 0, 6], [8, 0, 6], [9, 0, 6],
            [10, 0, 6], [12, 0, 6], [14, 0, 6], [15, 0, 6], [16, 0, 6], [17, 0, 6],
            [18, 0, 6], [4, 0, 7], [6, 0, 7], [12, 0, 7], [18, 0, 7], [2, 0, 8],
            [3, 0, 8], [4, 0, 8], [5, 0, 8], [6, 0, 8], [7, 0, 8], [8, 0, 8],
            [9, 0, 8], [10, 0, 8], [12, 0, 8], [14, 0, 8], [15, 0, 8], [16, 0, 8],
            [17, 0, 8], [18, 0, 8], [2, 0, 9], [8, 0, 9], [12, 0, 9], [2, 0, 10],
            [4, 0, 10], [6, 0, 10], [7, 0, 10], [8, 0, 10], [10, 0, 10], [11, 0, 10],
            [12, 0, 10], [13, 0, 10], [14, 0, 10], [15, 0, 10], [16, 0, 10], [17, 0, 10],
            [18, 0, 10], [19, 0, 10], [4, 0, 11], [14, 0, 11], [16, 0, 11], [2, 0, 12],
            [3, 0, 12], [4, 0, 12], [6, 0, 12], [7, 0, 12], [8, 0, 12], [10, 0, 12],
            [11, 0, 12], [12, 0, 12], [14, 0, 12], [16, 0, 12], [17, 0, 12], [18, 0, 12],
            [2, 0, 13], [4, 0, 13], [8, 0, 13], [12, 0, 13], [1, 0, 14], [2, 0, 14],
            [4, 0, 14], [5, 0, 14], [6, 0, 14], [7, 0, 14], [8, 0, 14], [9, 0, 14],
            [10, 0, 14], [11, 0, 14], [12, 0, 14], [13, 0, 14], [14, 0, 14], [15, 0, 14],
            [16, 0, 14], [18, 0, 14], [19, 0, 14], [4, 0, 15], [8, 0, 15], [2, 0, 16],
            [3, 0, 16], [4, 0, 16], [6, 0, 16], [7, 0, 16], [8, 0, 16], [9, 0, 16],
            [10, 0, 16], [11, 0, 16], [12, 0, 16], [14, 0, 16], [15, 0, 16], [16, 0, 16],
            [18, 0, 16], [19, 0, 16], [10, 0, 17], [16, 0, 17], [2, 0, 18], [3, 0, 18],
            [4, 0, 18], [5, 0, 18], [6, 0, 18], [7, 0, 18], [8, 0, 18], [10, 0, 18],
            [12, 0, 18], [13, 0, 18], [14, 0, 18], [16, 0, 18], [17, 0, 18], [18, 0, 18],
            [19, 0, 18], [8, 0, 19], [12, 0, 19], [0, 0, 20], [0, 0, 0], [20, 0, 0],
            [1, 0, 20], [0, 0, 1], [20, 0, 1], [2, 0, 20], [0, 0, 2], [20, 0, 2],
            [3, 0, 20], [0, 0, 3], [20, 0, 3], [4, 0, 20], [0, 0, 4], [20, 0, 4],
            [5, 0, 20], [0, 0, 5], [20, 0, 5], [6, 0, 20], [0, 0, 6], [20, 0, 6],
            [7, 0, 20], [0, 0, 7], [20, 0, 7], [8, 0, 20], [0, 0, 8], [20, 0, 8],
            [9, 0, 20], [0, 0, 9], [20, 0, 9], [10, 0, 20], [0, 0, 10], [20, 0, 10],
            [11, 0, 20], [0, 0, 11], [20, 0, 11], [12, 0, 20], [0, 0, 12], [20, 0, 12],
            [13, 0, 20], [0, 0, 13], [20, 0, 13], [14, 0, 20], [0, 0, 14], [20, 0, 14],
            [15, 0, 20], [0, 0, 15], [20, 0, 15], [16, 0, 20], [0, 0, 16], [20, 0, 16],
            [17, 0, 20], [0, 0, 17], [20, 0, 17], [18, 0, 20], [0, 0, 18], [20, 0, 18],
            [19, 0, 20], [0, 0, 19], [20, 0, 19], [20, 0, 20], [0, 0, 20], [20, 0, 20],
        ]
    }

    check_winning_condition(new_person_location_tips) {
        if (this.box_collide_2d(
            new_person_location_tips,
            this.get_wall_brick_box_tips(this.goal_position)
        )) {
            if (confirm("You won the game, restart?")) {
                location.reload();
            }
            // returns ok?
            return false;
        }
        // returns ok?
        return true
    }

    check_person_colliding_wall(new_person_location_tips) {
        for (let i = 0; i < this.map_plane.length; i++) {
            const cur_square = this.map_plane[i];
            if (this.box_collide_2d(
                cur_square,
                new_person_location_tips
            )) {
                return false;
            }
        }
        return true;
    }

    make_control_panel() {
        this.control_panel.innerHTML += "For the best experience, please don't press multiple keys at the same time.<br>";

        this.key_triggered_button("Rotate Left", ["a"], () => {
            this.look_at_direction = Mat4.rotation(Math.PI / 16, 0, 1, 0)
                .times(this.look_at_direction);
            this.person_transformation =
                Mat4.translation(
                    this.person_location[0],
                    this.person_location[1],
                    this.person_location[2]
                )
                    .times(Mat4.rotation(Math.PI / 16, 0, 1, 0))
                    .times(Mat4.translation(
                        -1 * this.person_location[0],
                        -1 * this.person_location[1],
                        -1 * this.person_location[2]
                    )).times(this.person_transformation);
            this.camera_transformation =
                this.camera_transformation.times(
                    Mat4.translation(
                        this.person_location[0],
                        this.person_location[1],
                        this.person_location[2]
                    )
                        .times(Mat4.rotation(-Math.PI / 16, 0, 1, 0))
                        .times(Mat4.translation(
                            -1 * this.person_location[0],
                            -1 * this.person_location[1],
                            -1 * this.person_location[2]
                        )));
        });

        this.key_triggered_button("Rotate Right", ["d"], () => {
            this.look_at_direction = Mat4.rotation(-Math.PI / 16, 0, 1, 0)
                .times(this.look_at_direction);
            this.person_transformation =
                Mat4.translation(
                    this.person_location[0],
                    this.person_location[1],
                    this.person_location[2]
                )
                    .times(Mat4.rotation(-Math.PI / 16, 0, 1, 0))
                    .times(Mat4.translation(
                        -1 * this.person_location[0],
                        -1 * this.person_location[1],
                        -1 * this.person_location[2]
                    )).times(this.person_transformation);
            this.camera_transformation =
                this.camera_transformation.times(
                    Mat4.translation(
                        this.person_location[0],
                        this.person_location[1],
                        this.person_location[2]
                    )
                        .times(Mat4.rotation(Math.PI / 16, 0, 1, 0))
                        .times(Mat4.translation(
                            -1 * this.person_location[0],
                            -1 * this.person_location[1],
                            -1 * this.person_location[2]
                        )));
        });

        this.key_triggered_button("Move", ["w"], () => {
            const scaled_look_at_direction = this.look_at_direction.times(0.12)
            const new_person_transformation =
                Mat4.translation(
                    scaled_look_at_direction[0],
                    scaled_look_at_direction[1],
                    scaled_look_at_direction[2]
                ).times(this.person_transformation);
            const new_camera_transformation = this.camera_transformation.times(Mat4.translation(
                -1 * scaled_look_at_direction[0],
                -1 * scaled_look_at_direction[1],
                -1 * scaled_look_at_direction[2]
            ));
            const new_person_location = this.person_location.plus(scaled_look_at_direction);
            let ok = true;
            const new_person_location_tips = this.get_person_box_tips(new_person_location);

            ok = ok && this.check_person_colliding_wall(new_person_location_tips);
            ok = ok && this.check_winning_condition(new_person_location_tips);

            if (ok) {
                this.person_transformation = new_person_transformation;
                this.camera_transformation = new_camera_transformation;
                this.person_location = new_person_location;
            }
        });

        this.key_triggered_button("Back", ["s"], () => {
            const scaled_look_at_direction = this.look_at_direction.times(0.12)
            const new_person_transformation =
                Mat4.translation(
                    -1 * scaled_look_at_direction[0],
                    -1 * scaled_look_at_direction[1],
                    -1 * scaled_look_at_direction[2]
                ).times(this.person_transformation);
            const new_camera_transformation = this.camera_transformation.times(Mat4.translation(
                scaled_look_at_direction[0],
                scaled_look_at_direction[1],
                scaled_look_at_direction[2]
            ));
            // person moves backward
            const new_person_location = this.person_location.plus(scaled_look_at_direction.times(-1));
            let ok = true;
            const new_person_location_tips = this.get_person_box_tips(new_person_location);


            ok = ok && this.check_person_colliding_wall(new_person_location_tips);
            ok = ok && this.check_winning_condition(new_person_location_tips);

            if (ok) {
                this.person_transformation = new_person_transformation;
                this.camera_transformation = new_camera_transformation;
                this.person_location = new_person_location;
            }
        });
        this.key_triggered_button("Still Lighting", ["n"], () => {
            this.still_lighting = !this.still_lighting
        });

    }

    draw_box(context, program_state, model_transform, x, y, z) {
        model_transform = Mat4.identity().times(Mat4.translation(x, y, z));
        return model_transform;
    }

    draw_floor(context, program_state, shadow_pass) {
        const floor_transformation = Mat4.identity()
            .times(Mat4.translation(20, -1, -20))
            //.times(Mat4.rotation(Math.PI / 2., 1, 0, 0))
            .times(Mat4.scale(20, 0.2, 20));
        this.shapes.cube.draw(context, program_state, floor_transformation, shadow_pass ? this.materials.perlin_floor : this.materials.pure);
    }

    draw_torch(context, program_state, x, y, z) {
        if (x === 0 || x >= 40 || z === 0 || z >= 40) {
            return;
        }
        // consider x, y, z to be the bottom position
        let torch_transformation = Mat4.identity()
            .times(Mat4.translation(x, y, z))
            .times(Mat4.scale(0.08, 0.3, .08));
        this.shapes.torch_wood.draw(
            context, program_state,
            torch_transformation,
            this.materials.wood);
        this.shapes.torch_fire.draw(
            context, program_state,
            Mat4.identity()
                .times(Mat4.translation(x, y + 0.5, z))
                .times(Mat4.scale(0.2, 0.2, 0.2)),
            this.materials.torch_fire
        );
        // program_state.lights.push(new Light(vec4(x, y + 0.4, z, 1), color(0.9, 0.9, 0.5, 1), 10));
    }

    draw_person(context, program_state) {
        program_state.set_camera(this.camera_transformation)
        this.shapes.person.draw(context, program_state, this.person_transformation, this.materials.person);
    }

    texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();
        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);
        this.materials.cobble_stone_plane.light_depth_texture = this.light_depth_texture;
        this.materials.perlin_floor.light_depth_texture = this.light_depth_texture;

        this.lightDepthTextureSize = LIGHT_DEPTH_TEX_SIZE;
        gl.bindTexture(gl.TEXTURE_2D, this.lightDepthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT, // internal format
            this.lightDepthTextureSize,   // width
            this.lightDepthTextureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.UNSIGNED_INT,    // type
            null);              // data
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Depth Texture Buffer
        this.lightDepthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.lightDepthTexture,         // texture
            0);                   // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // create a color texture of the same size as the depth texture
        // see article why this is needed_
        this.unusedTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.lightDepthTextureSize,
            this.lightDepthTextureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // attach it to the framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // target
            gl.COLOR_ATTACHMENT0,  // attachment point
            gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    render_scene(context, program_state, shadow_pass, draw_light_source = false, draw_shadow = false) {
        let light_position = this.global_sun_position;
        let light_color = this.sun_light_color;
        const t = program_state.animation_time;
        program_state.draw_shadow = draw_shadow;
        let box_model_transform = Mat4.identity();

        if (draw_light_source && shadow_pass) {
            this.shapes.sphere.draw(context, program_state,
                Mat4.translation(light_position[0], light_position[1], light_position[2]).times(Mat4.scale(.5, .5, .5)),
                this.materials.light_src.override({color: light_color}));
        }

        for (let i = 0; i < this.box_coord.length; i++) {
            const x = original_box_size * this.box_coord[i][0];
            const y = original_box_size * this.box_coord[i][1];
            const z = -original_box_size * this.box_coord[i][2];
            box_model_transform = this.draw_box(context, program_state, box_model_transform, x, y, z);
            // if (i % 3 === 0) this.draw_torch(context, program_state, x + 1.0, y + 0.3, z);
            this.shapes.cube.draw(context, program_state, box_model_transform, shadow_pass ? this.materials.cobble_stone_plane : this.materials.pure);

        }
        this.draw_floor(context, program_state, shadow_pass);

    }

    draw_treasure_box(context, program_state) {
        const t = program_state.animation_time / 1000;
        const max_degree = .5 * Math.PI;
        const a = max_degree / 2;
        const b = max_degree / 2;
        const w = 2;
        const cur_degree = a + b * Math.sin(w * t);

        const box_transform =
            Mat4.translation(0, cur_degree, 0)
                .times(this.treasure_base_transform);
        this.shapes.treasure_box.draw(context, program_state, box_transform, this.materials.treasure_box);
    }

    display(context, program_state) {
        super.display(context, program_state);

        const t = program_state.animation_time;
        const gl = context.context;
        if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }
            this.texture_buffer_init(gl);

            this.init_ok = true;
        }
        if (this.still_lighting) {
            this.global_sun_position = vec4(10, 5, 0, 1);
        } else {
            this.global_sun_position = vec4(15 - 5 * Math.cos(t / 4500), 5 * Math.sin(t / 4500), 2, 1);
        }
        this.sun_light_color = hex_color("#ffffff");
        this.light_view_target = vec4(20, 0, -20, 1);
        this.light_field_of_view = 170 * Math.PI / 180;
        program_state.lights = [new Light(this.global_sun_position, this.sun_light_color, 10000)];
        this.light_view_target = vec4(10, 0, -10, 1);
        this.light_field_of_view = 170 * Math.PI / 180;
        program_state.lights = [new Light(this.global_sun_position, this.sun_light_color, (Math.sin(t / 4500) > 0 || this.still_lighting) ? 10000 : 0)]
        const light_view_mat = Mat4.look_at(
            vec3(this.global_sun_position[0], this.global_sun_position[1], this.global_sun_position[2]),
            vec3(this.light_view_target[0], this.light_view_target[1], this.light_view_target[2]),
            vec3(0, 1, 0), // assume the light to target will have a up dir of +y, maybe need to change according to your case
        );
        const light_proj_mat = Mat4.perspective(this.light_field_of_view, 1, 0.5, 500);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        program_state.light_view_mat = light_view_mat;
        program_state.light_proj_mat = light_proj_mat;
        program_state.light_tex_mat = light_proj_mat;
        program_state.view_mat = light_view_mat;
        program_state.projection_transform = light_proj_mat;
        this.render_scene(context, program_state, false, false, false);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        program_state.view_mat = program_state.camera_inverse;
        program_state.projection_transform = Mat4.perspective(Math.PI / 2.5, context.width / context.height, 0.01, 100);
        this.render_scene(context, program_state, true, true, true);

        let model_transform = Mat4.identity();
        for (let i = 0; i < this.box_coord.length; i++) {
            const x = original_box_size * this.box_coord[i][0];
            const y = original_box_size * this.box_coord[i][1];
            const z = -original_box_size * this.box_coord[i][2];
            model_transform = this.draw_box(context, program_state, model_transform, x, y, z);
            if (i % 3 === 0) this.draw_torch(context, program_state, x + 1.0, y + 0.3, z);
            // this.shapes.cube.draw(context, program_state, model_transform, this.materials.cobble_stone);
        }

        //this.draw_floor(context, program_state);
        this.draw_person(context, program_state);
        this.draw_treasure_box(context, program_state);
    }
}