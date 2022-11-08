import { defs, tiny } from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong, Fake_Bump_Map, Textured_Phong_Normal_Map} = defs;

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
            'cube': new Cube(),
        };

        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                { ambient: .4, diffusivity: .6, color: hex_color("#ffffff") }),
            cobble_stone: new Material(new Fake_Bump_Map(),
                {
                    ambient: 0.4, diffusivity: 0.3, specularity: 0.3,
                    texture: new Texture("./assets/cobble_stone/Cobblestone_001_COLOR.jpg")
                })
        };
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
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(20,10, 50, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10**5)];
    }
}

export class Assignment2 extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */
    constructor() {
        super();
        this.get_coords();
    }
    get_coords() {
        this.box_coord = [
            [0, 0, 0],
            [1, 0, 0],
            [2, 0, 0],
            [3, 0, 0],
            [4, 0, 0],
            [5, 0, 0],
            [6, 0, 0],
            [7, 0, 0],
            [8, 0, 0],
            [9, 0, 0],
            [10, 0, 0],
            [11, 0, 0],
            [12, 0, 0],
            [13, 0, 0],
            [14, 0, 0],
            [15, 0, 0],
            [16, 0, 0],
            [17, 0, 0],
            [18, 0, 0],
            [19, 0, 0],
            [20, 0, 0],
            [10, 0, 1],
            [14, 0, 1],
            [2, 0, 2],
            [3, 0, 2],
            [4, 0, 2],
            [5, 0, 2],
            [6, 0, 2],
            [7, 0, 2],
            [8, 0, 2],
            [10, 0, 2],
            [12, 0, 2],
            [13, 0, 2],
            [14, 0, 2],
            [16, 0, 2],
            [17, 0, 2],
            [18, 0, 2],
            [2, 0, 3],
            [4, 0, 3],
            [8, 0, 3],
            [16, 0, 3],
            [2, 0, 4],
            [4, 0, 4],
            [6, 0, 4],
            [7, 0, 4],
            [8, 0, 4],
            [9, 0, 4],
            [10, 0, 4],
            [11, 0, 4],
            [12, 0, 4],
            [13, 0, 4],
            [14, 0, 4],
            [16, 0, 4],
            [18, 0, 4],
            [19, 0, 4],
            [4, 0, 5],
            [8, 0, 5],
            [16, 0, 5],
            [18, 0, 5],
            [1, 0, 6],
            [2, 0, 6],
            [3, 0, 6],
            [4, 0, 6],
            [6, 0, 6],
            [8, 0, 6],
            [9, 0, 6],
            [10, 0, 6],
            [12, 0, 6],
            [14, 0, 6],
            [15, 0, 6],
            [16, 0, 6],
            [17, 0, 6],
            [18, 0, 6],
            [4, 0, 7],
            [6, 0, 7],
            [12, 0, 7],
            [18, 0, 7],
            [2, 0, 8],
            [3, 0, 8],
            [4, 0, 8],
            [5, 0, 8],
            [6, 0, 8],
            [7, 0, 8],
            [8, 0, 8],
            [9, 0, 8],
            [10, 0, 8],
            [12, 0, 8],
            [14, 0, 8],
            [15, 0, 8],
            [16, 0, 8],
            [17, 0, 8],
            [18, 0, 8],
            [2, 0, 9],
            [8, 0, 9],
            [12, 0, 9],
            [2, 0, 10],
            [4, 0, 10],
            [6, 0, 10],
            [7, 0, 10],
            [8, 0, 10],
            [10, 0, 10],
            [11, 0, 10],
            [12, 0, 10],
            [13, 0, 10],
            [14, 0, 10],
            [15, 0, 10],
            [16, 0, 10],
            [17, 0, 10],
            [18, 0, 10],
            [19, 0, 10],
            [4, 0, 11],
            [14, 0, 11],
            [16, 0, 11],
            [2, 0, 12],
            [3, 0, 12],
            [4, 0, 12],
            [6, 0, 12],
            [7, 0, 12],
            [8, 0, 12],
            [10, 0, 12],
            [11, 0, 12],
            [12, 0, 12],
            [14, 0, 12],
            [16, 0, 12],
            [17, 0, 12],
            [18, 0, 12],
            [2, 0, 13],
            [4, 0, 13],
            [8, 0, 13],
            [12, 0, 13],
            [1, 0, 14],
            [2, 0, 14],
            [4, 0, 14],
            [5, 0, 14],
            [6, 0, 14],
            [7, 0, 14],
            [8, 0, 14],
            [9, 0, 14],
            [10, 0, 14],
            [11, 0, 14],
            [12, 0, 14],
            [13, 0, 14],
            [14, 0, 14],
            [15, 0, 14],
            [16, 0, 14],
            [18, 0, 14],
            [19, 0, 14],
            [4, 0, 15],
            [8, 0, 15],
            [2, 0, 16],
            [3, 0, 16],
            [4, 0, 16],
            [6, 0, 16],
            [7, 0, 16],
            [8, 0, 16],
            [9, 0, 16],
            [10, 0, 16],
            [11, 0, 16],
            [12, 0, 16],
            [14, 0, 16],
            [15, 0, 16],
            [16, 0, 16],
            [18, 0, 16],
            [19, 0, 16],
            [10, 0, 17],
            [16, 0, 17],
            [2, 0, 18],
            [3, 0, 18],
            [4, 0, 18],
            [5, 0, 18],
            [6, 0, 18],
            [7, 0, 18],
            [8, 0, 18],
            [10, 0, 18],
            [12, 0, 18],
            [13, 0, 18],
            [14, 0, 18],
            [16, 0, 18],
            [17, 0, 18],
            [18, 0, 18],
            [19, 0, 18],
            [8, 0, 19],
            [12, 0, 19],
            [0, 0, 20],
            [0, 0, 0],
            [20, 0, 0],
            [1, 0, 20],
            [0, 0, 1],
            [20, 0, 1],
            [2, 0, 20],
            [0, 0, 2],
            [20, 0, 2],
            [3, 0, 20],
            [0, 0, 3],
            [20, 0, 3],
            [4, 0, 20],
            [0, 0, 4],
            [20, 0, 4],
            [5, 0, 20],
            [0, 0, 5],
            [20, 0, 5],
            [6, 0, 20],
            [0, 0, 6],
            [20, 0, 6],
            [7, 0, 20],
            [0, 0, 7],
            [20, 0, 7],
            [8, 0, 20],
            [0, 0, 8],
            [20, 0, 8],
            [9, 0, 20],
            [0, 0, 9],
            [20, 0, 9],
            [10, 0, 20],
            [0, 0, 10],
            [20, 0, 10],
            [11, 0, 20],
            [0, 0, 11],
            [20, 0, 11],
            [12, 0, 20],
            [0, 0, 12],
            [20, 0, 12],
            [13, 0, 20],
            [0, 0, 13],
            [20, 0, 13],
            [14, 0, 20],
            [0, 0, 14],
            [20, 0, 14],
            [15, 0, 20],
            [0, 0, 15],
            [20, 0, 15],
            [16, 0, 20],
            [0, 0, 16],
            [20, 0, 16],
            [17, 0, 20],
            [0, 0, 17],
            [20, 0, 17],
            [18, 0, 20],
            [0, 0, 18],
            [20, 0, 18],
            [19, 0, 20],
            [0, 0, 19],
            [20, 0, 19],
            [20, 0, 20],
            [0, 0, 20],
            [20, 0, 20],
        ]

    }

    set_colors() {
        // TODO:  Create a class member variable to store your cube's colors.
        // Hint:  You might need to create a member variable at somewhere to store the colors, using `this`.
        // Hint2: You can consider add a constructor for class Assignment2, or add member variables in Base_Scene's constructor.
        this.color_arr = [];
        let i = 0;
        for (i = 0; i < 8; i++) {
            this.color_arr.push(color(Math.random(), Math.random(), Math.random(), 1.0))
        }
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Change Colors", ["c"], this.set_colors);
        // Add a button for controlling the scene.
        this.key_triggered_button("Outline", ["o"], () => {
            // TODO:  Requirement 5b:  Set a flag here that will toggle your outline on and off
        });
        this.key_triggered_button("Sit still", ["m"], () => {
            // TODO:  Requirement 3d:  Set a flag here that will toggle your swaying motion on and off.
        });
    }

    draw_box(context, program_state, model_transform, x, y, z) {
        // TODO:  Helper function for requirement 3 (see hint).
        //        This should make changes to the model_transform matrix, draw the next box, and return the newest model_transform.
        // Hint:  You can add more parameters for this function, like the desired color, index of the box, etc.
        model_transform = Mat4.identity().times(Mat4.translation(x, y, z));
        return model_transform;
    }

    display(context, program_state) {
        super.display(context, program_state);
        const blue = hex_color("#1a9ffa");
        let model_transform = Mat4.identity();
        let original_box_size = 2;
        for (let i = 0; i < this.box_coord.length; i++) {
            model_transform = this.draw_box(context, program_state, model_transform,
                original_box_size * this.box_coord[i][0],
                original_box_size * this.box_coord[i][1],
                -original_box_size * this.box_coord[i][2])
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.cobble_stone);
        }
    }
}