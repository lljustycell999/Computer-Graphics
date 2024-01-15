# CSC 470 - Computer Graphics
This repository contains the projects completed as part of the CSC 470 - Computer Graphics course at SUNY Oswego taught by Professor Aleksander Pantaleev.

# Homework 1 Specification:
Implement a Sierpinski carpet in WebGL. Subdivide it to at least three steps.

# Homework 2 Specification:
Upgrade HW1 by adding manipulation and animation to the carpet. Add a slider to your web page, starting at 1 and going up to 7; the position of the slider should determine the number of subdivisions of your carpet. In addition, add a button to your page. When the button is clicked, every square of the carpet should start rotating. If you click the button again, the rotation should stop. If you click on the canvas while the squares are rotating, they should invert their rotation.

# Homework 3 Specification:
Upgrade HW2 by doing matrix transformations inside the vertex shader. The rotation now should be applied to each square separately, meaning each square should rotate around its own center, rather than the global origin. Everything else (the slider, button, canvas click) should remain on the page and preserve its functionality. Make sure you apply the angle calculation and matrix multiplications inside the shader, as opposed to your javascript.

If you are brave, you can use quarternions for the rotation. You don't have to: a simple rotation matrix around Z will work well here.

# Homework 4 Specification:
Upgrade HW3 by extending the carpet into the third dimension: each square now becomes a cube, while still lying within the same plane. The cubes are able to rotate around their own center in any direction within the 3D space (think of a good way to take that input from the user). In addition, add camera motion and rotation in all three dimensions, so that we can zoom in between the cubes and see them from the side. Again, think of a good way to take input to control the camera from the user. You can use either perspective or orthographic projection.

# Homework 5 Specification:
Upgrade HW4 by adding textures to the scene. Either use the code provided in the slides to create a checkerboard texture, or load an image of yours from an image file and convert it to a texture. Use that texture for every square of your Sierpinski carpet, making sure to apply the right mapping to all triangles in the scene. Remember to keep the code from previous homeworks, as well, such as lighting and camera motion.

# Homework 6 Specification:
Upgrade HW5 by adding a texture and a normal map to the scene. You can use this texture with this normal map. Use that texture/normal map for every square of your Sierpinski carpet, making sure to apply the right mapping to all triangles in the scene. Remember to keep the code from previous homeworks, as well, such as lighting and camera motion.

In addition, change the positions of your carpet vertices in the Z direction. This will make your carpet non-flat, and will add some interesting visuals to the normal map.

# Homework 7 Specification:
This is the last homework of the course. Write an interesting and non-trivial graphics demo using everything you have learned in the course. Make it fancy by playing with the shaders, materials, etc. Impress me.

